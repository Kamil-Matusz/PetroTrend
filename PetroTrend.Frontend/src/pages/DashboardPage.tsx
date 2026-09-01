import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { findByDateRange, findLatest } from '../api/fuelPrices'
import type { Currency, FuelSymbol } from '../api/types'
import { CURRENCIES, FUEL_SYMBOLS } from '../api/types'
import { FuelMark } from '../components/FuelChip'
import type { PylonReading } from '../components/Pylon'
import { Pylon } from '../components/Pylon'
import { PriceTable } from '../components/PriceTable'
import { RangeTabs } from '../components/RangeTabs'
import { Empty, ErrorNote, Loading } from '../components/States'
import { TrendChart } from '../components/TrendChart'
import { useAsync } from '../hooks/useAsync'
import { formatDayNumeric } from '../lib/format'
import type { RangeKey } from '../lib/range'
import { rangeToDates } from '../lib/range'
import './DashboardPage.css'

export function DashboardPage() {
  const [range, setRange] = useState<RangeKey | null>(null)
  const [currency, setCurrency] = useState<Currency>('PLN')
  // `null` means "whatever the backend serves by default" — that set is never repeated here.
  const [selection, setSelection] = useState<FuelSymbol[] | null>(null)

  const dateWindow = useMemo(() => (range ? rangeToDates(range) : null), [range])

  const latest = useAsync(() => findLatest(selection ?? undefined), [selection])
  // History is opt-in: nothing is fetched until a range is picked.
  const history = useAsync(
    () => (dateWindow ? findByDateRange(dateWindow.from, dateWindow.to) : Promise.resolve([])),
    [dateWindow],
  )

  // Grades on the board: the user's pick, or the ones the default response came back with.
  const shown = useMemo(() => {
    if (selection) return selection
    const returned = new Set((latest.data ?? []).map((row) => row.fuelSymbol))
    return FUEL_SYMBOLS.filter((symbol) => returned.has(symbol))
  }, [selection, latest.data])

  // `/latest` already returns exactly one row per fuel and currency.
  const readings = useMemo(() => {
    const result: Partial<Record<FuelSymbol, PylonReading>> = {}

    for (const row of latest.data ?? []) {
      if (row.currency !== currency) continue
      result[row.fuelSymbol] = { price: row.price, date: row.date }
    }

    return result
  }, [latest.data, currency])

  const rows = useMemo(
    () => (history.data ?? []).filter((row) => row.currency === currency),
    [history.data, currency],
  )

  const recent = useMemo(
    () => [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [rows],
  )

  const toggleFuel = (symbol: FuelSymbol) => {
    const next = shown.includes(symbol)
      ? shown.filter((s) => s !== symbol)
      : [...shown, symbol]
    // An empty board would just mean "backend default" again, so keep the last grade on.
    if (next.length > 0) setSelection(FUEL_SYMBOLS.filter((s) => next.includes(s)))
  }

  return (
    <div className="dash">
      <div className="dash__controls">
        <div>
          <h1>Pulpit</h1>
          <p className="dash__window num">
            {dateWindow
              ? `${formatDayNumeric(dateWindow.from)} — ${formatDayNumeric(dateWindow.to)}`
              : 'Ostatnie notowania'}
          </p>
        </div>

        <div className="dash__pickers">
          <RangeTabs value={range} onChange={setRange} />
          <label className="dash__currency">
            <span className="eyebrow">Waluta</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="dash__fuels" role="group" aria-label="Paliwa na pylonie">
        {FUEL_SYMBOLS.map((symbol) => {
          const isOn = shown.includes(symbol)
          return (
            <button
              key={symbol}
              type="button"
              className={`dash__fuel-key${isOn ? '' : ' dash__fuel-key--off'}`}
              onClick={() => toggleFuel(symbol)}
              aria-pressed={isOn}
              disabled={(isOn && shown.length === 1) || (selection === null && latest.data == null)}
            >
              <FuelMark symbol={symbol} />
              {symbol}
            </button>
          )
        })}
      </div>

      {latest.data == null && latest.loading && <Loading label="Odczyt aktualnych cen" />}
      {latest.error != null && <ErrorNote error={latest.error} onRetry={latest.reload} />}
      {latest.data != null &&
        (shown.length > 0 ? (
          <Pylon symbols={shown} readings={readings} currency={currency} />
        ) : (
          <Empty
            title="Brak zapisanych notowań"
            hint="Dodaj pierwszy odczyt, aby zobaczyć ceny na pylonie."
            action={
              <Link to="/notowania" className="btn btn--primary">
                Dodaj odczyt
              </Link>
            }
          />
        ))}

      <section className="panel dash__panel">
        <div className="panel__head">
          <h2>Trend</h2>
          <p className="dash__hint">Kliknij paliwo w legendzie, aby ukryć jego serię.</p>
        </div>

        {history.loading ? (
          <Loading label="Odczyt notowań" />
        ) : history.error != null ? (
          <ErrorNote error={history.error} onRetry={history.reload} />
        ) : rows.length > 0 ? (
          <TrendChart rows={rows} currency={currency} />
        ) : dateWindow ? (
          <Empty
            title={`Brak notowań w ${currency} w tym zakresie`}
            hint="Zmień zakres lub walutę, albo dodaj pierwszy odczyt."
            action={
              <Link to="/notowania" className="btn btn--primary">
                Dodaj odczyt
              </Link>
            }
          />
        ) : (
          <Empty
            title="Wybierz zakres, aby wczytać historię"
            hint="30 dni, 90 dni, rok albo ten miesiąc."
          />
        )}
      </section>

      {recent.length > 0 && (
        <section className="panel dash__panel">
          <div className="panel__head">
            <h2>Ostatnie odczyty</h2>
            <Link to="/notowania" className="dash__more">
              Wszystkie notowania →
            </Link>
          </div>
          <PriceTable rows={recent} />
        </section>
      )}
    </div>
  )
}
