import { render, screen } from '@testing-library/react'
import { LazyMotion, domAnimation } from 'motion/react'
import { SelectorHeader } from '../../components'

function renderHeader(reduced: boolean) {
  return render(
    <LazyMotion features={domAnimation} strict>
      <SelectorHeader reduced={reduced} stopped={false} onToggleStopped={() => undefined} />
    </LazyMotion>,
  )
}

describe('SelectorHeader', () => {
  it('names the page SHIFT and says what it is in one line', () => {
    renderHeader(false)
    expect(screen.getByRole('heading', { level: 1, name: 'SHIFT' })).toBeInTheDocument()
    expect(screen.getByText('Una sola app, tres negocios.')).toBeInTheDocument()
  })

  it('offers the pause control, except when nothing moves (reduced motion)', () => {
    const { unmount } = renderHeader(false)
    expect(screen.getByRole('button', { name: 'Pausar animación' })).toBeInTheDocument()
    unmount()
    renderHeader(true)
    expect(screen.queryByRole('button', { name: /animación/ })).not.toBeInTheDocument()
  })
})
