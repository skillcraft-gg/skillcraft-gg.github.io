import type { ReactNode } from 'react'

import AnimatedCharacter from './AnimatedCharacter'
import CursorBias from './CursorBias'
import FadeInImage from './FadeInImage'
import TopNav from './TopNav'

type AppShellProps = {
  title: string
  activePath?: string
  sidebar?: ReactNode
  children: ReactNode
  inspector?: ReactNode
  copyClassName?: string
  fullBleed?: boolean
}

export default function AppShell({
  title,
  activePath = '/',
  sidebar,
  children,
  inspector,
  copyClassName = '',
  fullBleed = false,
}: AppShellProps) {
  const hasSidebar = typeof sidebar !== 'undefined' && sidebar !== null
  const hasInspector = typeof inspector !== 'undefined' && inspector !== null

  return (
    <CursorBias>
      <section className={`hero${fullBleed ? ' hero--skills' : ''}`} aria-label={title}>
        <div className="bg">
          <FadeInImage src="/images/bg.png" alt="" aria-hidden="true" loading="eager" width={2400} height={1600} />
        </div>

        <div className="swirls">
          <div className="swirls-parallax">
            <FadeInImage src="/images/swirls.png" alt="" aria-hidden="true" loading="eager" width={2400} height={1600} />
          </div>
        </div>

        <div className="char">
          <div className="char-parallax">
            <AnimatedCharacter />
          </div>
        </div>

        <div className="left-fade"></div>
        <div className="bottom-fade"></div>
        <div className="noise"></div>
        <div className="vignette"></div>

        <div className={`shell${fullBleed ? ' shell--wide' : ''}`}>
          <TopNav activePath={activePath} />

          <div className={`content${!hasSidebar && !hasInspector ? ' content--single' : ''}${fullBleed ? ' content--wide' : ''}`}>
            <div className={`copy${copyClassName ? ` ${copyClassName}` : ''} font-fade`}>
              {children}
            </div>

            {hasSidebar || hasInspector ? (
              <aside className="right-spacer" aria-label="Context panels">
                {sidebar ? <section className="panel panel--sidebar side-panel">{sidebar}</section> : null}
                {inspector ? <section className="panel panel--inspector side-panel">{inspector}</section> : null}
              </aside>
            ) : null}
          </div>
        </div>
      </section>
    </CursorBias>
  )
}
