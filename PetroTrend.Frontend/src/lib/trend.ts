import type { FuelPriceResponse, FuelSymbol } from '../api/types'
import { FUEL_SYMBOLS } from '../api/types'
import { parseIso, toIso } from './format'

/** `level` reads absolute prices; the other three read a derivative of them. */
export type TrendMode = 'level' | 'index' | 'spread' | 'change'

export const MODE_LABELS: Record<TrendMode, string> = {
  level: 'Poziom',
  index: 'Indeks',
  spread: 'Spread',
  change: 'Zmiana',
}

export type Pair = { key: string; a: FuelSymbol; b: FuelSymbol }

/** Curated pairs only - every combination would be noise, these are the ones worth watching. */
export const SPREAD_PAIRS: readonly Pair[] = [
  { key: 'ON-PB95', a: 'ON', b: 'PB95' },
  { key: 'PB98-PB95', a: 'PB98', b: 'PB95' },
  { key: 'ON-LPG', a: 'ON', b: 'LPG' },
  { key: 'PB95-LPG', a: 'PB95', b: 'LPG' },
]

export const pairLabel = (pair: Pair) => `${pair.a} - ${pair.b}`

/** One chart row per date: a column per fuel symbol, or the single `spread` column. */
export type TrendRow = { date: string; spread?: number } & Partial<Record<FuelSymbol, number>>

/** Flat readings pivoted to one row per date, plus what the window actually contains. */
export function pivotLevels(rows: FuelPriceResponse[]): {
  levels: TrendRow[]
  present: FuelSymbol[]
  monthly: boolean
} {
  const byDate = new Map<string, TrendRow>()
  const seen = new Set<FuelSymbol>()

  for (const row of rows) {
    const bucket = byDate.get(row.date) ?? { date: row.date }
    bucket[row.fuelSymbol] = row.price
    byDate.set(row.date, bucket)
    seen.add(row.fuelSymbol)
  }

  const levels = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  const first = levels.at(0)?.date
  const last = levels.at(-1)?.date
  const span =
    first && last ? (parseIso(last).getTime() - parseIso(first).getTime()) / 86_400_000 : 0

  return {
    levels,
    present: FUEL_SYMBOLS.filter((symbol) => seen.has(symbol)),
    // Weekly buckets read well up to a quarter; past that the bars get too thin to compare.
    monthly: span > 120,
  }
}

/** Rebases every series to 100 at its own first reading, so grades on different levels compare. */
export function toIndexed(levels: TrendRow[], present: readonly FuelSymbol[]): TrendRow[] {
  const base: Partial<Record<FuelSymbol, number>> = {}

  for (const row of levels) {
    for (const symbol of present) {
      const value = row[symbol]
      if (value != null && value > 0 && base[symbol] == null) base[symbol] = value
    }
  }

  return levels.map((row) => {
    const out: TrendRow = { date: row.date }
    for (const symbol of present) {
      const value = row[symbol]
      const start = base[symbol]
      if (value != null && start != null) out[symbol] = (value / start) * 100
    }
    return out
  })
}

/** Legs aren't always quoted on the same day, so each one carries its last known price forward. */
export function toSpread(levels: TrendRow[], pair: Pair): TrendRow[] {
  const out: TrendRow[] = []
  let a: number | undefined
  let b: number | undefined

  for (const row of levels) {
    a = row[pair.a] ?? a
    b = row[pair.b] ?? b
    if (a != null && b != null) out.push({ date: row.date, spread: a - b })
  }

  return out
}

export function bucketStart(iso: string, monthly: boolean): string {
  if (monthly) return `${iso.slice(0, 7)}-01`

  const date = parseIso(iso)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7)) // back to Monday
  return toIso(date)
}

/**
 * Period-over-period change: each bucket's closing price against the previous bucket that actually
 * had one, so a gap in the series bridges instead of dropping a bar.
 */
export function toChange(
  levels: TrendRow[],
  present: readonly FuelSymbol[],
  monthly: boolean,
): TrendRow[] {
  const buckets = new Map<string, Partial<Record<FuelSymbol, number>>>()

  for (const row of levels) {
    const key = bucketStart(row.date, monthly)
    const bucket = buckets.get(key) ?? {}
    // `levels` is sorted, so the last write per bucket is that bucket's close.
    for (const symbol of present) if (row[symbol] != null) bucket[symbol] = row[symbol]
    buckets.set(key, bucket)
  }

  const previous: Partial<Record<FuelSymbol, number>> = {}
  const out: TrendRow[] = []

  for (const [key, bucket] of [...buckets].sort((x, y) => x[0].localeCompare(y[0]))) {
    const delta: TrendRow = { date: key }
    let filled = false

    for (const symbol of present) {
      const close = bucket[symbol]
      const before = previous[symbol]
      if (close != null && before != null) {
        delta[symbol] = close - before
        filled = true
      }
      if (close != null) previous[symbol] = close
    }

    if (filled) out.push(delta)
  }

  return out
}