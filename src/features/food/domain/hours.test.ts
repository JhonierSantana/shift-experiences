import { nextSlots, openStatus } from './hours'
import { stageIndexAt, trackingStages } from './tracking'

// 2026-09-24 is a Thursday (11:00-22:00); 2026-09-25 a Friday (until 23:30).
const thursday = (h: number, m = 0) => new Date(2026, 8, 24, h, m)

describe('opening hours', () => {
  it('is open inside the window and says when it closes', () => {
    expect(openStatus(thursday(12))).toEqual({ open: true, closesAt: '22:00' })
  })

  it('is closed before opening (today) and after closing (tomorrow)', () => {
    expect(openStatus(thursday(9))).toEqual({ open: false, opensAt: '11:00', opensTomorrow: false })
    expect(openStatus(thursday(22, 30))).toEqual({
      open: false,
      opensAt: '11:00',
      opensTomorrow: true,
    })
  })

  it('offers half-hour slots after the lead time, never past the last slot before closing', () => {
    const slots = nextSlots(thursday(20, 40), 4)
    expect(slots.map((s) => s.label)).toEqual([
      'Hoy, 21:30',
      'Mañana, 11:00',
      'Mañana, 11:30',
      'Mañana, 12:00',
    ])
  })
})

describe('order tracking', () => {
  it('advances by elapsed time and never past the last stage', () => {
    const count = trackingStages('delivery').length
    expect(stageIndexAt(0, count)).toBe(0)
    expect(stageIndexAt(7_000, count)).toBe(1)
    expect(stageIndexAt(20_000, count)).toBe(2)
    expect(stageIndexAt(10 * 60_000, count)).toBe(count - 1)
  })

  it('pickup ends at "ready" and has no on-the-way stage', () => {
    const stages = trackingStages('pickup')
    expect(stages.map((s) => s.id)).toEqual(['received', 'preparing', 'ready'])
    expect(stageIndexAt(10 * 60_000, stages.length)).toBe(2)
  })
})
