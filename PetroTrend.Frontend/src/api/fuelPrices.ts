import { request } from './client'
import type {
  FuelPriceFilter,
  FuelPriceRequest,
  FuelPriceResponse,
  PageRequest,
  PagedModel,
} from './types'

export function findAll(): Promise<FuelPriceResponse[]> {
  return request('/fuelPrices')
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
