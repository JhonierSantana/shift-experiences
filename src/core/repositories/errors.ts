export type RepositoryErrorCode = 'network' | 'timeout' | 'not-found' | 'conflict' | 'server'

const RETRYABLE: ReadonlySet<RepositoryErrorCode> = new Set(['network', 'timeout', 'server'])

/** The only error type repositories reject with (besides AbortError on cancellation). */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode

  constructor(code: RepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RepositoryError'
    this.code = code
  }

  /** Transient failures worth retrying; not-found/conflict never succeed on retry. */
  get retryable(): boolean {
    return RETRYABLE.has(this.code)
  }
}

export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError
}
