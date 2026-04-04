'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

function syncModalQueryParam(openQueryParam: string, shouldBeOpen: boolean) {
  const url = new URL(window.location.href)

  if (shouldBeOpen) {
    url.searchParams.set(openQueryParam, '')
  } else {
    url.searchParams.delete(openQueryParam)
  }

  const search = url.searchParams.toString()
  const nextUrl = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
  window.history.replaceState(window.history.state, '', nextUrl)
}

type LinkedInShareModalProps = {
  credentialPageUrl: string
  suggestedMessages: string[]
  buttonClassName?: string
  buttonLabel?: string
  openQueryParam?: string
}

export default function LinkedInShareModal({
  credentialPageUrl,
  suggestedMessages,
  buttonClassName = 'btn btn-primary detail-share-link btn-linkedin',
  buttonLabel = 'Share on LinkedIn',
  openQueryParam,
}: LinkedInShareModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoOpenedRef = useRef(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)

  const safeMessages = useMemo(
    () => suggestedMessages.filter((message) => typeof message === 'string' && message.trim().length > 0),
    [suggestedMessages],
  )

  const encodedShareUrl = useMemo(
    () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(credentialPageUrl)}`,
    [credentialPageUrl],
  )

  useEffect(() => {
    if (!openQueryParam || hasAutoOpenedRef.current) {
      return
    }

    const currentSearchParams = new URLSearchParams(window.location.search)
    if (currentSearchParams.has(openQueryParam)) {
      hasAutoOpenedRef.current = true
      setIsOpen(true)
    }
  }, [openQueryParam])

  useEffect(() => {
    if (!openQueryParam) {
      return
    }

    syncModalQueryParam(openQueryParam, isOpen)
  }, [isOpen, openQueryParam])

  useEffect(() => {
    const message = copiedMessageIndex
    if (message === null) {
      return
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopiedMessageIndex(null)
    }, 1300)

    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [copiedMessageIndex])

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      return
    }

    const shouldLockBodyScroll = !window.matchMedia('(max-width: 980px)').matches
    const previousBodyOverflow = document.body.style.overflow

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (shouldLockBodyScroll) {
      document.body.style.overflow = 'hidden'
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 980px)').matches) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }

      if (overlayRef.current) {
        overlayRef.current.scrollTop = 0
      }

      if (messagesRef.current) {
        messagesRef.current.scrollTop = 0
      }
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [isOpen])

  const handleCopyMessage = async (message: string, index: number) => {
    if (!navigator?.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(message)
      setCopiedMessageIndex(index)
    } catch {
      setCopiedMessageIndex(null)
    }
  }

  const handleStartPost = () => {
    setIsOpen(false)
    window.open(encodedShareUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open LinkedIn share options"
      >
        <span className="btn-icon btn-linkedin-badge" aria-hidden="true">in</span>
        <span className="detail-share-text">{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          ref={overlayRef}
          className="linkedin-share-overlay"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="linkedin-share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="linkedin-share-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="linkedin-share-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close share modal"
            >
              <span className="linkedin-share-close-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 6.5L17.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17.5 6.5L6.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            <p className="linkedin-share-subtitle">Share this credential on LinkedIn</p>

            <h3 id="linkedin-share-title" className="linkedin-share-title">Suggested post text</h3>

            <div ref={messagesRef} className="linkedin-share-messages">
              {safeMessages.map((message, index) => (
                <article key={`${index}-${message.slice(0, 28)}`} className="linkedin-share-message">
                  <p>{message}</p>
                  <button
                    type="button"
                    className={`copy-command ${copiedMessageIndex === index ? 'is-copied' : ''}`}
                    onClick={() => handleCopyMessage(message, index)}
                    aria-live="polite"
                    aria-label={copiedMessageIndex === index ? 'Post text copied' : 'Copy post text'}
                  >
                    {copiedMessageIndex === index ? 'Copied' : 'Copy'}
                  </button>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-linkedin linkedin-share-start-btn"
              onClick={handleStartPost}
            >
              <span className="btn-icon btn-linkedin-badge" aria-hidden="true">in</span>
              Start a post
            </button>
          </section>
        </div>
      )}
    </>
  )
}
