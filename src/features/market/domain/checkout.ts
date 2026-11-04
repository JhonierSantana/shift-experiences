import { z } from 'zod'
import { money, type CartLineOf, type Money, type PlaceOrderInput } from '@/core/domain'

export const DELIVERY_METHODS = [
  { id: 'standard', label: 'Envío estándar', eta: 'Llega en 2 a 4 días hábiles', fee: 9_900 },
  { id: 'express', label: 'Envío express', eta: 'Llega hoy en Bogotá o mañana', fee: 19_900 },
  {
    id: 'pickup',
    label: 'Recoger en un Punto Plaza',
    eta: 'Cra. 13 #85-32, Bogotá · listo en 3 h',
    fee: 0,
  },
] as const

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]['id']

/** Standard shipping is free from this subtotal (pesos), matching the header promo. */
export const FREE_SHIPPING_FROM = 150_000

/** Free standard shipping: big enough basket, or every product ships free. */
export function qualifiesForFreeShipping(
  lines: readonly CartLineOf<'market'>[],
  subtotal: Money,
): boolean {
  return (
    subtotal.amount >= FREE_SHIPPING_FROM ||
    (lines.length > 0 && lines.every((l) => l.product.freeShipping))
  )
}

export function deliveryFee(method: DeliveryMethodId, freeStandard: boolean): Money {
  if (method === 'standard' && freeStandard) return money(0, 'COP')
  const found = DELIVERY_METHODS.find((m) => m.id === method)
  return money(found?.fee ?? 0, 'COP')
}

export function deliveryLabel(method: DeliveryMethodId): string {
  return DELIVERY_METHODS.find((m) => m.id === method)?.label ?? method
}

export const checkoutSchema = z.object({
  email: z.email('Escribe un correo válido.'),
  recipient: z.string().trim().min(2, 'Escribe el nombre de quien recibe.').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,16}$/, 'Escribe un teléfono válido, solo números.'),
  line1: z.string().trim().min(5, 'Escribe la dirección de entrega.').max(120),
  line2: z.string().trim().max(120),
  city: z.string().trim().min(2, 'Escribe la ciudad.').max(60),
  region: z.string().trim().min(2, 'Escribe el departamento.').max(60),
  delivery: z.enum(['standard', 'express', 'pickup'], 'Elige cómo quieres recibir tu pedido.'),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
export type CheckoutField = keyof CheckoutValues

export function toOrderInput(
  values: CheckoutValues,
  lines: readonly CartLineOf<'market'>[],
  freeStandard: boolean,
): PlaceOrderInput<'market'> {
  return {
    lines,
    contactEmail: values.email,
    address: {
      id: 'checkout',
      label: values.delivery === 'pickup' ? 'Facturación' : 'Entrega',
      recipient: values.recipient,
      line1: values.line1,
      ...(values.line2 ? { line2: values.line2 } : {}),
      city: values.city,
      region: values.region,
      country: 'CO',
      phone: values.phone,
    },
    fees: [
      { label: deliveryLabel(values.delivery), amount: deliveryFee(values.delivery, freeStandard) },
    ],
  }
}
