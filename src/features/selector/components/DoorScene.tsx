import type { Media } from '@/core/domain'
import type { ExperienceId } from '@/engine'
import { showcaseMedia } from '@/infra/mock'
import { PANEL_INNER_RADIUS } from '../model'

interface PhotoProps {
  readonly media: Media
  readonly className?: string
}

/**
 * Decorative photo: the media's gradient fallback paints first, the image fades over it. The doors
 * sit in the first screen, so their photos load eagerly (lazy-loading them would delay the LCP).
 */
function Photo({ media, className = '' }: PhotoProps) {
  return (
    <div
      className={`absolute ${className}`}
      style={{
        backgroundImage: media.fallback.kind === 'gradient' ? media.fallback.value : undefined,
      }}
    >
      {media.src ? (
        <img
          src={media.src}
          alt=""
          width={media.width}
          height={media.height}
          loading="eager"
          decoding="async"
          className="size-full object-cover"
        />
      ) : null}
    </div>
  )
}

/**
 * Decorative live preview for each door. Painted with the brand's own tokens (the parent carries
 * `data-experience`), so the selector shows what each business looks like before entering it.
 */
export function DoorScene({ id }: { readonly id: ExperienceId }) {
  switch (id) {
    case 'fashion':
      return (
        <div
          aria-hidden="true"
          className="relative h-full min-h-48 overflow-hidden bg-surface-raised"
        >
          <Photo
            media={showcaseMedia.fashionMain}
            className="inset-0 h-full w-full transition-transform duration-(--shift-duration-slow) ease-brand group-hover:scale-105 group-focus-visible:scale-105"
          />
          <div className="absolute bottom-0 left-[6%] aspect-4/5 w-2/5 border-4 border-surface bg-accent transition-transform duration-(--shift-duration-slow) ease-brand group-hover:-translate-x-2 group-hover:translate-y-2 group-focus-visible:-translate-x-2 group-focus-visible:translate-y-2">
            <Photo media={showcaseMedia.fashionDetail} className="inset-0 h-full w-full" />
          </div>
        </div>
      )
    case 'food':
      return (
        <div
          aria-hidden="true"
          className={`relative h-full min-h-48 overflow-hidden ${PANEL_INNER_RADIUS} bg-accent`}
        >
          <Photo
            media={showcaseMedia.food}
            className="inset-0 h-full w-full transition-transform duration-(--shift-duration-slow) ease-brand group-hover:scale-105 group-focus-visible:scale-105"
          />
          <div className="door-breathe absolute -right-10 -bottom-14 size-48 rounded-full bg-[radial-gradient(circle,#ff9a3c99_0%,#e2531f55_45%,transparent_72%)]" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {['A la brasa', 'Para compartir', 'Entrega en 30 min'].map((chip) => (
              <span
                key={chip}
                className="rounded-control border border-line-strong bg-surface px-3 py-1.5 text-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )
    case 'market':
      return (
        <div
          aria-hidden="true"
          className="relative h-full min-h-48 overflow-hidden rounded-card bg-surface-raised"
        >
          <Photo
            media={showcaseMedia.market}
            className="inset-0 h-full w-full transition-transform duration-(--shift-duration-slow) ease-brand group-hover:scale-105 group-focus-visible:scale-105"
          />
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
            {[
              ['$ 89.900', '-30 %'],
              ['$ 249.000', null],
              ['$ 54.500', '-15 %'],
            ].map(([price, discount], index) => (
              <span
                key={price}
                style={{ transitionDelay: `${String(index * 45)}ms` }}
                className="flex items-center gap-2 rounded-card border border-line bg-surface px-2 py-1 font-mono text-xs tabular-nums transition-transform duration-(--shift-duration-base) ease-brand group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
              >
                {price}
                {discount ? (
                  <span className="bg-accent px-1 text-[0.65rem] leading-4 text-accent-ink">
                    {discount}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      )
  }
}
