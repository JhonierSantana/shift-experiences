import { useState } from 'react'
import type { MarketProduct } from '@/core/domain'
import { marketCart } from '../domain'
import { maxAddable } from '../domain/stock'

export interface AddFeedback {
  readonly kind: 'added' | 'error'
  readonly message: string
}

export function useAddToCart(product: MarketProduct) {
  const inCart = marketCart.useCart((state) =>
    state.lines.reduce((n, line) => (line.product.id === product.id ? n + line.quantity : n), 0),
  )
  const max = maxAddable(product, inCart)
  const [feedback, setFeedback] = useState<AddFeedback | null>(null)

  const add = (quantity = 1): boolean => {
    const result = marketCart.store.getState().add(product, { kind: 'market' }, quantity)
    if (result.ok) {
      setFeedback({
        kind: 'added',
        message: `${quantity === 1 ? 'Añadido' : `${String(quantity)} unidades añadidas`} al carrito.`,
      })
      return true
    }
    setFeedback({ kind: 'error', message: result.issues[0].message })
    return false
  }

  return { inCart, max, add, feedback }
}
