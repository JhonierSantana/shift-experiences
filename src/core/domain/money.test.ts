import {
  CurrencyMismatchError,
  add,
  compare,
  discountBy,
  formatMoney,
  fromMajor,
  isMoney,
  money,
  multiply,
  subtract,
  sum,
} from './money'

describe('money', () => {
  it('only accepts integer minor units', () => {
    expect(() => money(10.5, 'USD')).toThrow(RangeError)
    expect(() => multiply(money(100, 'USD'), 1.5)).toThrow(RangeError)
  })

  it('converts major amounts without float drift', () => {
    expect(fromMajor(1.005, 'USD')).toEqual(money(101, 'USD'))
    expect(fromMajor(0.1 + 0.2, 'USD')).toEqual(money(30, 'USD'))
    expect(fromMajor(-2.5, 'EUR')).toEqual(money(-250, 'EUR'))
    expect(fromMajor(189_900, 'COP')).toEqual(money(189_900, 'COP'))
  })

  it('adds, subtracts, multiplies and sums exactly', () => {
    const a = fromMajor(0.1, 'USD')
    const b = fromMajor(0.2, 'USD')
    expect(add(a, b)).toEqual(money(30, 'USD'))
    expect(subtract(b, a)).toEqual(money(10, 'USD'))
    expect(multiply(money(1999, 'USD'), 3)).toEqual(money(5997, 'USD'))
    expect(sum([], 'COP')).toEqual(money(0, 'COP'))
    expect(sum([a, b, a], 'USD')).toEqual(money(40, 'USD'))
  })

  it('refuses to mix currencies', () => {
    expect(() => add(money(1, 'USD'), money(1, 'EUR'))).toThrow(CurrencyMismatchError)
    expect(() => compare(money(1, 'USD'), money(1, 'COP'))).toThrow(CurrencyMismatchError)
    expect(() => sum([money(1, 'USD')], 'EUR')).toThrow(CurrencyMismatchError)
  })

  it('rounds the discount to the minor unit, half up', () => {
    expect(discountBy(money(459_900, 'COP'), 25)).toEqual(money(344_925, 'COP'))
    expect(discountBy(money(999, 'USD'), 15)).toEqual(money(849, 'USD')) // 149.85 off -> 150
    expect(discountBy(money(1000, 'USD'), 0)).toEqual(money(1000, 'USD'))
    expect(() => discountBy(money(1000, 'USD'), 120)).toThrow(RangeError)
  })

  it('formats per currency exponent', () => {
    const normalize = (s: string) => s.replace(/\s/g, ' ')
    expect(normalize(formatMoney(money(1_290_000, 'COP')))).toBe('$ 1.290.000')
    expect(normalize(formatMoney(money(123_456, 'USD'), 'en-US'))).toBe('$1,234.56')
  })

  it('recognizes well-formed money only', () => {
    expect(isMoney(money(1, 'COP'))).toBe(true)
    expect(isMoney({ amount: 1.2, currency: 'COP' })).toBe(false)
    expect(isMoney({ amount: 1, currency: 'XXX' })).toBe(false)
    expect(isMoney(null)).toBe(false)
  })
})
