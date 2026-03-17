import type { ReactNode } from 'react'

import TopNav from './TopNav'

type AppShellProps = {
  title: string
  activePath?: string
  sidebar?: ReactNode
  children: ReactNode
  inspector?: ReactNode
  copyClassName?: string
}

export default function AppShell({
  title,
  activePath = '/',
  sidebar,
  children,
  inspector,
  copyClassName = '',
}: AppShellProps) {
  const hasSidebar = typeof sidebar !== 'undefined' && sidebar !== null
  const hasInspector = typeof inspector !== 'undefined' && inspector !== null

  return (
    <section className="hero" aria-label={title}>
      <div className="bg">
        <img src="/images/bg.png" alt="" aria-hidden="true" />
      </div>

      <div className="swirls">
        <img src="/images/swirls.png" alt="" aria-hidden="true" />
      </div>

      <div className="char">
        <img src="/images/charm.png" alt="" aria-hidden="true" />
      </div>

      <div className="left-fade"></div>
      <div className="bottom-fade"></div>
      <div className="noise"></div>
      <div className="vignette"></div>

      <div className="shell">
        <TopNav activePath={activePath} />

         <div className={`content${!hasSidebar && !hasInspector ? ' content--single' : ''}`}>
           <div className={`copy${copyClassName ? ` ${copyClassName}` : ''}`}>
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
  )
}
