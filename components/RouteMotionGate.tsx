"use client"

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'

const INITIAL_MOTION_KEY = 'skillcraft-initial-motion-seen'
const INITIAL_MOTION_PATH_KEY = 'skillcraft-initial-motion-path'
const INITIAL_MOTION_CLASS = 'is-initial-load-motion'
const INITIAL_MOTION_DURATION_MS = 1600

export default function RouteMotionGate() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    try {
      const session = window.sessionStorage
      const hasSeenMotion = Boolean(session.getItem(INITIAL_MOTION_KEY))

      const firstPath = session.getItem(INITIAL_MOTION_PATH_KEY)
      if (hasSeenMotion || (firstPath && pathname !== firstPath)) {
        document.body.classList.remove(INITIAL_MOTION_CLASS)
        return
      }

      if (!firstPath) {
        session.setItem(INITIAL_MOTION_PATH_KEY, pathname)
      }

      document.body.classList.add(INITIAL_MOTION_CLASS)
      session.setItem(INITIAL_MOTION_KEY, '1')

      const timer = window.setTimeout(() => {
        document.body.classList.remove(INITIAL_MOTION_CLASS)
      }, INITIAL_MOTION_DURATION_MS)

      return () => {
        window.clearTimeout(timer)
        document.body.classList.remove(INITIAL_MOTION_CLASS)
      }
    }
    catch {
      return
    }

    return
  }, [pathname])

  return null
}
