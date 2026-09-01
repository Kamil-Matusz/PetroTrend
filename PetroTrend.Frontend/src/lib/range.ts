import { daysAgoIso, monthStartIso, todayIso } from './format'

export type RangeKey = '30d' | '90d' | '365d' | 'month'

export const RANGE_LABELS: Record<RangeKey, string> = {
  '30d': '30 dni',
  '90d': '90 dni',
  '365d': 'Rok',
  month: 'Ten miesiąc',
}

export function rangeToDates(key: RangeKey): { from: string; to: string } {
  const to = todayIso()
  if (key === 'month') return { from: monthStartIso(), to }

  const days = key === '30d' ? 30 : key === '90d' ? 90 : 365
  return { from: daysAgoIso(days), to }
}
