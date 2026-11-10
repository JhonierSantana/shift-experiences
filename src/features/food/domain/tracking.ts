import type { FulfillmentMode } from './pricing'

export interface TrackingStage {
  readonly id: 'received' | 'preparing' | 'on-the-way' | 'ready' | 'delivered'
  readonly label: string
  readonly detail: string
}

const RECEIVED: TrackingStage = {
  id: 'received',
  label: 'Pedido recibido',
  detail: 'La cocina ya tiene tu pedido.',
}
const PREPARING: TrackingStage = {
  id: 'preparing',
  label: 'En la brasa',
  detail: 'Estamos preparando todo al momento.',
}

export function trackingStages(mode: FulfillmentMode): readonly TrackingStage[] {
  return mode === 'delivery'
    ? [
        RECEIVED,
        PREPARING,
        { id: 'on-the-way', label: 'En camino', detail: 'Tu repartidor va hacia tu puerta.' },
        { id: 'delivered', label: 'Entregado', detail: '¡Buen provecho!' },
      ]
    : [
        RECEIVED,
        PREPARING,
        { id: 'ready', label: 'Listo para recoger', detail: 'Te esperamos en el mostrador.' },
      ]
}

/**
 * Demo timer, deliberately accelerated (seconds instead of minutes): each entry is
 * the elapsed ms at which the stage at that index becomes current.
 */
export const STAGE_STARTS_MS: readonly number[] = [0, 6_000, 16_000, 32_000]

export function stageIndexAt(elapsedMs: number, stageCount: number): number {
  let index = 0
  STAGE_STARTS_MS.forEach((start, i) => {
    if (elapsedMs >= start && i < stageCount) index = i
  })
  return index
}
