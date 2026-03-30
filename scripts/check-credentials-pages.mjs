#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://skillcraft.gg'
const CREDENTIAL_INDEX_URL = process.env.CREDENTIAL_INDEX_URL || 'https://skillcraft.gg/credential-ledger/credentials/index.json'
const ISSUED_CREDENTIAL_INDEX_URL = process.env.ISSUED_CREDENTIAL_INDEX_URL
  || 'https://skillcraft.gg/credential-ledger/issued/users/index.json'
const REQUEST_TIMEOUT_MS = Number(process.env.SKILLCRAFT_SMOKE_TIMEOUT_MS) || 8000
const CHECK_SOURCE_LINKS = process.env.SKILLCRAFT_CHECK_SOURCE_LINKS !== '0'

const normalize = (value) => {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).trim()
}

const normalizeSourceCommits = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((commit) => normalize(commit))
    .filter(Boolean)
}

const parseCredentialIndexPayload = (payload) => {
  const entries = Array.isArray(payload) ? payload : []

  return entries
    .map((entry) => ({
      owner: normalize(entry?.owner).toLowerCase(),
      slug: normalize(entry?.slug).toLowerCase()
        || normalize(entry?.id).toLowerCase().split('/')[1]
        || normalize(entry?.path).toLowerCase().split('/').filter(Boolean).slice(-1)[0],
      name: normalize(entry?.name || entry?.slug || 'Untitled') || 'Untitled',
      url: normalize(entry?.url),
      description: normalize(entry?.description),
    }))
    .filter((credential) => credential.owner && credential.slug)
}

const parseIssuedCredential = (entry) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null
  }

  const definition = normalize(entry.definition)
    || normalize(entry.definitionOwner && `${entry.definitionOwner}/${entry.definitionSlug}`)
  if (!definition) {
    return null
  }

  const [definitionOwner, definitionSlug] = definition
    .toLowerCase()
    .split('/')
    .filter(Boolean)

  if (!definitionOwner || !definitionSlug) {
    return null
  }

  return {
    definition,
    definitionOwner,
    definitionSlug,
    issuedAt: normalize(entry.issuedAt || entry.issued_at),
    claimId: normalize(entry.claimId || entry.claim_id),
    sourceCommits: normalizeSourceCommits(entry.sourceCommits || entry.source_commits),
    path: normalize(entry.path),
    subject: entry.subject && typeof entry.subject === 'object' && !Array.isArray(entry.subject)
      ? entry.subject
      : {},
  }
}

const parseIssuedProfile = (entry) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null
  }

  const github = normalize(entry.github).replace(/^@/, '').toLowerCase()
  if (!github) {
    return null
  }

  const credentials = Array.isArray(entry.credentials)
    ? entry.credentials
      .map((item) => parseIssuedCredential(item))
      .filter(Boolean)
      .sort((left, right) => {
        const leftTime = Date.parse(left.issuedAt)
        const rightTime = Date.parse(right.issuedAt)
        const leftValue = Number.isNaN(leftTime) ? 0 : leftTime
        const rightValue = Number.isNaN(rightTime) ? 0 : rightTime

        if (rightValue === leftValue) {
          return left.definition.localeCompare(right.definition)
        }

        return rightValue - leftValue
      })
    : []

  return {
    github,
    issuedCount: Number.isFinite(Number(entry.issuedCount))
      ? Math.max(0, Number(entry.issuedCount))
      : credentials.length,
    credentials,
  }
}

const isObjectRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)

const parseIssuedIndexPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const entries = Array.isArray(payload)
    ? payload
    : isObjectRecord(payload)
      ? (Array.isArray(payload.credentials) && payload.github
        ? [payload]
        : Object.values(payload))
      : []

  return entries
    .map((entry) => parseIssuedProfile(entry))
    .filter(Boolean)
    .sort((left, right) => left.github.localeCompare(right.github))
}

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
    const hasName = typeof json?.name === 'string' && json.name.trim().length > 0
    const hasDescription = typeof json?.description === 'string' && json.description.trim().length > 0
    const hasCreator = typeof json?.author?.name === 'string' || typeof json?.creator?.name === 'string'

    return json?.['@type'] === 'CreativeWork' && hasName && hasDescription && hasCreator
  } catch {
    return false
  }
}

const extractMetaDescriptionValue = (html) => {
  const match = html.match(/<meta\s+[^>]*name=['"]description['"][^>]*content=['"]([^'"]+)['"][^>]*>/i)
  return match?.[1]?.trim() || ''
}

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8')

const withTimeout = (ms) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)

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
        'User-Agent': 'Skillcraft-Credentials-SmokeCheck/1.0',
      },
    })

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: timeout.signal,
        headers: {
          'User-Agent': 'Skillcraft-Credentials-SmokeCheck/1.0',
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

const parseLink = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const dedupeByUrl = (routes) => {
  const seen = new Set()
  return routes.filter((entry) => {
    if (seen.has(entry.url)) {
      return false
    }

    seen.add(entry.url)
    return true
  })
}

const ensureExpectedInSitemap = (sitemapHtml, pathValue, failed, pathLabel) => {
  const expected = `${BASE_URL}${pathValue}`
  if (!sitemapHtml.includes(expected)) {
    failed.push(`sitemap missing ${pathLabel}: ${expected}`)
  }
}

const parseProfileCredentialRoutes = (profiles) => profiles.flatMap((profile) => profile.credentials.map((credential) => ({
  handle: profile.github,
  owner: credential.definitionOwner,
  slug: credential.definitionSlug,
})) )

const main = async () => {
  const projectRoot = new URL('..', import.meta.url)
  const outputDirectory = path.join(projectRoot.pathname, 'out')
  const failed = []
  let okCount = 0

  const outCredentialsIndex = path.join(outputDirectory, 'credentials', 'index.html')
  const outProfilesIndex = path.join(outputDirectory, 'credentials', 'profiles', 'index.html')
  const outSitemap = path.join(outputDirectory, 'sitemap.xml')
  const outRobots = path.join(outputDirectory, 'robots.txt')

  if (!fs.existsSync(outCredentialsIndex)) {
    failed.push('out/credentials/index.html was not generated')
  }

  if (!fs.existsSync(outProfilesIndex)) {
    failed.push('out/credentials/profiles/index.html was not generated')
  }

  if (!fs.existsSync(outSitemap)) {
    failed.push('out/sitemap.xml was not generated')
  }

  if (!fs.existsSync(outRobots)) {
    failed.push('out/robots.txt was not generated')
  }

  const credentialResponse = await fetch(CREDENTIAL_INDEX_URL)
  if (!credentialResponse.ok) {
    failed.push(`failed to fetch credential index (${credentialResponse.status}) from ${CREDENTIAL_INDEX_URL}`)
    console.error(failed[failed.length - 1])
    process.exit(1)
  }

  const issuedResponse = await fetch(ISSUED_CREDENTIAL_INDEX_URL)
  if (!issuedResponse.ok) {
    failed.push(`failed to fetch issued credential index (${issuedResponse.status}) from ${ISSUED_CREDENTIAL_INDEX_URL}`)
    console.error(failed[failed.length - 1])
    process.exit(1)
  }

  const credentialPayload = await credentialResponse.json()
  const issuedPayload = await issuedResponse.json()

  const credentials = parseCredentialIndexPayload(credentialPayload)
  const issuedProfiles = parseIssuedIndexPayload(issuedPayload)

  if (credentials.length === 0) {
    failed.push('credential index payload contained no valid definitions')
  }

  const issuedProfilePairs = parseProfileCredentialRoutes(issuedProfiles)

  const sitemapHtml = fs.existsSync(outSitemap) ? readFile(outSitemap) : ''

  const sourceChecks = []

  for (const credential of credentials) {
    const pagePath = path.join(outputDirectory, 'credentials', credential.owner, credential.slug, 'index.html')

    if (!fs.existsSync(pagePath)) {
      failed.push(`missing credential detail page: out/credentials/${credential.owner}/${credential.slug}/index.html`)
      continue
    }

    const html = readFile(pagePath)
    const canonicalPath = `/credentials/${credential.owner}/${credential.slug}/`

    if (!hasMetaDescription(html)) {
      failed.push(`missing meta description for /credentials/${credential.owner}/${credential.slug}/`)
    } else {
      const summary = extractMetaDescriptionValue(html)
      if (summary.length < 80) {
        failed.push(`description too short for /credentials/${credential.owner}/${credential.slug}/: ${summary.length} chars`)
      }
    }

    if (!hasOpenGraphMeta(html)) {
      failed.push(`missing required Open Graph metadata for /credentials/${credential.owner}/${credential.slug}/`)
    }

    if (!hasTwitterMeta(html)) {
      failed.push(`missing twitter card metadata for /credentials/${credential.owner}/${credential.slug}/`)
    }

    if (!hasJsonLdCreativeWork(html)) {
      failed.push(`missing CreativeWork JSON-LD for /credentials/${credential.owner}/${credential.slug}/`)
    }

    ensureExpectedInSitemap(sitemapHtml, canonicalPath, failed, 'credential detail entry')

    const canonical = extractCanonical(html)
    if (!canonical) {
      failed.push(`missing canonical link for /credentials/${credential.owner}/${credential.slug}/`)
    }

    if (credential.url) {
      sourceChecks.push({
        owner: credential.owner,
        slug: credential.slug,
        url: credential.url,
      })
    }

    okCount += 1
  }

  const profilePagePath = path.join(outputDirectory, 'credentials', 'profiles')
  if (issuedProfiles.length === 0 && !fs.existsSync(path.join(profilePagePath, 'index.html'))) {
    failed.push('out/credentials/profiles/index.html was not generated')
  }

  const profilePairs = dedupeByUrl(issuedProfiles.map((profile) => ({
    profile,
    url: `/credentials/profiles/github/${profile.github}/`,
  })))

  for (const entry of issuedProfiles) {
    const profilePath = path.join(outputDirectory, 'credentials', 'profiles', 'github', entry.github, 'index.html')
    if (!fs.existsSync(profilePath)) {
      failed.push(`missing profile page: out/credentials/profiles/github/${entry.github}/index.html`)
      continue
    }

    const profileHtml = readFile(profilePath)
    const canonicalPath = `/credentials/profiles/github/${entry.github}/`

    if (!hasMetaDescription(profileHtml)) {
      failed.push(`missing meta description for ${canonicalPath}`)
    }

    if (!hasOpenGraphMeta(profileHtml)) {
      failed.push(`missing required Open Graph metadata for ${canonicalPath}`)
    }

    if (!hasTwitterMeta(profileHtml)) {
      failed.push(`missing twitter card metadata for ${canonicalPath}`)
    }

    if (!extractCanonical(profileHtml)) {
      failed.push(`missing canonical link for ${canonicalPath}`)
    }

    ensureExpectedInSitemap(sitemapHtml, canonicalPath, failed, 'profile page entry')
  }

  const issuedPairs = dedupeByUrl(issuedProfilePairs.map((entry) => ({
    handle: entry.handle,
    owner: entry.owner,
    slug: entry.slug,
    canonicalPath: `/credentials/profiles/github/${entry.handle}/${entry.owner}/${entry.slug}/`,
    url: `${BASE_URL}/credentials/profiles/github/${entry.handle}/${entry.owner}/${entry.slug}/`,
  })))

  for (const entry of issuedPairs) {
    if (!entry.owner || !entry.slug) {
      continue
    }

    const pagePath = path.join(outputDirectory, 'credentials', 'profiles', 'github', entry.handle, entry.owner, entry.slug, 'index.html')
    if (!fs.existsSync(pagePath)) {
      continue
    }

    const html = readFile(pagePath)
    if (!hasMetaDescription(html)) {
      failed.push(`missing meta description for ${entry.canonicalPath}`)
    }

    if (!hasOpenGraphMeta(html)) {
      failed.push(`missing required Open Graph metadata for ${entry.canonicalPath}`)
    }

    if (!hasTwitterMeta(html)) {
      failed.push(`missing twitter card metadata for ${entry.canonicalPath}`)
    }

    if (!hasJsonLdCreativeWork(html)) {
      failed.push(`missing CreativeWork JSON-LD for ${entry.canonicalPath}`)
    }

    ensureExpectedInSitemap(sitemapHtml, entry.canonicalPath, failed, 'issued credential detail entry')
  }

  ensureExpectedInSitemap(sitemapHtml, '/credentials', failed, 'credentials index entry')
  ensureExpectedInSitemap(sitemapHtml, '/credentials/profiles', failed, 'credentials profiles index entry')

  if (CHECK_SOURCE_LINKS) {
    const sourceResults = await runInBatches(
      sourceChecks,
      6,
      async ({ owner, slug, url }) => {
        if (!parseLink(url)) {
          return {
            owner,
            slug,
            failed: true,
            reason: `invalid source URL (${url})`,
          }
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
  if (!robotsHtml.includes('disallow: /loadouts')) {
    failed.push('robots.txt should disallow /loadouts')
  }

  if (robotsHtml.includes('disallow: /credentials')) {
    failed.push('robots.txt should not disallow /credentials')
  }

  if (failed.length > 0) {
    console.log(`\nCredentials smoke check failed (${failed.length} issues):`)
    for (const item of failed) {
      console.log(`- ${item}`)
    }
    process.exit(1)
  }

  console.log(`\nCredentials smoke check passed for ${okCount} credential detail pages.`)
}

main().catch((error) => {
  console.error('credentials smoke check crashed:', error)
  process.exit(1)
})
