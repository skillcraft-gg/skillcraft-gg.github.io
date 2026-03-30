import Link from 'next/link'

import { type IssuedUserRecord } from '../../lib/issuedCredentialsIndex'

type CredentialProfilesListProps = {
  profiles: IssuedUserRecord[]
}

const buildProfileLabel = (github: string) => github || 'unknown'

const buildIssuedLabel = (count: number) => {
  if (count <= 0) {
    return 'No credentials issued yet'
  }

  if (count === 1) {
    return '1 credential issued'
  }

  return `${count} credentials issued`
}

export default function CredentialProfilesList({ profiles }: CredentialProfilesListProps) {
  if (profiles.length === 0) {
    return (
      <section className="section" aria-label="Credential profiles directory">
        <p className="caption">
          Credential profile indexing has not been populated yet. This section will show active
          GitHub profiles as they earn credentials.
        </p>
      </section>
    )
  }

  return (
    <section className="section" aria-label="Credential profiles directory">
      <div className="item-grid item-grid--credentials">
        {profiles.map((profile) => {
          const label = buildProfileLabel(profile.github)
          const issuedLabel = buildIssuedLabel(profile.issuedCount)
          const path = `/credentials/profiles/github/${label}/`

          return (
            <article key={profile.github} className="skill-card">
              <Link href={path} className="skill-link-row">
                <div>
                  <h3>@{label}</h3>
                  <p className="caption">{issuedLabel}</p>
                </div>
                <span className="tag" aria-hidden="true">View profile</span>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
