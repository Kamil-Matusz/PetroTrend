import type { Currency } from '../api/types'

const price2 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const index1 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const signed2 = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})
const signedPercent = new Intl.NumberFormat('pl-PL', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})
const day = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' })
const month = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' })
const monthShort = new Intl.DateTimeFormat('pl-PL', { month: 'short', year: '2-digit' })
const dayFull = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const dayNumeric = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
const stamp = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' })

export const formatPrice = (value: number) => price2.format(value)

export const formatMoney = (value: number, currency: Currency) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value)

export const formatIndex = (value: number) => index1.format(value)

export const formatSigned = (value: number) => signed2.format(value)

/** Takes a ratio, not percentage points: `0.034` renders as `+3,4 %`. */
export const formatSignedPercent = (ratio: number) => signedPercent.format(ratio)

export const formatDayShort = (iso: string) => day.format(parseIso(iso))
export const formatMonth = (iso: string) => month.format(parseIso(iso))
export const formatMonthShort = (iso: string) => monthShort.format(parseIso(iso))
export const formatDayLong = (iso: string) => dayFull.format(parseIso(iso))
export const formatDayNumeric = (iso: string) => dayNumeric.format(parseIso(iso))
export const formatStamp = (iso: string) => stamp.format(new Date(iso))

/** Parses `YYYY-MM-DD` as a local date so the day never shifts across time zones. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const todayIso = () => toIso(new Date())

export function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toIso(d)
}

export function monthStartIso(): string {
  const d = new Date()
  return toIso(new Date(d.getFullYear(), d.getMonth(), 1))
}
