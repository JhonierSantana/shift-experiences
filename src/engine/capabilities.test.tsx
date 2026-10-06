import { render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { testAdapter } from '@/test/factories'
import { Capability, useCapability } from './capabilities'
import { ExperienceProvider } from './ExperienceProvider'
import type { CapabilityName, ExperienceDefinition } from './types'

function definitionWith(capabilities: CapabilityName[]): ExperienceDefinition {
  return {
    id: 'market',
    brand: { name: 'Test', sector: 'Test', tagline: '', Logo: () => null },
    theme: { themeColor: '#ffffff' },
    fonts: [],
    capabilities: new Set(capabilities),
    shell: ({ children }) => children,
    slots: {},
    routes: [],
    motion: { switchIn: { duration: 1, easing: 'linear', enter: () => [] } },
    domain: testAdapter,
  }
}

function withExperience(definition: ExperienceDefinition) {
  return ({ children }: { children: ReactNode }) => (
    <ExperienceProvider definition={definition}>{children}</ExperienceProvider>
  )
}

describe('capabilities', () => {
  it('reflects the active experience capability set', () => {
    const wrapper = withExperience(definitionWith(['compare']))
    expect(renderHook(() => useCapability('compare'), { wrapper }).result.current).toBe(true)
    expect(renderHook(() => useCapability('sizeGuide'), { wrapper }).result.current).toBe(false)
  })

  it('is disabled outside any experience', () => {
    expect(renderHook(() => useCapability('compare')).result.current).toBe(false)
  })

  it('gates children and renders the fallback when missing', () => {
    render(
      <ExperienceProvider definition={definitionWith(['reviews'])}>
        <Capability name="reviews">
          <p>reviews-on</p>
        </Capability>
        <Capability name="compare" fallback={<p>compare-off</p>}>
          <p>compare-on</p>
        </Capability>
      </ExperienceProvider>,
    )
    expect(screen.getByText('reviews-on')).toBeInTheDocument()
    expect(screen.getByText('compare-off')).toBeInTheDocument()
    expect(screen.queryByText('compare-on')).not.toBeInTheDocument()
  })

  it('provider applies the experience scope to <html>', () => {
    render(<ExperienceProvider definition={definitionWith([])}>x</ExperienceProvider>)
    expect(document.documentElement.dataset.experience).toBe('market')
  })
})
