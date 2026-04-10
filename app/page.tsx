import type { Metadata } from 'next'
import Link from 'next/link'

import AppShell from '../components/AppShell'
import LandingFooter from '../components/LandingFooter'
import { fetchCredentialIndex } from '../lib/credentialIndex'
import { withSocialImageDefaults } from '../lib/metadata'

const SKILLS_REGISTRY_INDEX_URL = 'https://skillcraft.gg/skills-registry/search/index.json'
const SKILL_COUNT_FALLBACK = '__'
const CREDENTIAL_COUNT_FALLBACK = '__'

const NpmLogo = () => (
  <svg viewBox="0 0 18 7" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path fill="#CB3837" d="M0,0h18v6H9v1H5V6H0V0z M1,5h2V2h1v3h1V1H1V5z M6,1v5h2V5h2V1H6z M8,2h1v2H8V2z M11,1v4h2V2h1v3h1V2h1v3h1V1H11z" />
    <polygon fill="#FFFFFF" points="1,5 3,5 3,2 4,2 4,5 5,5 5,1 1,1 " />
    <path fill="#FFFFFF" d="M6,1v5h2V5h2V1H6z M9,4H8V2h1V4z" />
    <polygon fill="#FFFFFF" points="11,1 11,5 13,5 13,2 14,2 14,5 15,5 15,2 16,2 16,5 17,5 17,1 " />
  </svg>
)

const OpenCodeLogo = () => (
  <svg viewBox="0 0 234 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path d="M18 30H6V18H18V30Z" fill="#4B4646" />
    <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="#B7B1B1" />
    <path d="M48 30H36V18H48V30Z" fill="#4B4646" />
    <path d="M36 30H48V12H36V30ZM54 36H36V42H30V6H54V36Z" fill="#B7B1B1" />
    <path d="M84 24V30H66V24H84Z" fill="#4B4646" />
    <path d="M84 24H66V30H84V36H60V6H84V24ZM66 18H78V12H66V18Z" fill="#B7B1B1" />
    <path d="M108 36H96V18H108V36Z" fill="#4B4646" />
    <path d="M108 12H96V36H90V6H108V12ZM114 36H108V12H114V36Z" fill="#B7B1B1" />
    <path d="M144 30H126V18H144V30Z" fill="#4B4646" />
    <path d="M144 12H126V30H144V36H120V6H144V12Z" fill="#F1ECEC" />
    <path d="M168 30H156V18H168V30Z" fill="#4B4646" />
    <path d="M168 12H156V30H168V12ZM174 36H150V6H174V36Z" fill="#F1ECEC" />
    <path d="M198 30H186V18H198V30Z" fill="#4B4646" />
    <path d="M198 12H186V30H198V12ZM204 36H180V6H198V0H204V36Z" fill="#F1ECEC" />
    <path d="M234 24V30H216V24H234Z" fill="#4B4646" />
    <path d="M216 12V18H228V12H216ZM234 24H216V30H234V36H210V6H234V24Z" fill="#F1ECEC" />
  </svg>
)

const GitHubLogo = () => (
  <svg viewBox="0 0 416 95" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M41.6394 69.3848C29.0066 67.8535 20.1062 58.7617 20.1062 46.9902C20.1062 42.2051 21.8289 37.0371 24.7 33.5918C23.4558 30.4336 23.6472 23.7344 25.0828 20.959C28.9109 20.4805 34.0789 22.4902 37.1414 25.2656C40.7781 24.1172 44.6062 23.543 49.2957 23.543C53.9851 23.543 57.8132 24.1172 61.2585 25.1699C64.2253 22.4902 69.489 20.4805 73.3171 20.959C74.657 23.543 74.8484 30.2422 73.6042 33.4961C76.6667 37.1328 78.2937 42.0137 78.2937 46.9902C78.2937 58.7617 69.3933 67.6621 56.5691 69.2891C59.823 71.3945 62.0242 75.9883 62.0242 81.252L62.0242 91.2051C62.0242 94.0762 64.4167 95.7031 67.2878 94.5547C84.6101 87.9512 98.2 70.6289 98.2 49.1914C98.2 22.1074 76.1882 6.69539e-07 49.1042 4.309e-07C22.0203 1.92261e-07 0.199951 22.1074 0.199951 49.1914C0.199951 70.4375 13.6941 88.0469 31.8777 94.6504C34.4617 95.6074 36.95 93.8848 36.95 91.3008L36.95 83.6445C35.6101 84.2188 33.8875 84.6016 32.3562 84.6016C26.0398 84.6016 22.3074 81.1563 19.6277 74.7441C18.575 72.1602 17.4265 70.6289 15.2253 70.3418C14.0769 70.2461 13.6941 69.7676 13.6941 69.1934C13.6941 68.0449 15.6082 67.1836 17.5222 67.1836C20.2976 67.1836 22.6902 68.9063 25.1785 72.4473C27.0925 75.2227 29.1023 76.4668 31.4949 76.4668C33.8875 76.4668 35.4187 75.6055 37.6199 73.4043C39.2468 71.7773 40.491 70.3418 41.6394 69.3848Z"
    />
    <path
      fill="currentColor"
      d="M188.937 83.0045L188.937 33.2827L202.915 33.2827L202.915 83.0045L188.937 83.0045ZM230.016 83.0045C220.727 83.0045 217.099 79.0232 217.099 70.6183L217.099 44.9611L208.252 44.9611L208.252 33.2827L217.099 33.2827L217.099 23.3737L231.078 20.1002L231.078 33.2827L241.429 33.2827L241.429 44.9611L231.078 44.9611L231.078 67.5217C231.078 70.2644 232.317 71.3261 235.059 71.3261L241.429 71.3261L241.429 83.0045L230.016 83.0045ZM327.47 83.8892C316.588 83.8892 310.66 77.8731 310.66 66.9024L310.66 33.2827L324.728 33.2827L324.728 63.1866C324.728 69.2912 327.47 72.6532 332.69 72.6532C338.706 72.6532 343.307 67.0794 343.307 59.4707L343.307 33.2827L357.374 33.2827L357.374 83.0045L343.307 83.0045L343.307 74.5996C340.653 79.9964 334.283 83.8892 327.47 83.8892ZM394.613 83.8892C387.832 83.8892 381.639 79.9964 378.687 74.4226L378.687 83.0045L364.709 83.0045L364.709 13.6417L378.776 13.6417L378.776 42.3954C381.639 36.3792 388.098 32.1325 394.613 32.1325C408.181 32.1325 415.348 41.5107 414.873 58.0551C415.348 74.4226 407.916 83.8892 394.613 83.8892ZM389.658 72.1223C396.945 72.1223 400.926 66.7255 400.452 58.0551C400.926 49.2963 396.945 43.8994 389.658 43.8994C383.851 43.8994 379.251 49.5617 378.776 57.3473L378.776 58.1436C379.251 66.1946 383.851 72.1223 389.658 72.1223ZM288.734 13.6417L288.734 41.7761L262.369 41.7761L262.369 13.6417L247.329 13.6417L247.329 83.0045L262.369 83.0045L262.369 55.224L288.734 55.224L288.734 83.0045L303.775 83.0045L303.775 13.6417L288.734 13.6417ZM150.628 84.3316C130.102 84.3316 117.185 70.2644 117.185 48.2346C117.185 26.2048 130.368 12.3146 151.247 12.3146C168.234 12.3146 178.497 19.5693 181.77 31.7786L166.553 35.406C164.695 28.7705 159.387 25.1431 151.247 25.1431C139.126 25.1431 132.579 33.1057 132.579 48.2346C132.579 63.3635 138.949 71.503 150.893 71.503C161.864 71.503 168.411 64.7791 168.411 53.366L168.411 50.7119L172.304 56.1087L149.655 56.1087L149.655 43.3686L183.628 43.3686L183.628 51.4196C183.628 72.5647 171.331 84.3316 150.628 84.3316ZM195.926 28.5936C200.615 28.5936 204.243 24.9662 204.243 20.2771C204.243 15.5881 200.615 11.9607 195.926 11.9607C191.237 11.9607 187.61 15.5881 187.61 20.2771C187.61 24.9662 191.237 28.5936 195.926 28.5936Z"
    />
  </svg>
)

const GitLogo = () => (
  <svg viewBox="0 0 97 97" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path
      d="M92.71 44.408 52.591 4.291c-2.31-2.311-6.057-2.311-8.369 0l-8.33 8.332L46.459 23.19c2.456-.83 5.272-.273 7.229 1.685 1.969 1.97 2.521 4.81 1.67 7.275l10.186 10.185c2.465-.85 5.307-.3 7.275 1.671 2.75 2.75 2.75 7.206 0 9.958-2.752 2.751-7.208 2.751-9.961 0-2.068-2.07-2.58-5.11-1.531-7.658l-9.5-9.499v24.997c.67.332 1.303.774 1.861 1.332 2.75 2.75 2.75 7.206 0 9.959-2.75 2.749-7.209 2.749-9.957 0-2.75-2.754-2.75-7.21 0-9.959.68-.679 1.467-1.193 2.307-1.537v-25.23c-.84-.344-1.625-.853-2.307-1.537-2.083-2.082-2.584-5.14-1.516-7.698L31.798 16.715 4.288 44.222c-2.311 2.313-2.311 6.06 0 8.371l40.121 40.118c2.31 2.311 6.056 2.311 8.369 0L92.71 52.779c2.311-2.311 2.311-6.06 0-8.371z"
      fill="#c8c2c2"
    />
  </svg>
)

const OpenAILogo = () => (
  <svg viewBox="0 0 1180 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path
      fill="#c8c2c2"
      d="m367.44 153.84c0 52.32 33.6 88.8 80.16 88.8s80.16-36.48 80.16-88.8-33.6-88.8-80.16-88.8-80.16 36.48-80.16 88.8zm129.6 0c0 37.44-20.4 61.68-49.44 61.68s-49.44-24.24-49.44-61.68 20.4-61.68 49.44-61.68 49.44 24.24 49.44 61.68z"
    />
    <path
      fill="#c8c2c2"
      d="m614.27 242.64c35.28 0 55.44-29.76 55.44-65.52s-20.16-65.52-55.44-65.52c-16.32 0-28.32 6.48-36.24 15.84v-13.44h-28.8v169.2h28.8v-56.4c7.92 9.36 19.92 15.84 36.24 15.84zm-36.96-69.12c0-23.76 13.44-36.72 31.2-36.72 20.88 0 32.16 16.32 32.16 40.32s-11.28 40.32-32.16 40.32c-17.76 0-31.2-13.2-31.2-36.48z"
    />
    <path
      fill="#c8c2c2"
      d="m747.65 242.64c25.2 0 45.12-13.2 54-35.28l-24.72-9.36c-3.84 12.96-15.12 20.16-29.28 20.16-18.48 0-31.44-13.2-33.6-34.8h88.32v-9.6c0-34.56-19.44-62.16-55.92-62.16s-60 28.56-60 65.52c0 38.88 25.2 65.52 61.2 65.52zm-1.44-106.8c18.24 0 26.88 12 27.12 25.92h-57.84c4.32-17.04 15.84-25.92 30.72-25.92z"
    />
    <path
      fill="#c8c2c2"
      d="m823.98 240h28.8v-73.92c0-18 13.2-27.6 26.16-27.6 15.84 0 22.08 11.28 22.08 26.88v74.64h28.8v-83.04c0-27.12-15.84-45.36-42.24-45.36-16.32 0-27.6 7.44-34.8 15.84v-13.44h-28.8z"
    />
    <path
      fill="#c8c2c2"
      d="m1014.17 67.68-65.28 172.32h30.48l14.64-39.36h74.4l14.88 39.36h30.96l-65.28-172.32zm16.8 34.08 27.36 72h-54.24z"
    />
    <path fill="#c8c2c2" d="m1163.69 68.18h-30.72v172.32h30.72z" />
    <path
      fill="#c8c2c2"
      d="m297.06 130.97c7.26-21.79 4.76-45.66-6.85-65.48-17.46-30.4-52.56-46.04-86.84-38.68-15.25-17.18-37.16-26.95-60.13-26.81-35.04-.08-66.13 22.48-76.91 55.82-22.51 4.61-41.94 18.7-53.31 38.67-17.59 30.32-13.58 68.54 9.92 94.54-7.26 21.79-4.76 45.66 6.85 65.48 17.46 30.4 52.56 46.04 86.84 38.68 15.24 17.18 37.16 26.95 60.13 26.8 35.06.09 66.16-22.49 76.94-55.86 22.51-4.61 41.94-18.7 53.31-38.67 17.57-30.32 13.55-68.51-9.94-94.51zm-120.28 168.11c-14.03.02-27.62-4.89-38.39-13.88.49-.26 1.34-.73 1.89-1.07l63.72-36.8c3.26-1.85 5.26-5.32 5.24-9.07v-89.83l26.93 15.55c.29.14.48.42.52.74v74.39c-.04 33.08-26.83 59.9-59.91 59.97zm-128.84-55.03c-7.03-12.14-9.56-26.37-7.15-40.18.47.28 1.3.79 1.89 1.13l63.72 36.8c3.23 1.89 7.23 1.89 10.47 0l77.79-44.92v31.1c.02.32-.13.63-.38.83l-64.41 37.19c-28.69 16.52-65.33 6.7-81.92-21.95zm-16.77-139.09c7-12.16 18.05-21.46 31.21-26.29 0 .55-.03 1.52-.03 2.2v73.61c-.02 3.74 1.98 7.21 5.23 9.06l77.79 44.91-26.93 15.55c-.27.18-.61.21-.91.08l-64.42-37.22c-28.63-16.58-38.45-53.21-21.95-81.89zm221.26 51.49-77.79-44.92 26.93-15.54c.27-.18.61-.21.91-.08l64.42 37.19c28.68 16.57 38.51 53.26 21.94 81.94-7.01 12.14-18.05 21.44-31.2 26.28v-75.81c.03-3.74-1.96-7.2-5.2-9.06zm26.8-40.34c-.47-.29-1.3-.79-1.89-1.13l-63.72-36.8c-3.23-1.89-7.23-1.89-10.47 0l-77.79 44.92v-31.1c-.02-.32.13-.63.38-.83l64.41-37.16c28.69-16.55 65.37-6.7 81.91 22 6.99 12.12 9.52 26.31 7.15 40.1zm-168.51 55.43-26.94-15.55c-.29-.14-.48-.42-.52-.74v-74.39c.02-33.12 26.89-59.96 60.01-59.94 14.01 0 27.57 4.92 38.34 13.88-.49.26-1.33.73-1.89 1.07l-63.72 36.8c-3.26 1.85-5.26 5.31-5.24 9.06l-.04 89.79zm14.63-31.54 34.65-20.01 34.65 20v40.01l-34.65 20-34.65-20z"
    />
  </svg>
)

const getSkillRegistryCount = async () => {
  try {
    const response = await fetch(SKILLS_REGISTRY_INDEX_URL)

    if (!response.ok) {
      return SKILL_COUNT_FALLBACK
    }

    const payload = (await response.json()) as unknown
    const skills = Array.isArray(payload)
      ? payload
      : typeof payload === 'object' && payload !== null && 'skills' in payload
        ? ((payload as { skills?: unknown }).skills || [])
        : []

    if (!Array.isArray(skills)) {
      return SKILL_COUNT_FALLBACK
    }

    return `${skills.length}`
  } catch {
    return SKILL_COUNT_FALLBACK
  }
}

const getCredentialDefinitionCount = async () => {
  try {
    const credentials = await fetchCredentialIndex()
    return `${credentials.length}`
  } catch {
    return CREDENTIAL_COUNT_FALLBACK
  }
}

export const dynamic = 'force-static'
export const revalidate = 3600

const LANDING_TITLE = 'Skillcraft: Prove your AI coding skills'
const LANDING_DESCRIPTION = 'Skillcraft works with your favourite AI coding agents to turn your commits into verifiable evidence, so you can earn credentials to prove your AI coding skills.'

export const metadata: Metadata = withSocialImageDefaults({
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
  },
  twitter: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
  },
})

export default async function HomePage() {
  const skillCount = await getSkillRegistryCount()
  const credentialCount = await getCredentialDefinitionCount()

  return (
      <AppShell
        title="Home"
        activePath="/"
        copyClassName="copy--wide"
        fullBleed
        heroClassName="hero--landing hero-with-launch-banner"
        beforeContent={
          <Link href="/news/introducing-skillcraft-beta" className="landing-launch-banner">
            Welcome to the Skillcraft Beta — <span className="landing-launch-banner-underline">read the launch post</span>
          </Link>
        }
      >
        <section className="hero-grid">
          <h1 id="hero-title" className="hero-title">
            <span className="headline-top">You can build anything with AI.</span>
            <span className="headline-accent">So how do you prove it?</span>
          </h1>
        <p className="lede">
          AI has changed software development forever. One developer can now build systems that used to require a team. Skillcraft works with your favourite AI coding agents like OpenCode and OpenAI Codex to turn git commits from real projects into verifiable evidence, so you can earn credentials that prove your AI coding skills.
        </p>
      <div className="cta-row">
        <Link className="btn btn-primary btn-flat" href="#get-started">Get Started</Link>
        <a
          className="btn btn-secondary"
          href="https://github.com/skillcraft-gg/skillcraft"
          target="_blank"
          rel="noreferrer"
        >
          <span className="btn-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.387 7.86 10.91.574.105.783-.25.783-.555 0-.273-.01-1.12-.016-2.02-3.197.695-3.873-1.54-3.873-1.54-.522-1.327-1.275-1.68-1.275-1.68-1.044-.714.08-.7.08-.7 1.155.081 1.763 1.187 1.763 1.187 1.026 1.757 2.692 1.25 3.35.955.104-.742.4-1.251.726-1.539-2.553-.29-5.237-1.276-5.237-5.678 0-1.255.45-2.281 1.186-3.084-.119-.29-.513-1.462.112-3.047 0 0 .968-.31 3.173 1.178a11.04 11.04 0 0 1 2.89-.387c.98.005 1.965.132 2.89.387 2.204-1.488 3.17-1.178 3.17-1.178.627 1.585.233 2.757.114 3.047.738.803 1.185 1.83 1.185 3.084 0 4.412-2.687 5.385-5.249 5.67.41.353.775 1.05.775 2.116 0 1.529-.014 2.762-.014 3.138 0 .307.206.666.79.553C20.713 21.38 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
            </svg>
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
        <p className="tagline" id="get-started">
           Building is no longer <span className="accent">the </span>
           <span className="accent">constraint.</span>
         </p>
        <section className="how-it-works">
          <p className="workflow-copy" role="text" aria-label="How it works">
            Use your favourite AI coding agents and let Skillcraft turn your commits into verifiable evidence. When you have enough, use it to claim credentials and build a profile that reflects demonstrated capability.
          </p>

            <section className="terminal terminal--focus" data-terminal="initial">
            <div className="terminal-top">
              <div className="dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="code" role="text" aria-label="terminal example output">
              <div className="line">
                <span className="prompt">$</span>
                <span>
                  <span className="cmd">skillcraft</span> <span className="arg">enable</span>
                </span>
              </div>
                <div className="line">
                  <span className="prompt">$</span>
                  <span>
                   <span className="arg">git commit -m</span> <span className="str">&quot;using my first agent skill&quot;</span>
                  </span>
                </div>
              <div className="line">
                <span className="prompt">$</span>
                <span>
                  <span className="cmd">skillcraft</span> <span className="arg">progress</span>
                </span>
              </div>
              <div className="line">
                <span className="prompt">$</span>
                <span>
                  <span className="cmd">skillcraft</span> <span className="arg">claim</span> <Link className="path path-underline" href="/credentials/skillcraft-gg/hello-world">skillcraft-gg/hello-world</Link>
                  <span className="cursor" aria-hidden="true" />
                </span>
              </div>
             </div>
           </section>
                 <div className="cta-row">
                   <Link className="btn btn-primary btn-flat" href="/docs/tutorials/first-credential">
                     Earn Your First Credential
                   </Link>
                   <Link className="btn btn-secondary" href="/docs">
                     View Documentation
                   </Link>
                 </div>
                 <section className="landing-tool-stack" aria-label="Compatible AI and coding tools">
                   <h2 className="tagline landing-tool-stack-title">Keep working with all your favourite AI and coding tools.</h2>
                   <p className="workflow-copy">
                     Skillcraft fits into the workflow you already use, turning work with tools like OpenCode and GitHub into verifiable proof.
                   </p>
                    <div className="landing-tool-logos" aria-label="Supported tools">
                      <div className="landing-tool-logos-track">
                        <div className="landing-tool-logos-group" role="list">
                          <Link
                            className="landing-tool-logo landing-tool-logo--opencode"
                            href="/docs/reference/ai-coding-agents/opencode/"
                            role="listitem"
                            aria-label="OpenCode integration docs"
                          >
                            <OpenCodeLogo />
                          </Link>
                          <Link
                            className="landing-tool-logo landing-tool-logo--openai"
                            href="/docs/reference/ai-coding-agents/opencode/"
                            role="listitem"
                            aria-label="OpenAI via OpenCode docs"
                          >
                            <OpenAILogo />
                          </Link>
                          <Link
                            className="landing-tool-logo landing-tool-logo--github"
                            href="/docs/reference/vcs-integrations/github"
                            role="listitem"
                            aria-label="GitHub integration docs"
                          >
                            <GitHubLogo />
                          </Link>
                          <Link
                            className="landing-tool-logo landing-tool-logo--git"
                            href="/docs/getting-started/"
                            role="listitem"
                            aria-label="Getting started docs"
                          >
                            <GitLogo />
                          </Link>
                        </div>
                        <div className="landing-tool-logos-group landing-tool-logos-group--clone" aria-hidden="true">
                          <span className="landing-tool-logo landing-tool-logo--opencode">
                            <OpenCodeLogo />
                          </span>
                          <span className="landing-tool-logo landing-tool-logo--openai">
                            <OpenAILogo />
                          </span>
                          <span className="landing-tool-logo landing-tool-logo--github">
                            <GitHubLogo />
                          </span>
                          <span className="landing-tool-logo landing-tool-logo--git">
                            <GitLogo />
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                 <p className="tagline">
                 Prove your AI coding skills with confidence.
               </p>
              <p className="workflow-copy" role="text" aria-label="Credential verification workflow">
                Track a credential, push your work, and verify. This creates a trustable trail that proves what your AI-assisted coding actually accomplishes.
              </p>
               <section className="terminal" data-terminal="credentials">
                <div className="terminal-top">
                  <div className="dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="code" role="text" aria-label="credential verification terminal example output">
                  <div className="line">
                    <span className="prompt">$</span>
                    <span>
                       <span className="cmd">skillcraft</span> <span className="arg">progress track</span> <Link className="path path-underline" href="/credentials/skillcraft-gg/opencode-practitioner">skillcraft-gg/opencode-practitioner</Link>
                    </span>
                  </div>
                  <div className="line">
                    <span className="prompt">$</span>
                    <span>
                      <span className="arg">git push</span>
                    </span>
                  </div>
                  <div className="line">
                    <span className="prompt">$</span>
                    <span>
                      <span className="cmd">skillcraft</span> <span className="arg">verify</span>
                      <span className="cursor" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </section>
              <div className="cta-row">
                <Link className="btn btn-secondary" href="/credentials">
                  View {credentialCount} Credentials
                </Link>
              </div>
               <p className="tagline">
                 A skills registry at your fingertips.
               </p>
              <p className="workflow-copy" role="text" aria-label="Skills registry workflow">
                Equip your coding agent with the right skill for the task, in seconds. Search by need, inspect the source, and install it with one command.
              </p>
               <section className="terminal" data-terminal="skills">
                <div className="terminal-top">
                  <div className="dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="code" role="text" aria-label="skills registry terminal example output">
                  <div className="line">
                    <span className="prompt">$</span>
                    <span>
                      <span className="cmd">skillcraft</span> <span className="arg">skills search design</span>
                    </span>
                  </div>
                <div className="line">
                  <span className="prompt">$</span>
                  <span>
                    <span className="cmd">skillcraft</span> <span className="arg">skills inspect</span> <Link className="path path-underline" href="/skills/anthropic/frontend-design">anthropic/frontend-design</Link>
                  </span>
                </div>
                <div className="line">
                  <span className="prompt">$</span>
                  <span>
                    <span className="cmd">skillcraft</span> <span className="arg">skills add</span> <Link className="path path-underline" href="/skills/anthropic/frontend-design">anthropic/frontend-design</Link>
                  </span>
                </div>
                <div className="line">
                  <span className="prompt">$</span>
                  <span>
                    opencode <span className="arg">run</span> <span className="str">"build my landing page"</span>
                    <span className="cursor" aria-hidden="true" />
                  </span>
                </div>
                </div>
              </section>
              <div className="cta-row">
                <Link className="btn btn-secondary" href="/skills">
                  View {skillCount} Skills
                </Link>
              </div>
            </section>

            <section className="whitepaper-block">
              <h2 className="tagline">
                From AI output to verifiable capability.
              </h2>
              <p className="workflow-copy" role="text" aria-label="Whitepaper follow-up">
                Output is easy. Reliable proof is not. The Skillcraft ecosystem binds AI work to verifiable git artifacts and issues credentials only after deterministic verification.
              </p>
              <section className="whitepaper-feature">
                <section className="section whitepaper-promo">
                  <div className="whitepaper-copy-column">
                    <h3 className="whitepaper-box-title">Introducing Skillcraft</h3>
                    <p className="whitepaper-copy">
                      Skillcraft turns everyday commit history into auditable proof. Read the Skillcraft whitepaper to see the technical details of how this is achieved.
                    </p>
                      <div className="cta-row whitepaper-cta-row">
                        <Link className="btn btn-primary" href="/news/introducing-skillcraft-beta">
                          Read launch post
                        </Link>
                        <a
                          className="btn btn-secondary"
                          href="https://skillcraft.gg/whitepaper/skillcraft.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download Whitepaper
                        </a>
                      </div>
                  </div>
                  <a
                    className="whitepaper-simple-link"
                    href="https://skillcraft.gg/whitepaper/skillcraft.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Skillcraft whitepaper PDF"
                  >
                    <img className="whitepaper-image" src="/images/whitepaper-page-1.png" alt="Skillcraft whitepaper front page" />
                  </a>
                </section>
              </section>
            </section>
          </section>

          <LandingFooter />
      </AppShell>
  )
}
