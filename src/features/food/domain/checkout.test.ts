import { checkoutSchema, ASAP, type CheckoutValues } from './checkout'

const valid: CheckoutValues = {
  mode: 'delivery',
  recipient: 'Ana Pérez',
  phone: '300 123 4567',
  email: 'ana@example.com',
  line1: 'Calle 85 #14-20',
  line2: '',
  city: 'Bogotá',
  instructions: '',
  slot: ASAP,
  payment: 'card',
}

const issuePaths = (values: unknown) => {
  const result = checkoutSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('food checkout schema', () => {
  it('accepts a complete delivery order', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('requires an address only for delivery', () => {
    const noAddress = { ...valid, line1: '', city: '' }
    expect(issuePaths(noAddress)).toEqual(expect.arrayContaining(['line1', 'city']))
    expect(issuePaths({ ...noAddress, mode: 'pickup' })).toEqual([])
  })

  it('validates contact, time and payment', () => {
    expect(
      issuePaths({
        ...valid,
        recipient: '',
        phone: 'abc',
        email: 'x',
        slot: '',
        payment: 'barter',
      }),
    ).toEqual(expect.arrayContaining(['recipient', 'phone', 'email', 'slot', 'payment']))
  })
})
