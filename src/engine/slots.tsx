import { createElement, type ComponentType } from 'react'
import { formatMoney } from '@/core/domain'
import { useOptionalExperience } from './context'
import type { SlotMap, SlotName, SlotPropsMap } from './types'

function DefaultNotFound() {
  return (
    <section className="mx-auto grid max-w-xl gap-4 px-gutter py-section text-center">
      <h1 className="font-display text-4xl">Página no encontrada</h1>
      <p className="text-ink-muted">Esta sección todavía no existe en esta experiencia.</p>
    </section>
  )
}

function DefaultProductCard({ product }: SlotPropsMap['ProductCard']) {
  return (
    <article className="grid gap-1">
      <h3 className="font-display text-xl">{product.title}</h3>
      <p className="text-ink-muted">{formatMoney(product.price)}</p>
    </article>
  )
}

const defaults: SlotMap = {
  NotFound: DefaultNotFound,
  ProductCard: DefaultProductCard,
}

/** Resolves a slot to the active experience's component, falling back to the engine default. */
export function useSlot<K extends SlotName>(name: K): ComponentType<SlotPropsMap[K]> {
  const definition = useOptionalExperience()
  return definition?.slots[name] ?? defaults[name]
}

type SlotProps<K extends SlotName> = { readonly name: K } & SlotPropsMap[K]

export function Slot<K extends SlotName>({ name, ...props }: SlotProps<K>) {
  const Component = useSlot(name)
  // Rest of a generic intersection is not narrowed by TS; it is exactly SlotPropsMap[K].
  return createElement(Component, props as unknown as SlotPropsMap[K])
}
