/**
 * Image/video reference. `src` is optional so the catalog can ship without
 * assets: every media carries intrinsic dimensions (no CLS) and an
 * art-directed fallback the UI paints while loading or when `src` is absent.
 */
export type MediaFallback =
  | { readonly kind: 'color'; readonly value: string }
  /** Any CSS <image> gradient, e.g. `linear-gradient(160deg, #d8c6b0, #3a2c23)`. */
  | { readonly kind: 'gradient'; readonly value: string }

export interface Media {
  /** Required: describes the image for assistive tech. Use '' only for purely decorative media. */
  readonly alt: string
  readonly width: number
  readonly height: number
  readonly fallback: MediaFallback
  readonly src?: string
  readonly srcSet?: string
  /** Object-position hint for art direction, e.g. '50% 30%'. */
  readonly focalPoint?: string
}
