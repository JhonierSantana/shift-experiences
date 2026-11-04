import { renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { usePointerGlow } from '../../hooks'

function pointerAt(x: number, y: number) {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ left: 100, top: 40 }) as DOMRect
  const event = {
    currentTarget: element,
    clientX: x,
    clientY: y,
  } as unknown as PointerEvent<HTMLElement>
  return { element, event }
}

describe('usePointerGlow', () => {
  it('writes the pointer position, relative to the element, as CSS variables', () => {
    const { result } = renderHook(() => usePointerGlow(true))
    const { element, event } = pointerAt(160, 90)
    result.current(event)
    expect(element.style.getPropertyValue('--mx')).toBe('60px')
    expect(element.style.getPropertyValue('--my')).toBe('50px')
  })

  it('leaves the light where CSS puts it when disabled (reduced motion)', () => {
    const { result } = renderHook(() => usePointerGlow(false))
    const { element, event } = pointerAt(160, 90)
    result.current(event)
    expect(element.style.getPropertyValue('--mx')).toBe('')
    expect(element.style.getPropertyValue('--my')).toBe('')
  })
})
