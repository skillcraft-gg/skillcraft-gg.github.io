"use client"

import { useEffect, useState } from 'react'

const CHARACTERS = ['/images/charm.png', '/images/charf.png']

function getRandomIndex(): number {
  return Math.floor(Math.random() * CHARACTERS.length)
}

function pickNextCharacter(currentIndex: number): number {
  if (CHARACTERS.length <= 1) {
    return currentIndex
  }

  const randomSlot = Math.floor(Math.random() * (CHARACTERS.length - 1))
  return randomSlot >= currentIndex ? randomSlot + 1 : randomSlot
}

function nextSwapDelayMs(): number {
  return 9000 + Math.floor(Math.random() * 7000)
}

export default function AnimatedCharacter() {
  const [activeIndex, setActiveIndex] = useState<number>(getRandomIndex)

  useEffect(() => {
    if (CHARACTERS.length <= 1) {
      return undefined
    }

    let swapTimer: ReturnType<typeof globalThis.setTimeout> | null = null

    const scheduleSwap = () => {
      swapTimer = setTimeout(() => {
        setActiveIndex((currentIndex) => pickNextCharacter(currentIndex))
        scheduleSwap()
      }, nextSwapDelayMs())
    }

    swapTimer = setTimeout(scheduleSwap, nextSwapDelayMs())

    return () => {
      if (swapTimer !== null) {
        clearTimeout(swapTimer)
      }
    }
  }, [])

  return (
    <>
      {CHARACTERS.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className={`char-layer char-layer--${index}${index === activeIndex ? ' is-visible' : ''}`}
        />
      ))}
    </>
  )
}
