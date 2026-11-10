import { CartPanel } from '../components/CartPanel'
import { Modal } from '../components/Modal'
import { useCartDrawer } from './drawerState'

export function CartDrawer() {
  const open = useCartDrawer((s) => s.open)
  const hide = useCartDrawer((s) => s.hide)
  return (
    <Modal open={open} onClose={hide} label="Tu bolsa" placement="right">
      <CartPanel onNavigate={hide} onClose={hide} />
    </Modal>
  )
}
