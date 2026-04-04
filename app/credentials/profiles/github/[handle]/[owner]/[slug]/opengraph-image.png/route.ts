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
  response.headers.set('Content-Type', 'image/png')
  response.headers.set('Content-Disposition', 'inline')
  return response
}
