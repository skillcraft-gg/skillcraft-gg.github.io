#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const SKILLCRAFT_INDEX_URL = process.env.SKILLCRAFT_INDEX_URL || 'https://skillcraft.gg/skills/search/index.json'
const BASE_URL = 'https://skillcraft.gg'
const REQUEST_TIMEOUT_MS = Number(process.env.SKILLCRAFT_SMOKE_TIMEOUT_MS) || 8000
const CHECK_SOURCE_LINKS = process.env.SKILLCRAFT_CHECK_SOURCE_LINKS !== '0'

const normalize = (value) => {
  if (value === undefined || value === null) {
    return ''
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join(', ')
  }

  return String(value).trim()
}

const parseIndexPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.skills)) {
    return payload.skills
  }

  return []
}

const normalizeSkill = (entry) => {
  const owner = normalize(entry?.owner || '').toLowerCase()
  const slug = normalize(entry?.slug || entry?.name || '').toLowerCase() || normalize(entry?.id || '').toLowerCase()
  const url = normalize(entry?.url)

  return {
    owner,
    slug,
    name: normalize(entry?.name || slug || 'Untitled') || 'Untitled',
    url,
  }
}

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8')

const hasMetaDescription = (html) => /<meta\s+[^>]*name=['"]description['"][^>]*>/i.test(html)

const hasOpenGraphMeta = (html) => {
  const titleMatch = html.match(/<meta\s+[^>]*property=['"]og:title['"][^>]*>/i)
  const descriptionMatch = html.match(/<meta\s+[^>]*property=['"]og:description['"][^>]*>/i)
  const urlMatch = html.match(/<meta\s+[^>]*property=['"]og:url['"][^>]*>/i)
  return Boolean(titleMatch && descriptionMatch && urlMatch)
}

const hasTwitterMeta = (html) => html.match(/<meta\s+[^>]*name=['"]twitter:card['"][^>]*>/i)

const extractCanonical = (html) => {
  const match = html.match(/<link\s+[^>]*rel=['"]canonical['"][^>]*href=['"]([^'"]+)['"]/i)

  return match?.[1] ? match[1] : null
}

const hasJsonLdCreativeWork = (html) => {
  const match = html.match(/<script\s+[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/i)
  if (!match?.[1]) {
    return false
  }

  try {
    const json = JSON.parse(match[1])
    const hasRequiredName = typeof json?.name === 'string' && json.name.trim().length > 0
    const hasRequiredDescription = typeof json?.description === 'string' && json.description.trim().length > 0
    const hasCreator = typeof json?.author?.name === 'string' || typeof json?.creator?.name === 'string'

    return json?.['@type'] === 'CreativeWork' && hasRequiredName && hasRequiredDescription && hasCreator
  } catch {
    return false
  }
}

const extractMetaDescriptionValue = (html) => {
  const match = html.match(/<meta\s+[^>]*name=['"]description['"][^>]*content=['"]([^'"]+)['"][^>]*>/i)
  return match?.[1]?.trim() || ''
}

const hasCanonicalDomain = (canonical, expectedPath) => canonical === `${BASE_URL}${expectedPath}`

const withTimeout = (ms) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, ms)

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  }
}

const checkUrlReachable = async (url) => {
  const timeout = withTimeout(REQUEST_TIMEOUT_MS)

  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: timeout.signal,
      headers: {
        'User-Agent': 'Skillcraft-SmokeCheck/1.0',
      },
    })

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: timeout.signal,
        headers: {
          'User-Agent': 'Skillcraft-SmokeCheck/1.0',
        },
      })
    }

    return {
      ok: response.ok,
      status: response.status,
    }
  } catch (error) {
    return {
      ok: false,
      error: String(error?.name || error),
    }
  } finally {
    timeout.clear()
  }
}

const runInBatches = async (items, batchSize, worker) => {
  const results = []

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    const chunk = await Promise.all(batch.map(worker))
    results.push(...chunk)
  }

  return results
}

const validateLink = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const main = async () => {
  const projectRoot = new URL('..', import.meta.url)
  const outputDirectory = path.join(projectRoot.pathname, 'out')
  const failed = []
  let warningCount = 0
  let okCount = 0

  const outSkillsIndex = path.join(outputDirectory, 'skills', 'index.html')
  const outSitemap = path.join(outputDirectory, 'sitemap.xml')
  const outRobots = path.join(outputDirectory, 'robots.txt')

  if (!fs.existsSync(outSkillsIndex)) {
    failed.push('out/skills/index.html was not generated')
  }

  if (!fs.existsSync(outSitemap)) {
    failed.push('out/sitemap.xml was not generated')
  }

  if (!fs.existsSync(outRobots)) {
    failed.push('out/robots.txt was not generated')
  }

  const indexResponse = await fetch(SKILLCRAFT_INDEX_URL)
  if (!indexResponse.ok) {
    failed.push(`failed to fetch skill index (${indexResponse.status}) from ${SKILLCRAFT_INDEX_URL}`)
    console.error(failed[failed.length - 1])
    process.exit(1)
  }

  const indexPayload = await indexResponse.json()
  const skills = parseIndexPayload(indexPayload)
    .map(normalizeSkill)
    .filter((skill) => skill.owner && skill.slug)

  if (skills.length === 0) {
    failed.push('skill index payload contained no valid skill entries')
  }

  const sitemapHtml = fs.existsSync(outSitemap) ? readFile(outSitemap) : ''

  const sourceChecks = []

  for (const skill of skills) {
    const pagePath = path.join(outputDirectory, 'skills', skill.owner, skill.slug, 'index.html')

    if (!fs.existsSync(pagePath)) {
      failed.push(`missing skill detail page: out/skills/${skill.owner}/${skill.slug}/index.html`)
      continue
    }

    const html = readFile(pagePath)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const canonicalPath = `/skills/${skill.owner}/${skill.slug}/`

    if (!titleMatch || !titleMatch[1].trim()) {
      failed.push(`missing <title> for /skills/${skill.owner}/${skill.slug}/`)
    }

    if (!hasMetaDescription(html)) {
      failed.push(`missing meta description for /skills/${skill.owner}/${skill.slug}/`)
    } else {
      const summary = extractMetaDescriptionValue(html)
      if (summary.length < 80) {
        failed.push(`description too short for /skills/${skill.owner}/${skill.slug}/: ${summary.length} chars`)
      }
    }

    if (!hasOpenGraphMeta(html)) {
      failed.push(`missing required Open Graph metadata for /skills/${skill.owner}/${skill.slug}/`)
    }

    if (!hasTwitterMeta(html)) {
      failed.push(`missing twitter card metadata for /skills/${skill.owner}/${skill.slug}/`)
    }

    if (!hasJsonLdCreativeWork(html)) {
      failed.push(`missing CreativeWork JSON-LD for /skills/${skill.owner}/${skill.slug}/`)
    }

    if (!sitemapHtml || !sitemapHtml.includes(`${BASE_URL}/skills/${skill.owner}/${skill.slug}/`)) {
      failed.push(`sitemap missing /skills/${skill.owner}/${skill.slug}/`)
    }

    const canonical = extractCanonical(html)
    if (!canonical) {
      failed.push(`missing canonical link for /skills/${skill.owner}/${skill.slug}/`)
    } else {
      const hasExpectedCanonical = hasCanonicalDomain(canonical, canonicalPath)
      if (!hasExpectedCanonical) {
        failed.push(`canonical mismatch on /skills/${skill.owner}/${skill.slug}/: ${canonical}`)
      }
    }

    if (skill.url) {
      sourceChecks.push({
        owner: skill.owner,
        slug: skill.slug,
        url: skill.url,
      })
    } else {
      warningCount += 1
      console.log(`warning: no source URL for /skills/${skill.owner}/${skill.slug}/`)
    }

    okCount += 1
  }

  if (CHECK_SOURCE_LINKS) {
    const sourceResults = await runInBatches(
      sourceChecks,
      6,
      async ({ owner, slug, url }) => {
        if (!validateLink(url)) {
          return { owner, slug, failed: true, reason: `invalid source URL (${url})` }
        }

        const status = await checkUrlReachable(url)
        if (!status.ok) {
          return {
            owner,
            slug,
            failed: true,
            reason: status.error || `HTTP ${status.status}`,
            url,
          }
        }

        return { owner, slug, failed: false }
      },
    )

    for (const sourceResult of sourceResults) {
      if (sourceResult.failed) {
        failed.push(`source URL check failed for ${sourceResult.owner}/${sourceResult.slug}: ${sourceResult.reason}`)
      }
    }
  }

  const robotsHtml = fs.existsSync(outRobots) ? readFile(outRobots).toLowerCase() : ''
  if (!robotsHtml.includes('disallow: /loadouts') || !robotsHtml.includes('disallow: /credentials')) {
    failed.push('robots.txt should disallow /loadouts and /credentials')
  }

  if (failed.length > 0) {
    console.log(`\nSkills smoke check failed (${failed.length} issues):`)
    for (const item of failed) {
      console.log(`- ${item}`)
    }
    process.exit(1)
  }

  console.log(`\nSkills smoke check passed for ${okCount} detail pages.`)
  if (warningCount > 0) {
    console.log(`Warnings: ${warningCount}`)
  }
}

main().catch((error) => {
  console.error('skills smoke check crashed:', error)
  process.exit(1)
})
