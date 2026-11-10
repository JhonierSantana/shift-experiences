import type { FashionCollection, Look, Review } from '@/core/domain'
import { RepositoryError, type LookRepository, type ReviewRepository } from '@/core/repositories'
import type { MockBackend } from './backend'
import { once, paginate } from './products'

export function createMockLookRepository(options: {
  readonly backend: MockBackend
  readonly load: () => Promise<{
    readonly looks: readonly Look[]
    readonly collections: readonly FashionCollection[]
  }>
}): LookRepository {
  const { backend } = options
  const load = once(options.load)
  return {
    list: (requestOptions) =>
      backend.request('looks.list', async () => (await load()).looks, requestOptions),
    getById: (id, requestOptions) =>
      backend.request(
        'looks.getById',
        async () => {
          const look = (await load()).looks.find((l) => l.id === id)
          if (!look) throw new RepositoryError('not-found', `Look "${id}" no encontrado.`)
          return look
        },
        requestOptions,
      ),
    listCollections: (requestOptions) =>
      backend.request(
        'looks.listCollections',
        async () => (await load()).collections,
        requestOptions,
      ),
  }
}

export function createMockReviewRepository(options: {
  readonly backend: MockBackend
  readonly load: () => Promise<readonly Review[]>
}): ReviewRepository {
  const { backend } = options
  const load = once(options.load)
  const sorters = {
    newest: (a: Review, b: Review) => b.createdAt.localeCompare(a.createdAt),
    highest: (a: Review, b: Review) =>
      b.rating - a.rating || b.createdAt.localeCompare(a.createdAt),
    lowest: (a: Review, b: Review) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt),
  }
  return {
    listByProduct: (productId, query = {}, requestOptions) =>
      backend.request(
        'reviews.listByProduct',
        async () => {
          const reviews = (await load())
            .filter((r) => r.productId === productId)
            .sort(sorters[query.sort ?? 'newest'])
          return paginate(reviews, query.page, query.pageSize ?? 5)
        },
        requestOptions,
      ),
  }
}
