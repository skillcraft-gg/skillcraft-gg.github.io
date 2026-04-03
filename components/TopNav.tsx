"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { LOGO_URL, ROUTES } from '../lib/navigation'
import FadeInImage from './FadeInImage'

const GitHubIcon = () => (
  <svg className="top-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.387 7.86 10.91.574.105.783-.25.783-.555 0-.273-.01-1.12-.016-2.02-3.197.695-3.873-1.54-3.873-1.54-.522-1.327-1.275-1.68-1.275-1.68-1.044-.714.08-.7.08-.7 1.155.081 1.763 1.187 1.763 1.187 1.026 1.757 2.692 1.25 3.35.955.104-.742.4-1.251.726-1.539-2.553-.29-5.237-1.276-5.237-5.678 0-1.255.45-2.281 1.186-3.084-.119-.29-.513-1.462.112-3.047 0 0 .968-.31 3.173 1.178a11.04 11.04 0 0 1 2.89-.387c.98.005 1.965.132 2.89.387 2.204-1.488 3.17-1.178 3.17-1.178.627 1.585.233 2.757.114 3.047.738.803 1.185 1.83 1.185 3.084 0 4.412-2.687 5.385-5.249 5.67.41.353.775 1.05.775 2.116 0 1.529-.014 2.762-.014 3.138 0 .307.206.666.79.553C20.713 21.38 24 17.08 24 12 24 5.65 18.85.5 12 .5Z"
    />
  </svg>
)

type TopNavProps = {
  activePath?: string
  launchBannerOffset?: boolean
}

export default function TopNav({ activePath = '/', launchBannerOffset = false }: TopNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!launchBannerOffset) {
      return
    }

    const onScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [launchBannerOffset])

  const navClassName = ['top-nav', launchBannerOffset ? (isScrolled ? 'top-nav--scrolled' : 'top-nav--banner') : null]
    .filter(Boolean)
    .join(' ')

  return (
    <header className="top-bar">
        <Link href="/" className="brand" aria-label="Skillcraft home">
          <FadeInImage src={LOGO_URL} alt="Skillcraft" width={200} height={40} loading="eager" fadeOnLoad={false} />
        </Link>
      <nav className={navClassName} aria-label="Primary">
        {ROUTES.map((route) => {
          if (route.disabled) {
            return (
              <span
                key={route.label}
                className="top-tab is-disabled"
                aria-disabled="true"
                title={route.badge || 'Coming soon'}
              >
                {route.label}
                {route.badge ? (
                  <span className="top-tab-pill">{route.badge}</span>
                ) : null}
              </span>
            )
          }

          return route.external
            ? (
                <a
                  href={route.href}
                  target={route.label === 'Docs' ? undefined : '_blank'}
                  rel={route.label === 'Docs' ? undefined : 'noreferrer'}
                  key={route.label}
                  className="top-tab"
                >
                  {route.label === 'GitHub' ? <GitHubIcon /> : null}
                  {route.label}
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
