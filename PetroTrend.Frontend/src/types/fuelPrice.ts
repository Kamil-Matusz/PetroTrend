import type { Currency, FuelSymbol } from './enums'

export interface FuelPrice {
  id: string
  fuelSymbol: FuelSymbol
  currency: Currency
  price: string
  date: string
  source: string | null
  createdAt: string
}

export interface FuelPriceRequest {
  fuelSymbol: FuelSymbol
  currency: Currency
  price: string
  date: string
  source?: string
}

export interface FuelPriceFilter {
  fuelSymbol?: FuelSymbol
  currency?: Currency
  from?: string
  to?: string
}

export const SortableProperty = {
  date: 'date',
  price: 'price',
} as const

export type SortableProperty =
  (typeof SortableProperty)[keyof typeof SortableProperty]

export interface FuelPriceSearchParams extends FuelPriceFilter {
  page?: number
  size?: number
  sort?: `${SortableProperty},${'asc' | 'desc'}`
}
