export const FUEL_SYMBOLS = ['ON', 'PB95', 'PB98', 'LPG'] as const
export const CURRENCIES = ['PLN', 'USD', 'EUR'] as const

export type FuelSymbol = (typeof FUEL_SYMBOLS)[number]
export type Currency = (typeof CURRENCIES)[number]

export type FuelPriceResponse = {
  id: string
  fuelSymbol: FuelSymbol
  currency: Currency
  price: number
  date: string
  source: string | null
  createdAt: string
}

export type FuelPriceRequest = {
  fuelSymbol: FuelSymbol
  currency: Currency
  price: number
  date: string
  source?: string | null
}

export type FuelPriceFilter = {
  fuelSymbol?: FuelSymbol | null
  currency?: Currency | null
  from?: string | null
  to?: string | null
}

export type SortProperty = 'date' | 'price'
export type SortDirection = 'asc' | 'desc'

export type PageRequest = {
  page: number
  size: number
  sort: SortProperty
  direction: SortDirection
}

/** Spring `PagedModel` — content plus a nested page descriptor. */
export type PagedModel<T> = {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}
