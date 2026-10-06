export interface Address {
  readonly id: string
  readonly label: string
  readonly recipient: string
  readonly line1: string
  readonly line2?: string
  readonly city: string
  readonly region: string
  readonly postalCode?: string
  /** ISO 3166-1 alpha-2. */
  readonly country: string
  readonly phone: string
  /** Delivery instructions (gate code, floor...). */
  readonly instructions?: string
}

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly addresses: readonly Address[]
  readonly defaultAddressId?: string
}
