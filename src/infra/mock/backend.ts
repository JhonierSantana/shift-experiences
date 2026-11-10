import { RepositoryError, type RepositoryErrorCode, type RequestOptions } from '@/core/repositories'

export interface MockBackendOptions {
  /** Simulated round-trip in ms: fixed or a [min, max] range. */
  readonly latency?: number | readonly [number, number]
  /** Probability (0..1) that any request fails with a transient error. */
  readonly failureRate?: number
  /** Injectable for deterministic tests. */
  readonly random?: () => number
}

interface ScheduledFailure {
  readonly code: RepositoryErrorCode
  /** Only fail this operation (e.g. 'products.list'); any operation when absent. */
  readonly operation?: string
  remaining: number
}

function abortError(): DOMException {
  return new DOMException('The request was aborted', 'AbortError')
}

function wait(ms: number, signal: AbortSignal | undefined): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

const FAILURE_MESSAGES: Record<RepositoryErrorCode, string> = {
  network: 'No pudimos conectar con el servidor.',
  timeout: 'El servidor tardó demasiado en responder.',
  'not-found': 'No encontramos lo que buscas.',
  conflict: 'La información cambió mientras la usabas.',
  server: 'El servidor tuvo un problema inesperado.',
}

/**
 * Fake network shared by the mock repositories of one experience:
 * latency, random transient failures and scripted failures for tests/demos.
 */
export class MockBackend {
  private latency: number | readonly [number, number]
  private failureRate: number
  private readonly random: () => number
  private readonly scheduled: ScheduledFailure[] = []

  constructor(options: MockBackendOptions = {}) {
    this.latency = options.latency ?? 0
    this.failureRate = options.failureRate ?? 0
    this.random = options.random ?? Math.random
  }

  configure(options: Pick<MockBackendOptions, 'latency' | 'failureRate'>): void {
    if (options.latency !== undefined) this.latency = options.latency
    if (options.failureRate !== undefined) this.failureRate = options.failureRate
  }

  /** The next `times` matching requests reject with `code`. */
  failNext(
    code: RepositoryErrorCode,
    { operation, times = 1 }: { operation?: string; times?: number } = {},
  ): void {
    this.scheduled.push(
      operation === undefined ? { code, remaining: times } : { code, operation, remaining: times },
    )
  }

  reset(): void {
    this.scheduled.length = 0
    this.failureRate = 0
  }

  private delay(): number {
    if (typeof this.latency === 'number') return this.latency
    const [min, max] = this.latency
    return Math.round(min + this.random() * (max - min))
  }

  private takeScheduled(operation: string): RepositoryErrorCode | undefined {
    const index = this.scheduled.findIndex(
      (f) => f.operation === undefined || f.operation === operation,
    )
    const failure = this.scheduled[index]
    if (!failure) return undefined
    failure.remaining -= 1
    if (failure.remaining <= 0) this.scheduled.splice(index, 1)
    return failure.code
  }

  /** Runs `handler` as if it were a remote call named `operation`. */
  async request<T>(
    operation: string,
    handler: () => T | Promise<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    await wait(this.delay(), options.signal)
    const scripted = this.takeScheduled(operation)
    if (scripted) throw new RepositoryError(scripted, FAILURE_MESSAGES[scripted])
    if (this.failureRate > 0 && this.random() < this.failureRate) {
      throw new RepositoryError('network', FAILURE_MESSAGES.network)
    }
    return handler()
  }
}

/** Dev: noticeable but short latency. Tests: instant. */
export function defaultBackendOptions(): MockBackendOptions {
  return import.meta.env.MODE === 'test' ? { latency: 0 } : { latency: [250, 700] }
}
