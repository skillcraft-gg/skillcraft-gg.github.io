import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import AppShell from '../../../components/AppShell'
import { MarkdownDescription } from '../../../components/skills/MarkdownDescription'
import NewsJsonLd from '../../../components/seo/NewsJsonLd'
import NewsPostThemeToggle from '../../../components/news/NewsPostThemeToggle'
import LandingFooter from '../../../components/LandingFooter'
import {
  findCredentialByPath,
  fetchCredentialIndex,
  type CredentialDefinition,
} from '../../../lib/credentialIndex'
import { findSkillByPath, fetchSkillIndex, type SkillRecord } from '../../../lib/skillIndex'
import {
  getAllNewsPosts,
  getNewsPostBySlug,
  formatNewsPostDate,
  type NewsPost,
  normalizeResourceSlug,
} from '../../../lib/newsPosts'
import { withSocialImageDefaults } from '../../../lib/metadata'

const NEWS_SIDEBAR_LIMIT = 5

const NpmLogo = () => (
  <svg viewBox="0 0 18 7" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path fill="#CB3837" d="M0,0h18v6H9v1H5V6H0V0z M1,5h2V2h1v3h1V1H1V5z M6,1v5h2V5h2V1H6z M8,2h1v2H8V2z M11,1v4h2V2h1v3h1V2h1v3h1V1H11z" />
    <polygon fill="#FFFFFF" points="1,5 3,5 3,2 4,2 4,5 5,5 5,1 1,1 " />
    <path fill="#FFFFFF" d="M6,1v5h2V5h2V1H6z M9,4H8V2h1V4z" />
    <polygon fill="#FFFFFF" points="11,1 11,5 13,5 13,2 14,2 14,5 15,5 15,2 16,2 16,5 17,5 17,1 " />
  </svg>
)

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.387 7.86 10.91.574.105.783-.25.783-.555 0-.273-.01-1.12-.016-2.02-3.197.695-3.873-1.54-3.873-1.54-.522-1.327-1.275-1.68-1.275-1.68-1.044-.714.08-.7.08-.7 1.155.081 1.763 1.187 1.763 1.187 1.026 1.757 2.692 1.25 3.35.955.104-.742.4-1.251.726-1.539-2.553-.29-5.237-1.276-5.237-5.678 0-1.255.45-2.281 1.186-3.084-.119-.29-.513-1.462.112-3.047 0 0 .968-.31 3.173 1.178a11.04 11.04 0 0 1 2.89-.387c.98.005 1.965.132 2.89.387 2.204-1.488 3.17-1.178 3.17-1.178.627 1.585.233 2.757.114 3.047.738.803 1.185 1.83 1.185 3.084 0 4.412-2.687 5.385-5.249 5.67.41.353.775 1.05.775 2.116 0 1.529-.014 2.762-.014 3.138 0 .307.206.666.79.553C20.713 21.38 24 17.08 24 12 24 5.65 18.85.5 12 .5Z"
    />
  </svg>
)

const GITHUB_HANDLE_RE = /^[a-z0-9](?:[a-z0-9_-]{0,38}[a-z0-9])?$/i

type NewsPostAuthorProfile = {
  handle: string
  platform: string
}

const resolveNewsAuthorProfile = (author: string): NewsPostAuthorProfile | null => {
  const value = (author || '').trim()
  if (!value) {
    return null
  }

  const withoutAt = value.replace(/^@/i, '')

  const buildProfile = (platform: string, candidate: string): NewsPostAuthorProfile | null => {
    const handle = candidate.toLowerCase()
    if (!GITHUB_HANDLE_RE.test(handle)) {
      return null
    }

    return {
      handle,
      platform: platform || 'github',
    }
  }

  const githubUrlMatch = withoutAt.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)(?:[/?#].*)?$/i)
  if (githubUrlMatch && GITHUB_HANDLE_RE.test(githubUrlMatch[1])) {
    return {
      handle: githubUrlMatch[1].toLowerCase(),
      platform: 'github',
    }
  }

  const normalized = withoutAt.replace(/\/+$/, '')
  const [pathSegment] = normalized.split(/[\s?#]/, 1)
  const pathParts = (pathSegment || '').split('/')
  const [platformCandidate, handleCandidate] = pathParts

  const direct = buildProfile('github', pathSegment)
  if (direct) {
    return direct
  }

  if (platformCandidate && handleCandidate) {
    return buildProfile(platformCandidate, handleCandidate)
  }

  if (pathParts.length >= 1) {
    return buildProfile('github', pathParts[0])
  }

  return null
}

const NewsPageSidebar = ({ posts }: { posts: NewsPost[] }) => (
  <>
    <div className="skill-install-card news-post-sidebar-card" aria-label="News page intro">
      <p className="label">Welcome, Skillcrafter</p>
      <p className="caption">
        AI has collapsed the cost of building. One developer can ship systems that used to take teams.
        Build fast, but make your proof work visible with verifiable evidence.
      </p>

      <div className="skill-install-row skill-install-row--stacked">
        <Link className="btn btn-primary btn-flat" href="/#get-started">Get Started</Link>
        <a
          className="btn btn-secondary"
          href="https://github.com/skillcraft-gg/skillcraft"
          target="_blank"
          rel="noreferrer"
        >
          <span className="btn-icon" aria-hidden="true">
            <GitHubLogo />
          </span>
          View on GitHub
        </a>
        <a
          className="btn btn-secondary"
          href="https://www.npmjs.com/package/skillcraft"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="btn-icon npm-icon" aria-hidden="true">
            <NpmLogo />
          </span>
          View on npm
        </a>
      </div>
    </div>

    {posts.length > 0 ? (
      <div className="skill-install-card" aria-label="Other news items">
        <p className="label">Other news</p>
        <ul className="detail-list detail-list--compact" aria-label="More Skillcraft news posts">
          {posts.map((entry) => (
            <li key={entry.slug}>
              <p className="kicker">{formatNewsPostDate(entry.date)} · {entry.author}</p>
              <Link className="text-link" href={buildCanonical(entry.slug)}>{entry.title}</Link>
              <p className="caption">{entry.description}</p>
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </>
)

type NewsPostParams = {
  slug: string
}

const BASE_URL = 'https://skillcraft.gg'
const SEO_KEYWORD_TARGET = 120

const buildCanonical = (slug: string) => `/news/${slug}/`

const ensureSeoDescription = (value: string, fallback: string): string => {
  const trimmed = value.trim()
  if (trimmed.length >= SEO_KEYWORD_TARGET) {
    return trimmed
  }

  return `${trimmed} ${fallback}`
}

const buildPostTitle = (title: string) => {
  const marker = 'so how do you prove it?'
  const lower = title.toLowerCase()
  const index = lower.indexOf(marker)

  if (index === -1) {
    return title
  }

  const before = title.slice(0, index)
  const highlighted = title.slice(index, index + marker.length)
  const after = title.slice(index + marker.length)

  return (
    <>
      {before}
      <span className="news-post-title-highlight">{highlighted}</span>
      {after}
    </>
  )
}

const safeFetchSkills = async () => {
  try {
    return await fetchSkillIndex()
  } catch {
    return []
  }
}

const safeFetchCredentials = async () => {
  try {
    return await fetchCredentialIndex()
  } catch {
    return []
  }
}

const parseReference = (value: string): { owner: string; slug: string } | null => {
  const cleaned = normalizeResourceSlug(value)
  if (!cleaned) {
    return null
  }

  const [owner, slug] = cleaned.split('/')
  if (!owner || !slug) {
    return null
  }

  return { owner, slug }
}

const pickRelatedSkills = (skills: SkillRecord[], refs: string[]) => {
  const seen = new Set<string>()

  return refs
    .map(parseReference)
    .map((reference) => {
      if (!reference) {
        return null
      }

      return findSkillByPath(skills, reference.owner, reference.slug)
    })
    .filter((entry): entry is SkillRecord => Boolean(entry))
    .filter((entry) => {
      const key = `${entry.owner}/${entry.slug}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

const pickRelatedCredentials = (credentials: CredentialDefinition[], refs: string[]) => {
  const seen = new Set<string>()
  const normalizedRefs = refs
    .map(parseReference)
    .filter((value): value is { owner: string; slug: string } => Boolean(value))

  return normalizedRefs
    .map(({ owner, slug }) => findCredentialByPath(credentials, owner, slug))
    .filter((entry): entry is NonNullable<ReturnType<typeof findCredentialByPath>> => Boolean(entry))
    .filter((entry) => {
      const key = `${entry.owner}/${entry.slug}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

const pickRelatedPosts = (allPosts: NewsPost[], post: NewsPost) => {
  const allBySlug = new Map<string, NewsPost>(allPosts.map((entry) => [entry.slug, entry]))
  const seen = new Set<string>()

  const explicit = post.relatedPosts
    .map((reference) => normalizeResourceSlug(reference))
    .map((reference) => allBySlug.get(reference))
    .filter((entry): entry is NewsPost => Boolean(entry))
    .filter((entry) => {
      if (entry.slug === post.slug || seen.has(entry.slug)) {
        return false
      }

      seen.add(entry.slug)
      return true
    })

  if (explicit.length > 0) {
    return explicit
  }

  return allPosts
    .filter((entry) => entry.slug !== post.slug)
    .slice(0, 3)
}

export const generateStaticParams = async (): Promise<NewsPostParams[]> => {
  const posts = await getAllNewsPosts()

  return posts.map((post) => ({ slug: post.slug }))
}

export const generateMetadata = async ({ params }: { params: NewsPostParams }): Promise<Metadata> => {
  const slug = normalizeResourceSlug(decodeURIComponent((params.slug || '').toLowerCase()))
  const post = await getNewsPostBySlug(slug)

  if (!post) {
    return withSocialImageDefaults({
      title: 'News Post Not Found | Skillcraft',
      description: 'This post could not be found.',
      alternates: {
        canonical: `${BASE_URL}${buildCanonical(slug)}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    })
  }

  const description = ensureSeoDescription(
    post.description,
    `${post.title} discusses how Skillcraft turns AI-assisted development into verifiable evidence through skills and credentials.`,
  )

  return withSocialImageDefaults({
    title: `${post.title} | Skillcraft News`,
    description,
    alternates: {
      canonical: `${BASE_URL}${buildCanonical(post.slug)}`,
    },
    openGraph: {
      type: 'article',
      url: `${BASE_URL}${buildCanonical(post.slug)}`,
      title: `${post.title} | Skillcraft News`,
      description,
      images: [
        {
          url: post.heroImage || '/images/og-home.jpg',
          width: 1200,
          height: 630,
          alt: `${post.title} | Skillcraft News`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Skillcraft News`,
      description,
      images: [post.heroImage || '/images/og-home.jpg'],
    },
    keywords: post.tags,
  })
}

export default async function NewsPostPage({ params }: { params: NewsPostParams }) {
  const slug = normalizeResourceSlug(decodeURIComponent((params.slug || '').toLowerCase()))
  const post = await getNewsPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const [allPosts, skills, credentials] = await Promise.all([
    getAllNewsPosts(),
    safeFetchSkills(),
    safeFetchCredentials(),
  ])

  const relatedSkills = pickRelatedSkills(skills, post.relatedSkills)
  const relatedCredentials = pickRelatedCredentials(credentials, post.relatedCredentials)
  const relatedPosts = pickRelatedPosts(allPosts, post)
  const authorProfile = resolveNewsAuthorProfile(post.author)
  const sidebarPosts = allPosts
    .filter((entry) => entry.slug !== post.slug)
    .slice(0, NEWS_SIDEBAR_LIMIT)
  const hasMultiplePosts = allPosts.length > 1
  const authorLine = (
    <p className="kicker news-post-author-line" style={{ marginBottom: 0 }}>
      {formatNewsPostDate(post.date)}
      {authorProfile ? (
        <>
          <span aria-hidden="true">·</span>
          <span>Written by</span>
          <Link
            className="tag news-post-author-link"
            href={`/credentials/profiles/github/${authorProfile.handle}/`}
            aria-label={`Open profile for ${authorProfile.handle}`}
          >
            <span className="news-post-author-prefix">@{authorProfile.handle}</span>
          </Link>
        </>
      ) : (
        <span>
          Written by {post.author}
        </span>
      )}
    </p>
  )

  return (
    <>
      <NewsJsonLd
        post={post}
        canonicalUrl={`${BASE_URL}${buildCanonical(post.slug)}`}
      />

      <AppShell
        title={`News / ${post.title}`}
        activePath="/news"
        copyClassName="copy--wide"
        fullBleed
        heroClassName="hero--landing"
      >
        <div id="news-post-reader" className="news-post-reader news-post-single-color" data-news-theme="dark">
          <section className="section news-post-single-section skill-detail" aria-label={`News post ${post.title}`}>
            <div className="detail-summary-layout">
              <div className="detail-summary-column">
                <div className={`detail-topbar news-post-topbar${hasMultiplePosts ? '' : ' news-post-topbar--meta'}`}>
                  {hasMultiplePosts ? (
                    <Link href="/news" className="btn btn-secondary detail-back-link">
                      ← Back to News
                    </Link>
                  ) : authorLine}
                  <NewsPostThemeToggle targetId="news-post-reader" />
                </div>

                  {hasMultiplePosts ? authorLine : null}
                <h1>{buildPostTitle(post.title)}</h1>
                <p className="workflow-copy news-post-description" style={{ marginTop: 12 }}>{post.description}</p>

                <article className="news-post-main-content">
                  <MarkdownDescription content={post.content} className="blog-markdown" />
                </article>

                {relatedSkills.length > 0 || relatedCredentials.length > 0 || relatedPosts.length > 0 ? (
                  <div className="news-post-related" aria-label="Related content">
                    <p className="kicker">Deep links</p>

                    {relatedSkills.length > 0 ? (
                      <div className="panel" style={{ marginBottom: 12 }}>
                        <h2 className="panel-title">Related skills</h2>
                        <ul className="detail-list detail-list--compact">
                          {relatedSkills.map((entry) => (
                            <li key={`${entry.owner}/${entry.slug}`}>
                              <strong>{entry.owner}/{entry.slug}</strong>
                              <Link className="text-link" href={`/skills/${entry.owner}/${entry.slug}/`}>Open skill</Link>
                              <p className="caption">{entry.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {relatedCredentials.length > 0 ? (
                      <div className="panel" style={{ marginBottom: 12 }}>
                        <h2 className="panel-title">Related credentials</h2>
                        <ul className="detail-list detail-list--compact">
                          {relatedCredentials.map((entry) => (
                            <li key={`${entry.owner}/${entry.slug}`}>
                              <strong>{entry.owner}/{entry.slug}</strong>
                              <Link className="text-link" href={`/credentials/${entry.owner}/${entry.slug}/`}>Open credential</Link>
                              <p className="caption">{entry.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {relatedPosts.length > 0 ? (
                      <div className="panel">
                        <h2 className="panel-title">Related posts</h2>
                        <div className="blog-related-grid">
                          {relatedPosts.map((entry) => (
                            <article className="panel" key={entry.slug}>
                              <p className="kicker">{formatNewsPostDate(entry.date)} · {entry.author}</p>
                              <h3>
                                <Link className="text-link" href={buildCanonical(entry.slug)}>{entry.title}</Link>
                              </h3>
                              <p className="workflow-copy" style={{ marginTop: 10 }}>{entry.description}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}

                     {post.tags.length > 0 ? (
                       <div className="panel" style={{ marginTop: 12 }}>
                         <h2 className="panel-title">Labels</h2>
                         <div className="tag-row" aria-label="Post tags">
                           {post.tags.map((tag) => (
                             <span key={tag} className="tag">{tag}</span>
                           ))}
                         </div>
                       </div>
                     ) : null}
                   </div>
                 ) : null}

                 <div className="skill-install-card skill-install-card--neutral news-post-welcome-card" aria-label="Welcome to Skillcraft">
                   <hr className="welcome-skillcraft-rule" />
                    <p className="news-post-welcome-title workflow-copy news-post-description">
                      Welcome to <span className="accent">Skillcraft</span>
                    </p>
                    <p className="news-post-main-copy">
                      Join the Skillcraft beta and prove your AI coding skills. While in beta, Skillcraft requires a GitHub account and
                      all claims must come from commits pushed to public GitHub repositories. OpenCode is currently supported.
                      We'd love your feedback through the beta and let us know what you think.
                  </p>
                  <div className="skill-install-row skill-install-row--stacked news-post-welcome-actions">
                    <Link className="btn btn-primary btn-flat" href="/docs/tutorials/first-credential">
                      Earn Your First Credential
                    </Link>
                    <Link className="btn btn-secondary" href="/docs">
                      View Documentation
                    </Link>
                    <a
                      className="btn btn-secondary"
                      href="https://github.com/orgs/skillcraft-gg/discussions/new/choose"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                     <span className="btn-icon" aria-hidden="true">
                       <GitHubLogo />
                     </span>
                      Join the Discussion
                    </a>
                  </div>
                </div>
              </div>

              <div className="detail-action-row">
                <NewsPageSidebar posts={sidebarPosts} />
              </div>
            </div>
          </section>

          <LandingFooter />
        </div>
      </AppShell>
    </>
  )
}
