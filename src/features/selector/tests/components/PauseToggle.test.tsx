import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseToggle } from '../../components'

describe('PauseToggle', () => {
  it('is a button named after what it does and calls onToggle (WCAG 2.2.2)', async () => {
    const onToggle = vi.fn()
    render(<PauseToggle stopped={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pausar animación' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('changes its name when the animation is stopped', () => {
    render(<PauseToggle stopped onToggle={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Reanudar animación' })).toBeInTheDocument()
  })
})
