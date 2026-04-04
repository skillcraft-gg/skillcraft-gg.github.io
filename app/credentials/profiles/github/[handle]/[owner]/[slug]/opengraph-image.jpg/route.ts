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
  const pngBuffer = Buffer.from(await response.arrayBuffer())
  const jpegBuffer = await sharp(pngBuffer)
    .jpeg({
      quality: 72,
      mozjpeg: true,
      progressive: true,
    })
    .toBuffer()

  return new Response(new Uint8Array(jpegBuffer), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'inline',
    },
  })
}
