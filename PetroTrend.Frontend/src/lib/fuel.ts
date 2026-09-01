import type { FuelSymbol } from '../api/types'

/** Marker shapes follow EN 16942 pump labelling: petrol circle, diesel square, gaseous diamond. */
export type MarkerShape = 'square' | 'circle' | 'diamond'

type FuelMeta = {
  symbol: FuelSymbol
  name: string
  color: string
  shape: MarkerShape
}

export const FUEL_META: Record<FuelSymbol, FuelMeta> = {
  ON: { symbol: 'ON', name: 'Olej napędowy', color: '#D08000', shape: 'square' },
  PB95: { symbol: 'PB95', name: 'Benzyna 95', color: '#2FAE63', shape: 'circle' },
  PB98: { symbol: 'PB98', name: 'Benzyna 98', color: '#D83A45', shape: 'circle' },
  LPG: { symbol: 'LPG', name: 'Autogaz', color: '#4A90F0', shape: 'diamond' },
}

export const CURRENCY_SUFFIX: Record<string, string> = {
  PLN: 'zł/l',
  USD: '$/l',
  EUR: '€/l',
}
