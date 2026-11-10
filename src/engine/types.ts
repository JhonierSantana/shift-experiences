import type { ComponentType, ReactNode } from 'react'
import type { RouteObject } from 'react-router'
import type { AnyDomainAdapter, Product } from '@/core/domain'

/** Businesses the engine can host. Adding one = new folder in src/features + registry entry. */
export type ExperienceId = 'fashion' | 'food' | 'market'

/** Value of `data-experience` on <html>. The selector is a scope, not a registered experience. */
export type ExperienceScope = ExperienceId | 'selector'

/**
 * Eagerly-loaded, tiny description of an experience (copy only).
 * Importing a manifest also registers the experience's tokens.css, so previews
 * (e.g. selector cards) can scope brand tokens without loading the full chunk.
 */
export interface ExperienceManifest {
  readonly id: ExperienceId
  readonly name: string
  readonly sector: string
  readonly tagline: string
}

export interface LogoProps {
  readonly className?: string
}

export interface BrandIdentity extends Omit<ExperienceManifest, 'id'> {
  readonly Logo: ComponentType<LogoProps>
}

/**
 * JS-side theme values. Semantic design tokens (surface, ink, accent, fonts,
 * radius, spacing, easing, duration) are CSS custom properties in each
 * experience's tokens.css, scoped by [data-experience]; they are not duplicated here.
 */
export interface ThemeMeta {
  /** Browser UI color (<meta name="theme-color">). Should equal --shift-surface. */
  readonly themeColor: string
}

export interface FontSpec {
  /** Stylesheet URL (e.g. Google Fonts css2 with display=swap). Loaded only when the experience mounts. */
  readonly href: string
}

export type CapabilityName =
  // fashion
  | 'sizeGuide'
  | 'shopTheLook'
  | 'quickZoom'
  // food
  | 'customization'
  | 'nutritionInfo'
  | 'fulfillmentMode'
  | 'openingHours'
  // market
  | 'facetedFilters'
  | 'compare'
  | 'reviews'
  | 'deals'
  // shared
  | 'wishlist'

export type CapabilitySet = ReadonlySet<CapabilityName>

/**
 * Components the engine renders but each experience may restyle.
 * Grows in later milestones (ProductCard, CartLine, ...). Optional per experience;
 * the engine ships a neutral default for every key.
 */
export interface SlotPropsMap {
  NotFound: object
  /** Catalog tile. Receives any domain's product; an experience narrows on `product.kind`. */
  ProductCard: { readonly product: Product }
}

export type SlotName = keyof SlotPropsMap

export type SlotMap = { readonly [K in SlotName]: ComponentType<SlotPropsMap[K]> }

export interface ShellProps {
  readonly children: ReactNode
}

export interface SwitchOrigin {
  readonly x: number
  readonly y: number
}

export interface SwitchViewport {
  readonly width: number
  readonly height: number
}

/** Brand choreography used when entering this experience from another scope. */
export interface SwitchTransitionSpec {
  readonly duration: number
  readonly easing: string
  /** Keyframes for ::view-transition-new(root). */
  readonly enter: (origin: SwitchOrigin, viewport: SwitchViewport) => Keyframe[]
  /** Optional keyframes for ::view-transition-old(root). */
  readonly exit?: (origin: SwitchOrigin, viewport: SwitchViewport) => Keyframe[]
}

export interface MotionPreset {
  readonly switchIn: SwitchTransitionSpec
}

export interface ExperienceDefinition {
  readonly id: ExperienceId
  readonly brand: BrandIdentity
  readonly theme: ThemeMeta
  readonly fonts: readonly FontSpec[]
  readonly capabilities: CapabilitySet
  readonly shell: ComponentType<ShellProps>
  readonly slots: Partial<SlotMap>
  /** Child routes, relative to /<id>. Use `lazy` for page-level code splitting. */
  readonly routes: RouteObject[]
  readonly motion: MotionPreset
  /** Domain rules (pricing, line descriptions, validation) and repositories. Its kind must equal id. */
  readonly domain: AnyDomainAdapter
}
