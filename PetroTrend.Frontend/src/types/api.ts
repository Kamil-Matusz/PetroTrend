export const ReasonCode = {
  FUEL_PRICE_NOT_FOUND: 'FUEL_PRICE_NOT_FOUND',
  FUEL_PRICE_ALREADY_EXISTS: 'FUEL_PRICE_ALREADY_EXISTS',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_SORT_PROPERTY: 'INVALID_SORT_PROPERTY',
} as const

export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode]

export interface ApiError {
  status: number
  message: string
  reasonCode?: ReasonCode
}

export interface PageMetadata {
  size: number
  number: number
  totalElements: number
  totalPages: number
}

export interface PagedModel<T> {
  content: T[]
  page: PageMetadata
}
