import Link from 'next/link'

import { LOGO_URL, ROUTES } from '../lib/navigation'
import FadeInImage from './FadeInImage'

type TopNavProps = {
  activePath?: string
}

export default function TopNav({ activePath = '/' }: TopNavProps) {
  return (
    <header className="top-bar">
        <Link href="/" className="brand" aria-label="Skillcraft home">
          <FadeInImage src={LOGO_URL} alt="Skillcraft" width={200} height={40} loading="eager" fadeOnLoad={false} />
        </Link>
      <nav className="top-nav" aria-label="Primary">
        {ROUTES.map((route) => {
          if (route.disabled) {
            return (
              <span
                key={route.label}
                className="top-tab is-disabled"
                aria-disabled="true"
                title="Coming soon"
              >
                {route.label}
              </span>
            )
          }

          return route.external
            ? (
                <a
                  href={route.href}
                  target="_blank"
                  rel="noreferrer"
                  key={route.label}
                  className="top-tab"
                >
                  {route.label}
                  {route.label === 'GitHub' ? <span className="star">★</span> : null}
                </a>
            )
            : (
              <Link
                key={route.label}
                href={route.href}
                className={`top-tab${route.href === activePath ? ' is-active' : ''}`}
              >
                {route.label}
              </Link>
            )
        })}
      </nav>
    </header>
  )
}
