import { CartPanel } from '../components/CartPanel'
import { Modal } from '../components/Modal'
import { useCartDrawer } from './uiState'

export function CartDrawer() {
  const open = useCartDrawer((s) => s.open)
  const hide = useCartDrawer((s) => s.hide)
  return (
    <Modal open={open} onClose={hide} label="Tu carrito" placement="right">
      <CartPanel onClose={hide} />
    </Modal>
  )
}
