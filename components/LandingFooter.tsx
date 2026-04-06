import Link from 'next/link'

const NpmLogo = () => (
  <svg viewBox="0 0 18 7" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path fill="#CB3837" d="M0,0h18v6H9v1H5V6H0V0z M1,5h2V2h1v3h1V1H1V5z M6,1v5h2V5h2V1H6z M8,2h1v2H8V2z M11,1v4h2V2h1v3h1V2h1v3h1V1H11z" />
    <polygon fill="#FFFFFF" points="1,5 3,5 3,2 4,2 4,5 5,5 5,1 1,1 " />
    <path fill="#FFFFFF" d="M6,1v5h2V5h2V1H6z M9,4H8V2h1V4z M11,1v4h2V2h1v3h1V2h1v3h1V1H11z" />
    <polygon fill="#FFFFFF" points="11,1 11,5 13,5 13,2 14,2 14,5 15,5 15,2 16,2 16,5 17,5 17,1 " />
  </svg>
)

const GithubLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.387 7.86 10.91.574.105.783-.25.783-.555 0-.273-.01-1.12-.016-2.02-3.197.695-3.873-1.54-3.873-1.54-.522-1.327-1.275-1.68-1.275-1.68-1.044-.714.08-.7.08-.7 1.155.081 1.763 1.187 1.763 1.187 1.026 1.757 2.692 1.25 3.35.955.104-.742.4-1.251.726-1.539-2.553-.29-5.237-1.276-5.237-5.678 0-1.255.45-2.281 1.186-3.084-.119-.29-.513-1.462.112-3.047 0 0 .968-.31 3.173 1.178a11.04 11.04 0 0 1 2.89-.387c.98.005 1.965.132 2.89.387 2.204-1.488 3.17-1.178 3.17-1.178.627 1.585.233 2.757.114 3.047.738.803 1.185 1.83 1.185 3.084 0 4.412-2.687 5.385-5.249 5.67.41.353.775 1.05.775 2.116 0 1.529-.014 2.762-.014 3.138 0 .307.206.666.79.553C20.713 21.38 24 17.08 24 12 24 5.65 18.85.5 12 .5Z"
    />
  </svg>
)

const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M22.23 0H1.77C.79 0 0 .79 0 1.77V22.23C0 23.21.79 24 1.77 24H22.23C23.21 24 24 23.21 24 22.23V1.77C24 .79 23.21 0 22.23 0ZM7.06 20.45H3.56V9H7.06V20.45ZM5.31 7.52C4.16 7.52 3.23 6.59 3.23 5.44 3.23 4.29 4.16 3.36 5.31 3.36 6.46 3.36 7.39 4.29 7.39 5.44 7.39 6.59 6.46 7.52 5.31 7.52ZM20.45 20.45H16.96V14.93C16.96 13.7 16.94 12.11 15.26 12.11 13.56 12.11 13.3 13.47 13.3 14.84V20.45H9.81V9H13.16V10.46H13.21C13.67 9.67 14.76 8.84 16.45 8.84 20.02 8.84 20.45 11.09 20.45 14.21V20.45Z"
    />
  </svg>
)

export const LandingFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="landing-footer" aria-label="Landing page footer">
      <hr className="landing-footer-rule" />
      <div className="landing-footer-grid">
        <section className="landing-footer-col landing-footer-brand">
          <img src="/images/logo.png" alt="Skillcraft" className="landing-footer-logo" width={190} height={38} />
          <p className="landing-footer-copy">
            Build, prove, and verify your AI coding skills.
          </p>
        </section>

        <section className="landing-footer-col">
          <p className="landing-footer-title">Explore</p>
          <ul className="landing-footer-links">
            <li><Link className="landing-footer-link" href="/">Home</Link></li>
            <li><Link className="landing-footer-link" href="/skills">Skills</Link></li>
            <li><Link className="landing-footer-link" href="/credentials">Credentials</Link></li>
            <li>
              <span className="landing-footer-link" aria-disabled="true">
                Loadouts
                <span className="top-tab-pill landing-footer-pill">Coming Soon</span>
              </span>
            </li>
          </ul>
        </section>

        <section className="landing-footer-col">
          <p className="landing-footer-title">Docs</p>
          <ul className="landing-footer-links">
            <li>
              <a className="landing-footer-link" href="https://skillcraft.gg/docs/getting-started">Getting Started</a>
            </li>
            <li>
              <a className="landing-footer-link" href="https://skillcraft.gg/docs/installation">Installation</a>
            </li>
            <li>
              <a className="landing-footer-link" href="https://skillcraft.gg/docs/reference/cli">CLI</a>
            </li>
            <li>
              <Link className="landing-footer-link" href="/docs/reference/ai-coding-agents/opencode/">OpenCode Integration</Link>
            </li>
            <li>
              <a className="landing-footer-link" href="https://skillcraft.gg/docs/reference/vcs-integrations/github">GitHub Integration</a>
            </li>
            <li>
              <Link className="landing-footer-link" href="/docs/changelog/">Changelog</Link>
            </li>
            <li>
              <Link className="landing-footer-link" href="/docs/roadmap/">Roadmap</Link>
            </li>
          </ul>
        </section>

        <section className="landing-footer-col">
          <p className="landing-footer-title">Proof in Action</p>
          <ul className="landing-footer-links">
            <li>
               <Link className="landing-footer-link" href="/news/introducing-skillcraft-beta">Introducing Skillcraft Beta</Link>
            </li>
            <li>
              <Link className="landing-footer-link" href="/news">News</Link>
            </li>
            <li>
              <a className="landing-footer-link" href="https://skillcraft.gg/whitepaper/skillcraft.pdf">Whitepaper</a>
            </li>
            <li>
              <Link className="landing-footer-link" href="/credentials/skillcraft-gg/hello-world">Hello World</Link>
            </li>
            <li>
              <Link className="landing-footer-link" href="/credentials/skillcraft-gg/opencode-practitioner">OpenCode Practitioner</Link>
            </li>
            <li>
              <a
                className="landing-footer-link"
                href="https://github.com/skillcraft-gg/skillcraft"
                target="_blank"
                rel="noreferrer"
              >
                Open Source
              </a>
            </li>
          </ul>
        </section>

        <section className="landing-footer-col">
          <p className="landing-footer-title">Community</p>
          <ul className="landing-footer-links">
            <li>
              <a
                className="landing-footer-link"
                href="https://github.com/skillcraft-gg/skillcraft"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="landing-footer-link-icon landing-footer-link-icon--social" aria-hidden="true">
                  <GithubLogo />
                </span>
                Star on GitHub
              </a>
            </li>
            <li>
              <a
                className="landing-footer-link"
                href="https://github.com/orgs/skillcraft-gg/discussions/new/choose"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="landing-footer-link-icon landing-footer-link-icon--social" aria-hidden="true">
                  <GithubLogo />
                </span>
                Join the Discussion
              </a>
            </li>
            <li>
              <a
                className="landing-footer-link"
                href="https://github.com/skillcraft-gg/skillcraft/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="landing-footer-link-icon landing-footer-link-icon--social" aria-hidden="true">
                  <GithubLogo />
                </span>
                Report an Issue
              </a>
            </li>
            <li>
              <a
                className="landing-footer-link landing-footer-link--code"
                href="https://www.npmjs.com/package/skillcraft"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="landing-footer-link-icon npm-icon" aria-hidden="true">
                    <NpmLogo />
                  </span>
                  <code className="landing-footer-inline-code">npm i -g skillcraft</code>
                </a>
            </li>
            <li>
              <a
                className="landing-footer-link"
                href="https://www.linkedin.com/company/skillcraft-gg/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="landing-footer-link-icon landing-footer-link-icon--social" aria-hidden="true">
                  <LinkedInLogo />
                </span>
                Follow on LinkedIn
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="landing-footer-meta">
        <p>© {currentYear} Skillcraft.</p>
        <a className="landing-footer-link" href="https://skillcraft.gg/docs/tutorials/first-credential">
          Earn your first credential
        </a>
      </div>
    </footer>
  )
}

export default LandingFooter
