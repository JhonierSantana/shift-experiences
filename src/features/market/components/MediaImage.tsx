import type { CSSProperties } from 'react'
import type { Media } from '@/core/domain'

interface MediaImageProps {
  readonly media: Media
  readonly className?: string
  /** Above-the-fold media loads eagerly; the rest is lazy. */
  readonly priority?: boolean
  readonly sizes?: string
}

function fallbackStyle({ fallback, width, height }: Media): CSSProperties {
  // The aspect-ratio reserves the box before any pixel loads (no layout shift).
  const base: CSSProperties = { aspectRatio: `${String(width)} / ${String(height)}` }
  return fallback.kind === 'gradient'
    ? { ...base, backgroundImage: fallback.value }
    : { ...base, backgroundColor: fallback.value }
}

/** Typed Media renderer: art-directed fallback first, the real image (when `src` exists) on top. */
export function MediaImage({ media, className = '', priority = false, sizes }: MediaImageProps) {
  const decorative = media.alt === ''
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={fallbackStyle(media)}
      {...(media.src
        ? {}
        : decorative
          ? { 'aria-hidden': true }
          : { role: 'img', 'aria-label': media.alt })}
    >
      {media.src ? (
        <img
          src={media.src}
          {...(media.srcSet ? { srcSet: media.srcSet } : {})}
          {...(sizes ? { sizes } : {})}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={media.focalPoint ? { objectPosition: media.focalPoint } : undefined}
        />
      ) : null}
    </div>
  )
}
