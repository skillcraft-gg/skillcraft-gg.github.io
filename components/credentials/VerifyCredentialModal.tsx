'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import CredentialRequirementsRenderer from './CredentialRequirementsRenderer'

type VerifyCredentialCommitReference = {
  commit: string
  repo?: string
  commitUrl?: string
  proofUrl?: string
}

type VerifyCredentialModalProps = {
  credentialName: string
  credentialDefinitionId: string
  holderHandle: string
  issuedDate: string
  claimId: string
  sourceSummary: string
  credentialUrl: string
  requirements: unknown
  commitReferences: VerifyCredentialCommitReference[]
  buttonClassName?: string
  buttonLabel?: string
  openQueryParam?: string
}

export default function VerifyCredentialModal({
  credentialName,
  credentialDefinitionId,
  holderHandle,
  issuedDate,
  claimId,
  sourceSummary,
  credentialUrl,
  requirements,
  commitReferences,
  buttonClassName = 'btn btn-secondary',
  buttonLabel = 'Verify Credential',
  openQueryParam,
}: VerifyCredentialModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleSectionCount, setVisibleSectionCount] = useState(0)
  const [isVerificationComplete, setIsVerificationComplete] = useState(false)
  const revealTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const hasAutoOpenedRef = useRef(false)

  const safeCommits = useMemo(
    () => commitReferences.filter((entry) => typeof entry.commit === 'string' && entry.commit.trim().length > 0),
    [commitReferences],
  )

  const repositoryCount = useMemo(
    () => new Set(safeCommits.map((entry) => entry.repo).filter((value): value is string => Boolean(value))).size,
    [safeCommits],
  )
  const repositoryLabel = repositoryCount === 1 ? 'repository' : 'repositories'

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
    if (!isOpen) {
      revealTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      revealTimeoutsRef.current = []
      setVisibleSectionCount(0)
      setIsVerificationComplete(false)
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

    const revealDelays = [260, 760, 1360, 2060]

    setVisibleSectionCount(0)
    setIsVerificationComplete(false)

    revealTimeoutsRef.current = revealDelays.map((delay, index) => setTimeout(() => {
      setVisibleSectionCount(index + 1)
      if (index === revealDelays.length - 1) {
        setIsVerificationComplete(true)
      }
    }, delay))

    if (shouldLockBodyScroll) {
      document.body.style.overflow = 'hidden'
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      revealTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      revealTimeoutsRef.current = []
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open credential verification walkthrough"
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          className="credential-verify-overlay"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="credential-verify-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credential-verify-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="credential-verify-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close verification modal"
            >
              <span className="credential-verify-close-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 6.5L17.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17.5 6.5L6.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            <div className="credential-verify-title-row">
              <h3 id="credential-verify-title" className="credential-verify-title">
                Verifying Credential
              </h3>
              <span
                className={`credential-verify-status${isVerificationComplete ? ' is-complete' : ' is-loading'}`}
                aria-live="polite"
                aria-label={isVerificationComplete ? 'Verification complete' : 'Verification in progress'}
              >
                {isVerificationComplete ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12.5L10.8 15.3L16.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="credential-verify-spinner" aria-hidden="true" />
                )}
              </span>
            </div>
            <div className="credential-verify-scroll">
              <div className="credential-verify-sections">
                {visibleSectionCount >= 1 ? (
                  <section className="credential-verify-section">
                    <p className="label">1. Claim Submitted</p>
                    <ul className="detail-list detail-list--compact">
                      <li>
                        <strong>Claim submitted by:</strong>
                        <span>@{holderHandle}</span>
                      </li>
                      <li>
                        <strong>Credential requested:</strong>
                        <span>{credentialName}</span>
                      </li>
                      <li>
                        <strong>Credential definition:</strong>
                        <span>{credentialDefinitionId}</span>
                      </li>
                      <li>
                        <strong>Claim ID:</strong>
                        <span>{claimId || 'Not provided'}</span>
                      </li>
                    </ul>
                  </section>
                ) : null}

                {visibleSectionCount >= 2 ? (
                  <section className="credential-verify-section">
                    <p className="label">2. Credential Requirements</p>
                    <CredentialRequirementsRenderer requirements={requirements} emptyMessage="No requirements were defined for this credential." />
                  </section>
                ) : null}

                {visibleSectionCount >= 3 ? (
                  <section className="credential-verify-section">
                    <p className="label">3. Evidence Review</p>
                    <p className="caption">
                      {sourceSummary}
                      {safeCommits.length > 0 ? ` ${safeCommits.length} commits across ${repositoryCount || 1} ${repositoryLabel} are linked below.` : ''}
                    </p>

                    {safeCommits.length === 0 ? (
                      <p className="caption">No source commits were published for this credential.</p>
                    ) : (
                      <div className="credential-verify-commit-list">
                        {safeCommits.map((entry, index) => (
                          <article key={`${entry.commit}-${index}`} className="credential-verify-commit-card">
                            <div className="credential-verify-commit-copy">
                              <p className="credential-verify-commit-sha">{entry.commit}</p>
                              {entry.repo ? <p className="credential-verify-commit-repo">{entry.repo}</p> : null}
                            </div>
                            <div className="credential-verify-commit-actions">
                              {entry.commitUrl ? (
                                <a className="tag" href={entry.commitUrl} target="_blank" rel="noreferrer">
                                  View Commit
                                </a>
                              ) : null}
                              {entry.proofUrl ? (
                                <a className="tag" href={entry.proofUrl} target="_blank" rel="noreferrer">
                                  View Proof
                                </a>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {visibleSectionCount >= 4 ? (
                  <section className="credential-verify-section">
                    <p className="label">4. Issued Credential Confirmation</p>
                    <ul className="detail-list detail-list--compact">
                      <li>
                        <strong>Issued to:</strong>
                        <span>@{holderHandle}</span>
                      </li>
                      <li>
                        <strong>Issue date:</strong>
                        <span>{issuedDate}</span>
                      </li>
                      <li>
                        <strong>Credential URL:</strong>
                        <a href={credentialUrl} target="_blank" rel="noreferrer">
                          {credentialUrl}
                        </a>
                      </li>
                    </ul>
                  </section>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
