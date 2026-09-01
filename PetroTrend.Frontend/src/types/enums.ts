export const FuelSymbol = {
  ON: 'ON',
  PB95: 'PB95',
  PB98: 'PB98',
  LPG: 'LPG',
} as const

export type FuelSymbol = (typeof FuelSymbol)[keyof typeof FuelSymbol]

export const FUEL_SYMBOL_LABELS: Record<FuelSymbol, string> = {
  ON: 'Diesel',
  PB95: 'Petrol 95',
  PB98: 'Petrol 98',
  LPG: 'Autogas',
}

export const Currency = {
  PLN: 'PLN',
  USD: 'USD',
  EUR: 'EUR',
} as const

export type Currency = (typeof Currency)[keyof typeof Currency]
