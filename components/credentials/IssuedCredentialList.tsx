import Link from 'next/link'

import CredentialImageFallback from './CredentialImageFallback'
import { resolveCredentialImage } from './credentialImageResolver'
import { type CredentialDefinition } from '../../lib/credentialIndex'
import { type IssuedCredentialSummary } from '../../lib/issuedCredentialsIndex'

type IssuedCredentialListProps = {
  handle: string
  credentials: IssuedCredentialSummary[]
  definitions?: Record<string, CredentialDefinition>
}

const normalizeDate = (value: string) => {
  if (!value) {
    return 'Unknown issue date'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return new Date(parsed).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const buildDefinitionImageUrl = (
  credential: IssuedCredentialSummary,
  definitions?: Record<string, CredentialDefinition>,
) => {
  const definition = definitions?.[credential.definition]
    || definitions?.[`${credential.definitionOwner}/${credential.definitionSlug}`]

  if (!definition) {
    return resolveCredentialImage({
      images: {},
      path: '',
      owner: credential.definitionOwner,
      slug: credential.definitionSlug,
    })
  }

  return resolveCredentialImage(definition)
}

export default function IssuedCredentialList({ handle, credentials, definitions }: IssuedCredentialListProps) {
  if (credentials.length === 0) {
    return (
      <section className="section" aria-label="Issued credentials">
        <p className="caption">No credentials were found for this profile.</p>
      </section>
    )
  }

  return (
    <section className="section" aria-label={`Issued credentials for ${handle}`}>
      <div className="item-grid item-grid--credentials">
        {credentials.map((credential) => {
          const detailPath = `/credentials/profiles/github/${handle}/${credential.definitionOwner}/${credential.definitionSlug}/`
          const verifyPath = `${detailPath}?verify`
          const issuedAtLabel = normalizeDate(credential.issuedAt)
          const commitCount = credential.sourceCommits.length
          const hasCommitText = commitCount > 0
            ? `${commitCount} source commit${commitCount === 1 ? '' : 's'} referenced`
            : 'No source commit references provided'
          const definitionImage = buildDefinitionImageUrl(credential, definitions)

          return (
           <article key={`${handle}-${credential.definitionOwner}-${credential.definitionSlug}-${credential.claimId || credential.definition}`} className="skill-card">
              <div className="credential-card-media">
                <CredentialImageFallback
                  src={definitionImage}
                  alt={`${credential.definition} credential image`}
                  loading="lazy"
                  className="credential-card-image"
                />
              </div>

                <Link href={verifyPath} className="skill-link-row">
                <div>
                  <p className="label">Credential</p>
                  <h3>{credential.definition || `${credential.definitionOwner}/${credential.definitionSlug}`}</h3>
                  <p className="caption">Issued {issuedAtLabel}</p>
                  <p className="skill-meta-text">{hasCommitText}</p>
                  {credential.claimId ? (
                    <p className="skill-meta-text">Claim ID: {credential.claimId}</p>
                  ) : null}
                </div>
                <span className="tag" aria-hidden="true">Verify Credential</span>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
