import { z } from 'zod'
import type { CartLineOf, PlaceOrderInput } from '@/core/domain'
import { PICKUP_ADDRESS, type FulfillmentMode, type Quote } from './pricing'

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta al recibir', hint: 'Llevamos el datáfono.' },
  { id: 'cash', label: 'Efectivo', hint: 'Paga con billete o cambio exacto.' },
  { id: 'wallet', label: 'Billetera digital', hint: 'Te enviamos un link de pago.' },
] as const

export type PaymentId = (typeof PAYMENT_METHODS)[number]['id']

export const ASAP = 'asap'

const text = (min: number, message: string, max = 120) =>
  z.string().trim().min(min, message).max(max)

/** One schema for both modes: delivery needs an address, pickup does not. `mode` is set from the order preferences. */
export const checkoutSchema = z
  .object({
    mode: z.enum(['delivery', 'pickup']),
    recipient: text(2, 'Escribe tu nombre.', 80),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{7,16}$/, 'Escribe un teléfono válido, solo números.'),
    email: z.email('Escribe un correo válido.'),
    line1: z.string().trim().max(120),
    line2: z.string().trim().max(120),
    city: z.string().trim().max(60),
    instructions: z.string().trim().max(240),
    slot: z.string().min(1, 'Elige cuándo lo quieres.'),
    payment: z.enum(['card', 'cash', 'wallet'], 'Elige cómo vas a pagar.'),
  })
  .superRefine((values, ctx) => {
    if (values.mode !== 'delivery') return
    if (values.line1.length < 5) {
      ctx.addIssue({ code: 'custom', path: ['line1'], message: 'Escribe la dirección de entrega.' })
    }
    if (values.city.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['city'], message: 'Escribe la ciudad.' })
    }
  })

export type CheckoutValues = z.infer<typeof checkoutSchema>

export function toOrderInput(
  values: CheckoutValues,
  lines: readonly CartLineOf<'food'>[],
  quote: Quote,
  slotLabel: string,
): PlaceOrderInput<'food'> {
  const delivery = values.mode === 'delivery'
  const payment = PAYMENT_METHODS.find((m) => m.id === values.payment)?.label ?? values.payment
  const when = values.slot === ASAP ? 'lo antes posible' : slotLabel.toLowerCase()
  return {
    lines,
    contactEmail: values.email,
    address: {
      id: 'checkout',
      label: delivery ? 'Entrega' : 'Recogida',
      recipient: values.recipient,
      line1: delivery ? values.line1 : PICKUP_ADDRESS,
      ...(delivery && values.line2 ? { line2: values.line2 } : {}),
      city: delivery ? values.city : 'Bogotá',
      region: 'Bogotá D.C.',
      country: 'CO',
      phone: values.phone,
      ...(delivery && values.instructions ? { instructions: values.instructions } : {}),
    },
    fees: quote.fees,
    notes: `${delivery ? 'Domicilio' : 'Recogida'} ${when}. Pago: ${payment}.`,
  }
}

export function modeOfOrder(address: { readonly label: string }): FulfillmentMode {
  return address.label === 'Recogida' ? 'pickup' : 'delivery'
}
