import sharp from 'sharp'

import {
  generateStaticParams,
  renderIssuedCredentialOpenGraphImage,
  type IssuedCredentialImageParams,
} from '../issuedCredentialOgImage'

export { generateStaticParams }

export const dynamic = 'force-static'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: IssuedCredentialImageParams },
) {
  const response = await renderIssuedCredentialOpenGraphImage(params)
  const sourceBuffer = Buffer.from(await response.arrayBuffer())
  const pngBuffer = await sharp(sourceBuffer)
    .png({
      palette: true,
      quality: 80,
      compressionLevel: 9,
      effort: 10,
    })
    .toBuffer()

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline',
    },
  })
}
