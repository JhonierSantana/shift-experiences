import { z } from 'zod'
import { money, type CartLineOf, type Money, type PlaceOrderInput } from '@/core/domain'

export const DELIVERY_METHODS = [
  { id: 'standard', label: 'Envío estándar', eta: '3 a 5 días hábiles', fee: 18_000 },
  { id: 'express', label: 'Envío express', eta: 'Al siguiente día hábil', fee: 45_000 },
  {
    id: 'pickup',
    label: 'Recoger en boutique',
    eta: 'Calle 79 #11-45, Bogotá · listo en 24 h',
    fee: 0,
  },
] as const

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]['id']

/** Standard shipping is free from this subtotal (pesos). */
export const FREE_SHIPPING_FROM = 800_000

export const contactSchema = z.object({
  email: z.email('Escribe un correo válido.'),
  recipient: z.string().trim().min(2, 'Escribe el nombre de quien recibe.').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,16}$/, 'Escribe un teléfono válido, solo números.'),
  line1: z.string().trim().min(5, 'Escribe la dirección de envío.').max(120),
  line2: z.string().trim().max(120),
  city: z.string().trim().min(2, 'Escribe la ciudad.').max(60),
  region: z.string().trim().min(2, 'Escribe el departamento.').max(60),
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{4,8})?$/, 'El código postal tiene entre 4 y 8 números.'),
  instructions: z.string().trim().max(240),
})

export const deliverySchema = z.object({
  delivery: z.enum(['standard', 'express', 'pickup'], 'Elige cómo quieres recibir tu pedido.'),
})

export const checkoutSchema = contactSchema.extend(deliverySchema.shape)

export type CheckoutValues = z.infer<typeof checkoutSchema>
export type CheckoutField = keyof CheckoutValues

/** Field names per step, used to validate one step at a time. */
export const STEP_FIELDS = {
  contact: Object.keys(contactSchema.shape) as CheckoutField[],
  delivery: ['delivery'] as CheckoutField[],
}

export function deliveryFee(method: DeliveryMethodId, subtotal: Money): Money {
  if (method === 'standard' && subtotal.amount >= FREE_SHIPPING_FROM) return money(0, 'COP')
  const found = DELIVERY_METHODS.find((m) => m.id === method)
  return money(found?.fee ?? 0, 'COP')
}

export function deliveryLabel(method: DeliveryMethodId): string {
  return DELIVERY_METHODS.find((m) => m.id === method)?.label ?? method
}

export function toOrderInput(
  values: CheckoutValues,
  lines: readonly CartLineOf<'fashion'>[],
  subtotal: Money,
): PlaceOrderInput<'fashion'> {
  return {
    lines,
    contactEmail: values.email,
    address: {
      id: 'checkout',
      label: values.delivery === 'pickup' ? 'Facturación' : 'Envío',
      recipient: values.recipient,
      line1: values.line1,
      ...(values.line2 ? { line2: values.line2 } : {}),
      city: values.city,
      region: values.region,
      ...(values.postalCode ? { postalCode: values.postalCode } : {}),
      country: 'CO',
      phone: values.phone,
      ...(values.instructions ? { instructions: values.instructions } : {}),
    },
    fees: [
      { label: deliveryLabel(values.delivery), amount: deliveryFee(values.delivery, subtotal) },
    ],
  }
}
