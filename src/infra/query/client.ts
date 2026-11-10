import { QueryClient } from '@tanstack/react-query'
import { isRepositoryError } from '@/core/repositories'

const MAX_RETRIES = 2

export function shouldRetry(failureCount: number, error: unknown): boolean {
  // not-found / conflict are answers, not outages: retrying cannot help.
  if (isRepositoryError(error) && !error.retryable) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Catalog data changes rarely; avoid refetch storms when switching experiences.
        staleTime: 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
