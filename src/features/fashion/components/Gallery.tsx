import { useState } from 'react'
import type { Media } from '@/core/domain'
import { Capability, useCapability } from '@/engine'
import { CloseIcon } from './Icons'
import { MediaImage } from './MediaImage'
import { Modal } from './Modal'
import { eyebrow } from './styles'

interface GalleryProps {
  readonly media: readonly [Media, ...Media[]]
  readonly title: string
}

/**
 * Mobile: full-bleed swipeable strip (native scroll-snap). Desktop: a stacked column.
 * With `quickZoom`, each image opens a scrollable 2x view (native scroll = touch pan + keyboard).
 */
export function Gallery({ media, title }: GalleryProps) {
  const zoomable = useCapability('quickZoom')
  const [zoomed, setZoomed] = useState<number | null>(null)
  const active = zoomed === null ? undefined : media[zoomed]

  return (
    <>
      <ul
        aria-label={`Fotografías de ${title}`}
        className="-mx-gutter flex snap-x snap-mandatory overflow-x-auto lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible"
      >
        {media.map((item, index) => (
          <li
            key={item.alt}
            className={`w-full shrink-0 snap-center ${index === 0 || media.length === 2 ? 'lg:col-span-2' : ''}`}
          >
            {zoomable ? (
              <button
                type="button"
                onClick={() => {
                  setZoomed(index)
                }}
                aria-label={`Ampliar: ${item.alt}`}
                className="block w-full cursor-zoom-in"
              >
                <MediaImage
                  media={item}
                  priority={index === 0}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                />
              </button>
            ) : (
              <MediaImage
                media={item}
                priority={index === 0}
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            )}
          </li>
        ))}
      </ul>
      <p aria-hidden="true" className={`${eyebrow} mt-3 text-ink-muted lg:hidden`}>
        Desliza · {media.length} imágenes
      </p>
      <Capability name="quickZoom">
        <Modal
          open={zoomed !== null}
          onClose={() => {
            setZoomed(null)
          }}
          label={`Imagen ampliada de ${title}`}
          placement="full"
        >
          <div className="relative h-full bg-surface-raised">
            <button
              type="button"
              onClick={() => {
                setZoomed(null)
              }}
              aria-label="Cerrar imagen ampliada"
              className="fixed top-3 right-3 z-10 grid size-11 place-items-center bg-surface"
            >
              <CloseIcon />
            </button>
            {/* Scrollable region reachable by keyboard so the enlarged image can be panned. */}
            <div
              role="region"
              aria-label="Imagen ampliada; desplázate para explorar el detalle"
              // Scrollable regions must be keyboard-focusable (WCAG 2.1.1).
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              className="h-full overflow-auto overscroll-contain"
            >
              {active ? (
                <MediaImage media={active} className="w-[190%] max-w-none md:w-[130%]" priority />
              ) : null}
            </div>
          </div>
        </Modal>
      </Capability>
    </>
  )
}
