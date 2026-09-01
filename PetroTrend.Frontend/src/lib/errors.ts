import { ApiError } from '../api/client'

const MESSAGES: Record<string, string> = {
  FUEL_PRICE_NOT_FOUND: 'Nie znaleziono notowania — mogło zostać usunięte.',
  FUEL_PRICE_ALREADY_EXISTS: 'Notowanie dla tego paliwa, waluty i dnia już istnieje.',
  INVALID_DATE_RANGE: 'Data początkowa jest późniejsza niż końcowa.',
  INVALID_SORT_PROPERTY: 'Sortowanie po tej kolumnie nie jest obsługiwane.',
  NETWORK_UNREACHABLE: 'Brak połączenia z API. Uruchom backend na porcie 8080.',
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.reasonCode && MESSAGES[error.reasonCode]) return MESSAGES[error.reasonCode]
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Wystąpił nieznany błąd.'
}
