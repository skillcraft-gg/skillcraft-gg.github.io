"use client"

import { useEffect, useRef, type ReactNode } from 'react'

type CursorBiasProps = {
  children: ReactNode
}

const CHAR_X_STRENGTH = 14
const CHAR_Y_STRENGTH = 10
const STRIPES_X_STRENGTH = 8
const STRIPES_Y_STRENGTH = 6

export default function CursorBias({ children }: CursorBiasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const setBias = (clientX: number, clientY: number) => {
      if (!container) {
        return
      }

      const width = window.innerWidth || 1
      const height = window.innerHeight || 1

      const xBias = (clientX / width - 0.5) * 2
      const yBias = (clientY / height - 0.5) * 2

      const nextCharX = xBias * CHAR_X_STRENGTH
      const nextCharY = yBias * CHAR_Y_STRENGTH
      const nextSwirlsX = xBias * STRIPES_X_STRENGTH
      const nextSwirlsY = yBias * STRIPES_Y_STRENGTH

      container.style.setProperty('--cursor-char-x', `${nextCharX}px`)
      container.style.setProperty('--cursor-char-y', `${nextCharY}px`)
      container.style.setProperty('--cursor-swirls-x', `${nextSwirlsX}px`)
      container.style.setProperty('--cursor-swirls-y', `${nextSwirlsY}px`)
    }

    const handleMove = (event: PointerEvent) => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      frameRef.current = requestAnimationFrame(() => {
        setBias(event.clientX, event.clientY)
      })
    }

    const handleLeave = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      container.style.setProperty('--cursor-char-x', '0px')
      container.style.setProperty('--cursor-char-y', '0px')
      container.style.setProperty('--cursor-swirls-x', '0px')
      container.style.setProperty('--cursor-swirls-y', '0px')
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) {
        return
      }
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      frameRef.current = requestAnimationFrame(() => {
        setBias(touch.clientX, touch.clientY)
      })
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('pointerleave', handleLeave, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleLeave, { passive: true })
    window.addEventListener('blur', handleLeave)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerleave', handleLeave)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchStart)
      window.removeEventListener('touchend', handleLeave)
      window.removeEventListener('blur', handleLeave)
    }
  }, [])

  return <div ref={containerRef}>{children}</div>
}
