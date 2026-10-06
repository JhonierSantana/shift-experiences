import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { MarketProduct } from '@/core/domain'
import { RepositoryError, type MarketFilters } from '@/core/repositories'
import { MockBackend, createMockProductRepository } from '@/infra/mock'
import { testProduct } from '@/test/factories'
import { createQueryClient, queryKeys, shouldRetry, useProduct } from '.'

function source(scope: string, title: string) {
  return {
    scope,
    repositories: {
      products: createMockProductRepository<MarketProduct, MarketFilters>({
        backend: new MockBackend(),
        load: () =>
          Promise.resolve({ products: [testProduct({ id: 'same-id', title })], categories: [] }),
      }),
    },
  }
}

function wrapper() {
  const client = createQueryClient()
  return {
    client,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  }
}

describe('query layer', () => {
  it('retries transient failures only', () => {
    expect(shouldRetry(0, new RepositoryError('network', 'x'))).toBe(true)
    expect(shouldRetry(2, new RepositoryError('server', 'x'))).toBe(false)
    expect(shouldRetry(0, new RepositoryError('not-found', 'x'))).toBe(false)
  })

  it('namespaces the cache per experience scope', async () => {
    const { client, Wrapper } = wrapper()
    const fashion = renderHook(() => useProduct(source('fashion', 'Abrigo'), 'same-id'), {
      wrapper: Wrapper,
    })
    const market = renderHook(() => useProduct(source('market', 'Audífonos'), 'same-id'), {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(fashion.result.current.data?.title).toBe('Abrigo')
      expect(market.result.current.data?.title).toBe('Audífonos')
    })
    expect(client.getQueryData(queryKeys.product('fashion', 'same-id'))).toMatchObject({
      title: 'Abrigo',
    })
  })

  it('surfaces not-found immediately as an error state', async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useProduct(source('market', 'x'), 'missing'), {
      wrapper: Wrapper,
    })
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toMatchObject({ code: 'not-found' })
    expect(result.current.failureCount).toBe(1)
  })
})
