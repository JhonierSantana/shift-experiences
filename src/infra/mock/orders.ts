import {
  add,
  sum,
  type CartLineOf,
  type DomainAdapter,
  type DomainKind,
  type OrderOf,
} from '@/core/domain'
import { RepositoryError, type OrderRepository } from '@/core/repositories'
import type { MockBackend } from './backend'

export interface MockOrderRepositoryOptions<K extends DomainKind> {
  readonly backend: MockBackend
  readonly kind: K
  /** The "server" re-prices and re-validates lines with the same domain rules as the client. */
  readonly pricing: Pick<DomainAdapter<K>, 'currency' | 'priceLine' | 'validateSelection'>
  readonly now?: () => Date
}

/** In-memory orders (lost on reload); enough to drive checkout and confirmation screens. */
export function createMockOrderRepository<K extends DomainKind>({
  backend,
  kind,
  pricing,
  now = () => new Date(),
}: MockOrderRepositoryOptions<K>): OrderRepository<K> {
  const orders = new Map<string, OrderOf<K>>()
  let sequence = 0

  const assertOrderable = (line: CartLineOf<K>) => {
    const result = pricing.validateSelection(line.product, line.selection, line.quantity)
    if (!result.ok) {
      throw new RepositoryError('conflict', `${line.product.title}: ${result.issues[0].message}`)
    }
  }

  return {
    place(input, options) {
      return backend.request(
        'orders.place',
        () => {
          if (input.lines.length === 0)
            throw new RepositoryError('conflict', 'El carrito está vacío.')
          input.lines.forEach(assertOrderable)
          const lines = input.lines.map((line) => ({ line, price: pricing.priceLine(line) }))
          const subtotal = sum(
            lines.map((l) => l.price.total),
            pricing.currency,
          )
          const fees = input.fees ?? []
          const total = fees.reduce((acc, fee) => add(acc, fee.amount), subtotal)
          sequence += 1
          const order: OrderOf<K> = {
            id: `${kind.slice(0, 3).toUpperCase()}-${String(1000 + sequence)}`,
            kind,
            lines,
            totals: { subtotal, fees, total },
            address: input.address,
            contactEmail: input.contactEmail,
            status: 'placed',
            createdAt: now().toISOString(),
            ...(input.notes === undefined ? {} : { notes: input.notes }),
          }
          orders.set(order.id, order)
          return order
        },
        options,
      )
    },

    getById(id, options) {
      return backend.request(
        'orders.getById',
        () => {
          const order = orders.get(id)
          if (!order) throw new RepositoryError('not-found', `Pedido "${id}" no encontrado.`)
          return order
        },
        options,
      )
    },

    list(options) {
      return backend.request(
        'orders.list',
        () => [...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        options,
      )
    },
  }
}
