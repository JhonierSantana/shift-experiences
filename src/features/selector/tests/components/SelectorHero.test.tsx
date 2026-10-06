import { render, screen } from '@testing-library/react'
import { LazyMotion, domAnimation } from 'motion/react'
import type { ExperienceManifest } from '@/engine'
import { SelectorHero } from '../../components'

const experiences: readonly ExperienceManifest[] = [
  { id: 'fashion', name: 'Maison Vela', sector: 'Moda', tagline: 'Silencio, textura y forma.' },
  { id: 'food', name: 'Brasa & Co.', sector: 'Comida', tagline: 'Fuego lento, sabor rápido.' },
  { id: 'market', name: 'Plaza', sector: 'Marketplace', tagline: 'Todo, a un clic.' },
]

describe('SelectorHero', () => {
  it('names the page SHIFT and shows the word of the brand in the spotlight', () => {
    render(
      <LazyMotion features={domAnimation} strict>
        <SelectorHero experiences={experiences} litId="food" reduced={false} />
      </LazyMotion>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'SHIFT' })).toBeInTheDocument()
    expect(screen.getByText('comida.', { selector: 'span:not([aria-hidden])' })).toBeInTheDocument()
  })
})
