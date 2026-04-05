import path from 'path'
import { readFile } from 'fs/promises'
import { ImageResponse } from 'next/og'

import {
  resolveCredentialImage,
  CREDENTIAL_IMAGE_PLACEHOLDER,
} from '../../../../../../../components/credentials/credentialImageResolver'
import {
  findCredentialByPath,
  fetchCredentialIndex,
  type CredentialDefinition,
} from '../../../../../../../lib/credentialIndex'
import {
  fetchIssuedCredentialsIndex,
  findIssuedCredentialForProfile,
  findIssuedProfile,
} from '../../../../../../../lib/issuedCredentialsIndex'

export type IssuedCredentialImageParams = {
  handle: string
  owner: string
  slug: string
}

const PUBLIC_IMAGE_ROOT = path.join(process.cwd(), 'public', 'images')
const localAssetCache = new Map<string, string>()

export const size = {
  width: 1200,
  height: 630,
}
export const runtime = 'nodejs'

const safeFetchProfiles = async () => {
  try {
    return await fetchIssuedCredentialsIndex()
  } catch {
    return []
  }
}

const loadLocalImageDataUrl = async (filename: string) => {
  const cached = localAssetCache.get(filename)
  if (cached) {
    return cached
  }

  const filePath = path.join(PUBLIC_IMAGE_ROOT, filename)
  const buffer = await readFile(filePath)
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`
  localAssetCache.set(filename, dataUrl)
  return dataUrl
}

const fallbackCredential = (owner: string, slug: string, definition: string, issuedAt: string): CredentialDefinition => ({
  id: definition,
  name: definition || `${owner}/${slug}`,
  owner,
  slug,
  url: '',
  path: '',
  updatedAt: issuedAt,
  description: `Issued credential for ${owner}/${slug}.`,
  requirements: {},
  images: {},
  indexMetadata: {},
})

export async function generateStaticParams(): Promise<IssuedCredentialImageParams[]> {
  const profiles = await safeFetchProfiles()

  return profiles.flatMap((profile) => profile.credentials.map((credential) => ({
    handle: profile.github,
    owner: credential.definitionOwner,
    slug: credential.definitionSlug,
  })))
}

export async function renderIssuedCredentialOpenGraphImage(params: IssuedCredentialImageParams) {
  const handle = decodeURIComponent((params.handle || '').toLowerCase())
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  let credentialName = `${owner}/${slug}`
  let credentialImageUrl = ''

  const [backgroundImageUrl, logoImageUrl, fallbackCredentialImageUrl] = await Promise.all([
    loadLocalImageDataUrl('bg.png'),
    loadLocalImageDataUrl('logo.png'),
    loadLocalImageDataUrl('skillcraft-icon.png'),
  ])

  credentialImageUrl = fallbackCredentialImageUrl

  try {
    const [issuedProfiles, definitions] = await Promise.all([
      safeFetchProfiles(),
      fetchCredentialIndex(),
    ])

    const profile = findIssuedProfile(issuedProfiles, handle)
    const issued = profile ? findIssuedCredentialForProfile(profile, owner, slug) : null
    const definitionFromLedger = findCredentialByPath(definitions, owner, slug)

    if (issued) {
      const credential = definitionFromLedger || fallbackCredential(owner, slug, issued.definition, issued.issuedAt)
      const resolvedImage = resolveCredentialImage(credential)

      credentialName = credential.name
      credentialImageUrl = resolvedImage && resolvedImage !== CREDENTIAL_IMAGE_PLACEHOLDER
        ? resolvedImage
        : fallbackCredentialImageUrl
    }
  } catch {
    credentialImageUrl = fallbackCredentialImageUrl
  }

  const profileImageUrl = `https://github.com/${handle || 'github'}.png?size=500`
  const holderLabel = `@${handle || 'github'}`
  const caption = `Verify this credential issued to ${holderLabel} at skillcraft.gg`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#06070d',
          color: '#f5f8ff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <img
          src={backgroundImageUrl}
          alt=""
          width="1200"
          height="630"
          style={{
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.86,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '48px',
            display: 'flex',
          }}
        >
          <div style={{ width: '16px', height: '100%', background: '#90fefe' }} />
          <div style={{ width: '16px', height: '100%', background: '#2cfeff' }} />
          <div style={{ width: '16px', height: '100%', background: '#fde330' }} />
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '34px 44px 44px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <img
              src={logoImageUrl}
              alt="Skillcraft"
              width="1120"
              height="320"
              style={{ display: 'flex', width: '280px', height: '80px' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '620px',
                height: '440px',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '440px',
                  height: '440px',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={credentialImageUrl}
                  alt="Credential badge"
                  width="440"
                  height="440"
                  style={{
                    display: 'flex',
                    width: '440px',
                    height: '440px',
                    borderRadius: '24px',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: '52px',
                  bottom: '6px',
                  display: 'flex',
                  width: '190px',
                  height: '190px',
                  borderRadius: '999px',
                  padding: '8px',
                  background: '#090610',
                }}
              >
                <img
                  src={profileImageUrl}
                  alt="GitHub profile image"
                  width="174"
                  height="174"
                  style={{
                    display: 'flex',
                    width: '174px',
                    height: '174px',
                    borderRadius: '999px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                maxWidth: '1100px',
                color: '#ffffff',
                fontSize: '34px',
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: '64px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {caption}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
