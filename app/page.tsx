import type { Metadata } from 'next'
import Link from 'next/link'

import AppShell from '../components/AppShell'

const SKILLS_REGISTRY_INDEX_URL = 'https://skillcraft.gg/skills-registry/search/index.json'
const SKILL_COUNT_FALLBACK = '__'

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

export const dynamic = 'force-static'
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Skillcraft: Turn your work into verifiable AI credentials',
}

export default async function HomePage() {
  const skillCount = await getSkillRegistryCount()

  return (
      <AppShell
        title="Home"
        activePath="/"
        copyClassName="copy--wide"
        fullBleed
        heroClassName="hero--landing"
      >
      <section className="hero-grid">
        <h1 id="hero-title" className="hero-title">
          <span className="headline-top">You can build anything with AI.</span>
          <span className="headline-accent">So how do you prove it?</span>
        </h1>
        <p className="lede">
          AI has collapsed the cost of building. One developer can ship systems that used to take teams.
          But when everyone can produce, output stops being a signal. What matters is how you work —
          the patterns you apply, the decisions you make, the way you use AI to move through a problem.
          Skillcraft captures that directly from real projects, turning everyday development into verifiable proof of capability.
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
      </div>
        <p className="tagline">
          Building is no longer the
          <span className="accent"> constraint.</span>
        </p>
        <section className="how-it-works" id="get-started">
          <p className="workflow-copy" role="text" aria-label="How it works">
            Use your favourite AI coding agents and let Skillcraft turn your commits into verifiable evidence. When you have enough, use it to claim credentials and build a profile that reflects demonstrated capability.
          </p>

           <section className="terminal">
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
                   <span className="cmd">skillcraft</span> <span className="arg">claim</span> <span className="path">skillcraft-gg/hello-world</span>
                   <span className="cursor" aria-hidden="true" />
                   </span>
                 </div>
             </div>
           </section>
             <div className="cta-row">
               <Link className="btn btn-secondary" href="/docs">
                 View Installation Docs
               </Link>
             </div>
              <p className="tagline">
                A skills registry at your fingertips.
              </p>
              <p className="workflow-copy" role="text" aria-label="Skills registry workflow">
                Equip your coding agent with the right skill for the task, in seconds. Search by need, inspect the source, and install it with one command.
              </p>
              <section className="terminal">
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
                      <span className="cmd">skillcraft</span> <span className="arg">skills inspect anthropic/frontend-design</span>
                    </span>
                  </div>
                  <div className="line">
                    <span className="prompt">$</span>
                    <span>
                      <span className="cmd">skillcraft</span> <span className="arg">skills add anthropic/frontend-design</span>
                    </span>
                  </div>
                <div className="line">
                  <span className="prompt">$</span>
                  <span>
                    opencode <span className="arg">run</span> <span className="str">"build my landing page"</span>
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
                  <h3 className="whitepaper-box-title">Skillcraft Ecosystem Whitepaper</h3>
                  <p className="whitepaper-copy">
                    Skillcraft turns everyday commit history into auditable proof. Read the Skillcraft whitepaper to see the technical details of how this is achieved.
                  </p>
                  <div className="cta-row">
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
    </AppShell>
  )
}
