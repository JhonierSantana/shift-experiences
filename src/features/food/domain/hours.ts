/** Opening hours are mock data owned by the experience; times are local to the browser. */
interface DayHours {
  /** Minutes from midnight. */
  readonly open: number
  readonly close: number
}

const at = (h: number, m = 0) => h * 60 + m

/** Indexed by Date#getDay(): 0 = Sunday. */
const WEEK: readonly DayHours[] = [
  { open: at(12), close: at(21) },
  { open: at(11), close: at(22) },
  { open: at(11), close: at(22) },
  { open: at(11), close: at(22) },
  { open: at(11), close: at(22) },
  { open: at(11), close: at(23, 30) },
  { open: at(11), close: at(23, 30) },
]

const SLOT_MINUTES = 30

export function formatMinutes(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

function hoursOf(date: Date): DayHours {
  // WEEK always has 7 entries; the fallback only satisfies noUncheckedIndexedAccess.
  return WEEK[date.getDay()] ?? { open: at(11), close: at(22) }
}

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export type OpenStatus =
  | { readonly open: true; readonly closesAt: string }
  | { readonly open: false; readonly opensAt: string; readonly opensTomorrow: boolean }

export function openStatus(now: Date): OpenStatus {
  const today = hoursOf(now)
  const minutes = minutesOf(now)
  if (minutes >= today.open && minutes < today.close) {
    return { open: true, closesAt: formatMinutes(today.close) }
  }
  if (minutes < today.open) {
    return { open: false, opensAt: formatMinutes(today.open), opensTomorrow: false }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { open: false, opensAt: formatMinutes(hoursOf(tomorrow).open), opensTomorrow: true }
}

export interface TimeSlot {
  /** ISO timestamp of the requested time. */
  readonly value: string
  readonly label: string
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/** Upcoming half-hour slots inside opening hours, starting `leadMinutes` from now. */
export function nextSlots(now: Date, count = 6, leadMinutes = 30): TimeSlot[] {
  const cursor = new Date(now.getTime() + leadMinutes * 60_000)
  cursor.setSeconds(0, 0)
  cursor.setMinutes(Math.ceil(cursor.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES)

  const slots: TimeSlot[] = []
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  // Three days of half-hours is far more than needed to find `count` slots.
  for (let i = 0; i < 3 * 48 && slots.length < count; i += 1) {
    const { open, close } = hoursOf(cursor)
    const minutes = minutesOf(cursor)
    if (minutes >= open && minutes <= close - SLOT_MINUTES) {
      const day = sameDay(cursor, now) ? 'Hoy' : sameDay(cursor, tomorrow) ? 'Mañana' : 'Pronto'
      slots.push({ value: cursor.toISOString(), label: `${day}, ${formatMinutes(minutes)}` })
    }
    cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES)
  }
  return slots
}
