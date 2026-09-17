import { request } from './client'
import type {
  FuelPriceFilter,
  FuelPriceRequest,
  FuelPriceResponse,
  FuelSymbol,
  PageRequest,
  PagedModel,
} from './types'

export function findAll(): Promise<FuelPriceResponse[]> {
  return request('/fuelPrices')
}

/**
 * One row per fuel/currency pair - the newest reading, no history. Omit `fuelSymbols` to get the
 * backend's own default set; the default is deliberately not repeated here.
 */
export function findLatest(fuelSymbols?: readonly FuelSymbol[]): Promise<FuelPriceResponse[]> {
  const query = fuelSymbols?.length ? `?fuelSymbols=${fuelSymbols.join(',')}` : ''
  return request(`/fuelPrices/latest${query}`)
}

export function findCurrentMonth(): Promise<FuelPriceResponse[]> {
  return request('/fuelPrices/currentMonth')
}

export function findByDateRange(from: string, to: string): Promise<FuelPriceResponse[]> {
  return request(`/fuelPrices/range?from=${from}&to=${to}`)
}

export function search(
  filter: FuelPriceFilter,
  page: PageRequest,
): Promise<PagedModel<FuelPriceResponse>> {
  const params = new URLSearchParams({
    page: String(page.page),
    size: String(page.size),
    sort: `${page.sort},${page.direction}`,
  })
  if (filter.fuelSymbol) params.set('fuelSymbol', filter.fuelSymbol)
  if (filter.currency) params.set('currency', filter.currency)
  if (filter.from) params.set('from', filter.from)
  if (filter.to) params.set('to', filter.to)

  return request(`/fuelPrices/search?${params}`)
}

export function findById(id: string): Promise<FuelPriceResponse> {
  return request(`/fuelPrices/${id}`)
}

export function create(body: FuelPriceRequest): Promise<FuelPriceResponse> {
  return request('/fuelPrices', { method: 'POST', body: JSON.stringify(body) })
}

export function update(id: string, body: FuelPriceRequest): Promise<FuelPriceResponse> {
  return request(`/fuelPrices/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export function remove(id: string): Promise<void> {
  return request(`/fuelPrices/${id}`, { method: 'DELETE' })
}

/** Deletes every reading in the range - all fuels and all currencies, not just the filtered view. */
export function removeRange(from: string, to: string): Promise<void> {
  return request(`/fuelPrices/range?from=${from}&to=${to}`, { method: 'DELETE' })
}
