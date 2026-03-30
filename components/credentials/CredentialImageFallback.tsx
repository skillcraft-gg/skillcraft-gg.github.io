"use client"

import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import type { CSSProperties } from 'react'

import { CREDENTIAL_IMAGE_PLACEHOLDER } from './credentialImageResolver'

type CredentialImageFallbackProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
}

export default function CredentialImageFallback({ src, onError, ...props }: CredentialImageFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src || CREDENTIAL_IMAGE_PLACEHOLDER)
  const [hasFallback, setHasFallback] = useState(false)
  const isPlaceholder = imageSrc === CREDENTIAL_IMAGE_PLACEHOLDER
  const placeholderFilterStyle = isPlaceholder ? 'brightness(0) invert(1)' : undefined

  useEffect(() => {
    setImageSrc(src || CREDENTIAL_IMAGE_PLACEHOLDER)
    setHasFallback(false)
  }, [src])

  const fallbackStyle = props.style as CSSProperties | undefined
  const mergedStyle = {
    ...fallbackStyle,
    filter: placeholderFilterStyle || fallbackStyle?.filter,
  }

  return (
    <img
      {...props}
      src={imageSrc}
      style={mergedStyle}
      onError={(event) => {
        if (!hasFallback && imageSrc !== CREDENTIAL_IMAGE_PLACEHOLDER) {
          setHasFallback(true)
          setImageSrc(CREDENTIAL_IMAGE_PLACEHOLDER)
        }

        onError?.(event)
      }}
    />
  )
}
