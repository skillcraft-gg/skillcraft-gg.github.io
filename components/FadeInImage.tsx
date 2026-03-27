"use client"

import type { ImgHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'

type FadeInImageProps = {
  className?: string
  fadeOnLoad?: boolean
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'>

export default function FadeInImage({
  className,
  fadeOnLoad = true,
  onLoad,
  onError,
  ...props
}: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const image = imgRef.current
    if (image && image.complete && image.naturalWidth > 0) {
      setIsLoaded(true)
    }
  }, [props.src])

  return (
    <img
      ref={imgRef}
      {...props}
      className={`${fadeOnLoad ? 'fade-media' : ''}${fadeOnLoad && isLoaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
      onLoad={(event) => {
        setIsLoaded(true)
        if (onLoad) {
          onLoad(event)
        }
      }}
      onError={(event) => {
        setIsLoaded(true)
        if (onError) {
          onError(event)
        }
      }}
    />
  )
}
