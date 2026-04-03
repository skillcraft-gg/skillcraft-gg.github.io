'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'skillcraft-news-post-theme'

type NewsPostThemeToggleProps = {
  targetId: string
}

export default function NewsPostThemeToggle({ targetId }: NewsPostThemeToggleProps) {
  const [isLightMode, setIsLightMode] = useState(false)

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.getElementById(targetId)
    if (!root) {
      return
    }

    root.setAttribute('data-news-theme', theme)
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark') {
        setIsLightMode(saved === 'light')
        return
      }

      const root = document.getElementById(targetId)
      if (!root) {
        return
      }

      setIsLightMode(root.getAttribute('data-news-theme') === 'light')
    } catch {
      const root = document.getElementById(targetId)
      if (!root) {
        return
      }

      setIsLightMode(root.getAttribute('data-news-theme') === 'light')
    }
  }, [targetId])

  useEffect(() => {
    applyTheme(isLightMode ? 'light' : 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, isLightMode ? 'light' : 'dark')
    } catch {
    }
  }, [isLightMode, targetId])

  return (
    <div
      className="news-post-mode-switch"
      role="group"
      aria-label="News post reading mode"
    >
        <button
          type="button"
          className={`news-post-mode-btn${isLightMode ? '' : ' is-active'}`}
          aria-pressed={!isLightMode}
          onClick={() => {
            applyTheme('dark')
            setIsLightMode(false)
          }}
        >
          Dark
        </button>
        <button
          type="button"
          className={`news-post-mode-btn${isLightMode ? ' is-active' : ''}`}
          aria-pressed={isLightMode}
          onClick={() => {
            applyTheme('light')
            setIsLightMode(true)
          }}
        >
          Light
        </button>
    </div>
  )
}
