import { useState } from 'react'
import type {
  Currency,
  FuelPriceBatchRequest,
  FuelPriceRequest,
  FuelPriceResponse,
  FuelSymbol,
} from '../api/types'
import { CURRENCIES, FUEL_SYMBOLS } from '../api/types'
import { CURRENCY_SUFFIX, FUEL_META } from '../lib/fuel'
import { todayIso } from '../lib/format'
import { FuelMark } from './FuelChip'
import { Banner } from './States'
import './PriceForm.css'

type Draft = {
  fuelSymbol: FuelSymbol
  currency: Currency
  date: string
  source: string
  prices: Partial<Record<FuelSymbol, string>>
}

type Errors = {
  date?: string
  source?: string
  form?: string
  prices: Partial<Record<FuelSymbol, string>>
}

const DEFAULT_SOURCE = 'Valdi Rzeszów'

type PriceFormProps =
  | {
      initial: FuelPriceResponse
      submitting: boolean
      error: unknown
      onSubmit: (request: FuelPriceRequest) => void
      onCancel: () => void
    }
  | {
      initial?: undefined
      submitting: boolean
      error: unknown
      onSubmit: (request: FuelPriceBatchRequest) => void
      onCancel: () => void
    }

/** Mirrors the Jakarta constraints on FuelPriceRequest so bad payloads never leave the browser. */
function validatePrice(raw: string): string | undefined {
  const price = Number(raw.replace(',', '.'))

  if (!Number.isFinite(price) || price <= 0) return 'Cena musi być większa od zera.'
  if (price >= 10000) return 'Maksymalnie 4 cyfry przed przecinkiem.'
  if (Math.round(price * 100) !== Number((price * 100).toFixed(4))) return 'Najwyżej dwa miejsca po przecinku.'
  return undefined
}

/** Only the fuels the user actually typed a price for - a blank field means "skip this grade". */
function entered(prices: Draft['prices']): [FuelSymbol, string][] {
  return FUEL_SYMBOLS.flatMap((symbol) => {
    const raw = (prices[symbol] ?? '').trim()
    return raw ? [[symbol, raw] as [FuelSymbol, string]] : []
  })
}

function validate(draft: Draft, isEdit: boolean): Errors {
  const errors: Errors = { prices: {} }
  const typed = entered(draft.prices)

  if (typed.length === 0) errors.form = isEdit ? 'Podaj cenę.' : 'Podaj przynajmniej jedną cenę.'
  for (const [symbol, raw] of typed) {
    const message = validatePrice(raw)
    if (message) errors.prices[symbol] = message
  }

  if (!draft.date) errors.date = 'Podaj datę odczytu.'
  else if (draft.date > todayIso()) errors.date = 'Data nie może być z przyszłości.'

  if (draft.source.length > 64) errors.source = 'Najwyżej 64 znaki.'

  return errors
}

function hasErrors(errors: Errors): boolean {
  return Boolean(errors.date || errors.source || errors.form) || Object.keys(errors.prices).length > 0
}

export function PriceForm(props: PriceFormProps) {
  const { initial, submitting, error, onCancel } = props
  const isEdit = initial != null

  const [draft, setDraft] = useState<Draft>({
    fuelSymbol: initial?.fuelSymbol ?? 'ON',
    currency: initial?.currency ?? 'PLN',
    date: initial?.date ?? todayIso(),
    source: initial?.source ?? DEFAULT_SOURCE,
    prices: initial ? { [initial.fuelSymbol]: String(initial.price) } : {},
  })
  const [errors, setErrors] = useState<Errors>({ prices: {} })

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const setPrice = (symbol: FuelSymbol, value: string) =>
    setDraft((current) => ({ ...current, prices: { ...current.prices, [symbol]: value } }))

  /** Edit keeps its own fuel select, so the single price has to follow the selected grade. */
  const setEditedFuel = (symbol: FuelSymbol) =>
    setDraft((current) => ({
      ...current,
      fuelSymbol: symbol,
      prices: { [symbol]: current.prices[current.fuelSymbol] ?? '' },
    }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const found = validate(draft, isEdit)
    setErrors(found)
    if (hasErrors(found)) return

    const source = draft.source.trim() || null
    const requests: FuelPriceRequest[] = entered(draft.prices).map(([symbol, raw]) => ({
      fuelSymbol: symbol,
      currency: draft.currency,
      price: Number(raw.replace(',', '.')),
      date: draft.date,
      source,
    }))

    if (props.initial != null) props.onSubmit(requests[0])
    else props.onSubmit({ prices: requests })
  }

  const priceError = errors.prices[draft.fuelSymbol] ?? errors.form

  return (
    <form className="pform" onSubmit={handleSubmit} noValidate>
      {error != null && <Banner error={error} />}

      <div className="pform__grid">
        {isEdit && (
          <div className="field">
            <label htmlFor="pf-fuel">Paliwo</label>
            <select id="pf-fuel" value={draft.fuelSymbol} onChange={(e) => setEditedFuel(e.target.value as FuelSymbol)}>
              {FUEL_SYMBOLS.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol} - {FUEL_META[symbol].name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="pf-currency">Waluta</label>
          <select id="pf-currency" value={draft.currency} onChange={(e) => set('currency', e.target.value as Currency)}>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        {isEdit && (
          <div className={`field${priceError ? ' field--invalid' : ''}`}>
            <label htmlFor="pf-price">Cena za litr</label>
            <input
              id="pf-price"
              inputMode="decimal"
              placeholder="6,42"
              value={draft.prices[draft.fuelSymbol] ?? ''}
              onChange={(e) => setPrice(draft.fuelSymbol, e.target.value)}
            />
            {priceError && <span className="field__error">{priceError}</span>}
          </div>
        )}

        <div className={`field${errors.date ? ' field--invalid' : ''}`}>
          <label htmlFor="pf-date">Data odczytu</label>
          <input
            id="pf-date"
            type="date"
            max={todayIso()}
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
          />
          {errors.date && <span className="field__error">{errors.date}</span>}
        </div>

        <div className={`field pform__wide${errors.source ? ' field--invalid' : ''}`}>
          <label htmlFor="pf-source">Źródło (opcjonalnie)</label>
          <input
            id="pf-source"
            placeholder={DEFAULT_SOURCE}
            maxLength={64}
            value={draft.source}
            onChange={(e) => set('source', e.target.value)}
          />
          {errors.source && <span className="field__error">{errors.source}</span>}
        </div>
      </div>

      {!isEdit && (
        <fieldset className={`pform__fuels${errors.form ? ' pform__fuels--invalid' : ''}`}>
          <legend>Ceny za litr</legend>
          {FUEL_SYMBOLS.map((symbol) => (
            <div key={symbol} className={`pform__fuel${errors.prices[symbol] ? ' pform__fuel--invalid' : ''}`}>
              <label className="pform__fuel-name" htmlFor={`pf-price-${symbol}`}>
                <FuelMark symbol={symbol} />
                <span className="pform__fuel-symbol">{symbol}</span>
                <span className="pform__fuel-full">{FUEL_META[symbol].name}</span>
              </label>
              <div className="pform__fuel-entry">
                <input
                  id={`pf-price-${symbol}`}
                  inputMode="decimal"
                  placeholder="-"
                  value={draft.prices[symbol] ?? ''}
                  onChange={(e) => setPrice(symbol, e.target.value)}
                />
                <span className="pform__fuel-unit">{CURRENCY_SUFFIX[draft.currency]}</span>
              </div>
              {errors.prices[symbol] && <span className="field__error pform__fuel-error">{errors.prices[symbol]}</span>}
            </div>
          ))}
          {errors.form && <span className="field__error pform__fuel-error">{errors.form}</span>}
        </fieldset>
      )}

      <p className="pform__note">
        {isEdit
          ? 'Jedno notowanie na paliwo, walutę i dzień - powtórzenie zostanie odrzucone przez API.'
          : 'Puste pole pomijamy. Notowanie, które już istnieje na ten dzień, zostanie nadpisane nową ceną.'}
      </p>

      <div className="pform__actions">
        <button type="button" className="btn" onClick={onCancel}>
          Anuluj
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Zapisywanie…' : isEdit ? 'Zapisz zmiany' : 'Dodaj odczyty'}
        </button>
      </div>
    </form>
  )
}
