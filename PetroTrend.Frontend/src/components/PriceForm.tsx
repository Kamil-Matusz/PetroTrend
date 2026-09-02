import { useState } from 'react'
import type { Currency, FuelPriceRequest, FuelPriceResponse, FuelSymbol } from '../api/types'
import { CURRENCIES, FUEL_SYMBOLS } from '../api/types'
import { FUEL_META } from '../lib/fuel'
import { todayIso } from '../lib/format'
import { Banner } from './States'
import './PriceForm.css'

type Draft = {
  fuelSymbol: FuelSymbol
  currency: Currency
  price: string
  date: string
  source: string
}

type Errors = Partial<Record<keyof Draft, string>>

const DEFAULT_SOURCE = 'Valdi Rzeszów'

type PriceFormProps = {
  initial?: FuelPriceResponse
  submitting: boolean
  error: unknown
  onSubmit: (request: FuelPriceRequest) => void
  onCancel: () => void
}

/** Mirrors the Jakarta constraints on FuelPriceRequest so bad payloads never leave the browser. */
function validate(draft: Draft): Errors {
  const errors: Errors = {}
  const price = Number(draft.price.replace(',', '.'))

  if (!draft.price.trim()) errors.price = 'Podaj cenę.'
  else if (!Number.isFinite(price) || price <= 0) errors.price = 'Cena musi być większa od zera.'
  else if (price >= 10000) errors.price = 'Maksymalnie 4 cyfry przed przecinkiem.'
  else if (Math.round(price * 100) !== Number((price * 100).toFixed(4))) errors.price = 'Najwyżej dwa miejsca po przecinku.'

  if (!draft.date) errors.date = 'Podaj datę odczytu.'
  else if (draft.date > todayIso()) errors.date = 'Data nie może być z przyszłości.'

  if (draft.source.length > 64) errors.source = 'Najwyżej 64 znaki.'

  return errors
}

export function PriceForm({ initial, submitting, error, onSubmit, onCancel }: PriceFormProps) {
  const [draft, setDraft] = useState<Draft>({
    fuelSymbol: initial?.fuelSymbol ?? 'ON',
    currency: initial?.currency ?? 'PLN',
    price: initial ? String(initial.price) : '',
    date: initial?.date ?? todayIso(),
    source: initial?.source ?? DEFAULT_SOURCE,
  })
  const [errors, setErrors] = useState<Errors>({})

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit({
      fuelSymbol: draft.fuelSymbol,
      currency: draft.currency,
      price: Number(draft.price.replace(',', '.')),
      date: draft.date,
      source: draft.source.trim() || null,
    })
  }

  return (
    <form className="pform" onSubmit={handleSubmit} noValidate>
      {error != null && <Banner error={error} />}

      <div className="pform__grid">
        <div className="field">
          <label htmlFor="pf-fuel">Paliwo</label>
          <select
            id="pf-fuel"
            value={draft.fuelSymbol}
            onChange={(e) => set('fuelSymbol', e.target.value as FuelSymbol)}
          >
            {FUEL_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol} - {FUEL_META[symbol].name}
              </option>
            ))}
          </select>
        </div>

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

        <div className={`field${errors.price ? ' field--invalid' : ''}`}>
          <label htmlFor="pf-price">Cena za litr</label>
          <input
            id="pf-price"
            inputMode="decimal"
            placeholder="6,42"
            value={draft.price}
            onChange={(e) => set('price', e.target.value)}
          />
          {errors.price && <span className="field__error">{errors.price}</span>}
        </div>

        <div className={`field${errors.date ? ' field--invalid' : ''}`}>
          <label htmlFor="pf-date">Data odczytu</label>
          <input id="pf-date" type="date" max={todayIso()} value={draft.date} onChange={(e) => set('date', e.target.value)} />
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

      <p className="pform__note">
        Jedno notowanie na paliwo, walutę i dzień - powtórzenie zostanie odrzucone przez API.
      </p>

      <div className="pform__actions">
        <button type="button" className="btn" onClick={onCancel}>
          Anuluj
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Zapisywanie…' : initial ? 'Zapisz zmiany' : 'Dodaj odczyt'}
        </button>
      </div>
    </form>
  )
}
