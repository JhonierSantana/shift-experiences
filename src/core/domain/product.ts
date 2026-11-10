import type { Media } from './media'
import type { Money } from './money'

/**
 * Business domains the core understands. Deliberately separate from the
 * engine's ExperienceId (core never imports the engine); the registry checks
 * at load time that each experience declares the matching domain.
 */
export type DomainKind = 'fashion' | 'food' | 'market'

export interface BaseProduct<K extends DomainKind> {
  readonly kind: K
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly description: string
  /** Regular unit price. Variants/options/discounts are applied by the domain adapter. */
  readonly price: Money
  /** First item is the primary image. */
  readonly media: readonly [Media, ...Media[]]
  readonly categoryId: string
  readonly tags: readonly string[]
  /** ISO date, used for "newest" sorting. */
  readonly createdAt: string
}

export interface Category {
  readonly id: string
  readonly label: string
  readonly description?: string
}

// ---------------------------------------------------------------- fashion

export type FashionFit = 'slim' | 'regular' | 'relaxed' | 'oversized'

export interface FashionColor {
  readonly id: string
  readonly name: string
  /** CSS color for the swatch. */
  readonly swatch: string
}

export interface FashionVariant {
  readonly sku: string
  readonly size: string
  readonly colorId: string
  readonly stock: number
  /** Overrides the product price for this variant (e.g. larger sizes). */
  readonly price?: Money
}

export interface FashionProduct extends BaseProduct<'fashion'> {
  readonly collectionId: string
  /** Display order of sizes, e.g. ['XS','S','M','L'] or ['36','38','40']. */
  readonly sizes: readonly string[]
  readonly colors: readonly FashionColor[]
  /** One entry per size x color combination that is sold. */
  readonly variants: readonly FashionVariant[]
  readonly fit: FashionFit
  readonly composition: string
  readonly care: readonly string[]
  readonly lookIds: readonly string[]
}

export interface FashionCollection {
  readonly id: string
  readonly name: string
  readonly season: string
  readonly statement: string
}

export interface Look {
  readonly id: string
  readonly title: string
  readonly collectionId: string
  readonly productIds: readonly string[]
  readonly media: Media
}

// ---------------------------------------------------------------- food

export type Allergen =
  | 'gluten'
  | 'dairy'
  | 'egg'
  | 'nuts'
  | 'peanuts'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'sulphites'

export interface Nutrition {
  readonly servingGrams: number
  readonly kcal: number
  readonly proteinGrams: number
  readonly carbsGrams: number
  readonly fatGrams: number
}

export interface FoodOption {
  readonly id: string
  readonly label: string
  /** Added to the item price per unit; zero for free choices. */
  readonly priceDelta: Money
  readonly allergens?: readonly Allergen[]
}

export interface FoodOptionGroup {
  readonly id: string
  readonly label: string
  /** min 1 = required choice; max 1 = single choice (radio), > 1 = multi (checkbox). */
  readonly min: number
  readonly max: number
  readonly options: readonly FoodOption[]
}

export interface FoodItem extends BaseProduct<'food'> {
  readonly ingredients: readonly string[]
  readonly allergens: readonly Allergen[]
  readonly nutrition: Nutrition
  readonly optionGroups: readonly FoodOptionGroup[]
  readonly prepTimeMinutes: number
  /** 0 = mild ... 3 = very hot. */
  readonly spiceLevel: 0 | 1 | 2 | 3
  readonly available: boolean
}

// ---------------------------------------------------------------- market

export interface ProductSpec {
  readonly group: string
  readonly label: string
  readonly value: string
}

export interface RatingSummary {
  /** 0..5, one decimal. */
  readonly average: number
  readonly count: number
  /** Count of reviews per star, index 0 = 1 star. */
  readonly distribution: readonly [number, number, number, number, number]
}

export interface Seller {
  readonly id: string
  readonly name: string
  readonly rating: number
  readonly official: boolean
}

export interface Discount {
  /** Integer percentage off the regular price. */
  readonly percent: number
  readonly label: string
}

export interface MarketProduct extends BaseProduct<'market'> {
  readonly brand: string
  readonly specs: readonly ProductSpec[]
  readonly rating: RatingSummary
  readonly stock: number
  readonly discount?: Discount
  readonly seller: Seller
  readonly freeShipping: boolean
}

export interface Review {
  readonly id: string
  readonly productId: string
  readonly author: string
  readonly rating: 1 | 2 | 3 | 4 | 5
  readonly title: string
  readonly body: string
  readonly createdAt: string
  readonly verifiedPurchase: boolean
}

// ---------------------------------------------------------------- unions

export interface ProductByKind {
  readonly fashion: FashionProduct
  readonly food: FoodItem
  readonly market: MarketProduct
}

export type ProductOf<K extends DomainKind> = ProductByKind[K]
export type Product = ProductOf<DomainKind>
