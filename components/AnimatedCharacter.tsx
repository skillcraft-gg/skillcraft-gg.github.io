"use client"

import { useLayoutEffect, useState } from 'react'

import FadeInImage from './FadeInImage'

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
  const [activeIndex, setActiveIndex] = useState(0)

  useLayoutEffect(() => {
    if (CHARACTERS.length <= 1) {
      return undefined
    }

    let swapTimer: ReturnType<typeof globalThis.setTimeout> | null = null

    const startWithRandomCharacter = () => {
      setActiveIndex(getRandomIndex())
    }

    startWithRandomCharacter()

    const scheduleSwap = () => {
      swapTimer = setTimeout(() => {
        setActiveIndex((currentIndex) => pickNextCharacter(currentIndex))
        scheduleSwap()
      }, nextSwapDelayMs())
    }

    scheduleSwap()

    return () => {
      if (swapTimer !== null) {
        clearTimeout(swapTimer)
      }
    }
  }, [])

  return (
    <>
      {CHARACTERS.map((src, index) => (
        <FadeInImage
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          loading="eager"
          width={1700}
          height={1700}
          fadeOnLoad={false}
          className={`char-layer char-layer--${index}${index === activeIndex ? ' is-visible' : ''}`}
        />
      ))}
    </>
  )
}
