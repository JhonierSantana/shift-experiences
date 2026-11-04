import { money } from '@/core/domain'
import {
  FREE_SHIPPING_FROM,
  checkoutSchema,
  contactSchema,
  deliveryFee,
  deliverySchema,
  toOrderInput,
  type CheckoutValues,
} from './checkout'

const valid: CheckoutValues = {
  email: 'ana@example.com',
  recipient: 'Ana Gómez',
  phone: '+57 300 123 4567',
  line1: 'Calle 79 #11-45',
  line2: '',
  city: 'Bogotá',
  region: 'Cundinamarca',
  postalCode: '',
  instructions: '',
  delivery: 'standard',
}

describe('checkout validation', () => {
  it('accepts a complete order with optional fields empty', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects bad email, phone and short required fields, naming each field', () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      email: 'nope',
      phone: 'abc',
      line1: 'x',
      city: '',
    })
    const fields = result.success ? [] : result.error.issues.map((i) => String(i.path[0]))
    expect(fields.sort()).toEqual(['city', 'email', 'line1', 'phone'])
  })

  it('validates postal code only when given', () => {
    expect(contactSchema.safeParse({ ...valid, postalCode: '110221' }).success).toBe(true)
    expect(contactSchema.safeParse({ ...valid, postalCode: '12' }).success).toBe(false)
  })

  it('requires a known delivery method', () => {
    expect(deliverySchema.safeParse({ delivery: 'drone' }).success).toBe(false)
    expect(deliverySchema.safeParse({ delivery: 'pickup' }).success).toBe(true)
  })
})

describe('delivery fees', () => {
  it('standard is free from the threshold; express is never free; pickup is free', () => {
    expect(deliveryFee('standard', money(FREE_SHIPPING_FROM - 1, 'COP')).amount).toBe(18_000)
    expect(deliveryFee('standard', money(FREE_SHIPPING_FROM, 'COP')).amount).toBe(0)
    expect(deliveryFee('express', money(5_000_000, 'COP')).amount).toBe(45_000)
    expect(deliveryFee('pickup', money(100, 'COP')).amount).toBe(0)
  })

  it('builds the order input with the delivery fee and no empty optionals', () => {
    const input = toOrderInput({ ...valid, delivery: 'express' }, [], money(100_000, 'COP'))
    expect(input.fees).toEqual([{ label: 'Envío express', amount: money(45_000, 'COP') }])
    expect(input.address).not.toHaveProperty('line2')
    expect(input.address.country).toBe('CO')
    expect(input.contactEmail).toBe('ana@example.com')
  })
})
