import { FADE_KEYFRAMES, runSwitchTransition, type TransitionEnvironment } from './transition'
import type { SwitchTransitionSpec } from './types'

const brandKeyframes: Keyframe[] = [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0)' }]

function setup(options: { viewTransitions: boolean; reducedMotion: boolean }) {
  const root = document.createElement('div')
  const animate = vi.fn()
  root.animate = animate
  const enter = vi.fn(() => brandKeyframes)
  const spec: SwitchTransitionSpec = { duration: 900, easing: 'ease', enter }
  const update = vi.fn(() => Promise.resolve())
  const startViewTransition = vi.fn((cb: () => Promise<void>) => {
    const done = cb()
    return { updateCallbackDone: done, ready: done, finished: done }
  })
  const env: TransitionEnvironment = {
    root,
    startViewTransition: options.viewTransitions ? startViewTransition : null,
    prefersReducedMotion: options.reducedMotion,
    viewport: { width: 1000, height: 800 },
  }
  return { env, spec, update, animate, enter, startViewTransition }
}

describe('runSwitchTransition', () => {
  it('plays the brand choreography inside a view transition', async () => {
    const t = setup({ viewTransitions: true, reducedMotion: false })
    await expect(runSwitchTransition(t.update, t.spec, { x: 10, y: 20 }, t.env)).resolves.toBe(
      'view-transition',
    )
    expect(t.update).toHaveBeenCalledOnce()
    expect(t.enter).toHaveBeenCalledWith({ x: 10, y: 20 }, t.env.viewport)
    expect(t.animate).toHaveBeenCalledWith(
      brandKeyframes,
      expect.objectContaining({ duration: 900, pseudoElement: '::view-transition-new(root)' }),
    )
  })

  it('falls back to a short cross-fade under prefers-reduced-motion', async () => {
    const t = setup({ viewTransitions: true, reducedMotion: true })
    await expect(runSwitchTransition(t.update, t.spec, null, t.env)).resolves.toBe('reduced-motion')
    expect(t.update).toHaveBeenCalledOnce()
    expect(t.enter).not.toHaveBeenCalled()
    expect(t.animate).toHaveBeenCalledTimes(1)
    expect(t.animate).toHaveBeenCalledWith(
      FADE_KEYFRAMES,
      expect.objectContaining({ pseudoElement: '::view-transition-new(root)' }),
    )
  })

  it('updates then fades the document when View Transitions are unsupported', async () => {
    const t = setup({ viewTransitions: false, reducedMotion: false })
    await expect(runSwitchTransition(t.update, t.spec, null, t.env)).resolves.toBe('fallback-fade')
    expect(t.update).toHaveBeenCalledOnce()
    expect(t.enter).not.toHaveBeenCalled()
    expect(t.animate).toHaveBeenCalledWith(
      FADE_KEYFRAMES,
      expect.objectContaining({ duration: 450 }),
    )
  })

  it('propagates update failures so the caller can recover', async () => {
    const t = setup({ viewTransitions: true, reducedMotion: false })
    const failing = vi.fn(() => Promise.reject(new Error('chunk failed')))
    await expect(runSwitchTransition(failing, t.spec, null, t.env)).rejects.toThrow('chunk failed')
    expect(t.animate).not.toHaveBeenCalled()
  })
})
