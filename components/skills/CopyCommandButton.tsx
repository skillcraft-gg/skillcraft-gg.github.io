'use client'

import { useEffect, useRef, useState } from 'react'

type CopyCommandButtonProps = {
  text: string
  label?: string
  className?: string
}

export default function CopyCommandButton({ text, label = 'Copy', className }: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, 1300)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      className={`${className?.trim() || 'copy-command'}${copied && className ? ' copy-copied' : copied ? ' is-copied' : ''}`}
      onClick={handleCopy}
      aria-live="polite"
      aria-label={copied ? 'Copied install command to clipboard' : 'Copy install command to clipboard'}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
