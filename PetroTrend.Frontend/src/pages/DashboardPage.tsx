import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { findByDateRange } from '../api/fuelPrices'
import type { Currency, FuelSymbol } from '../api/types'
import { CURRENCIES, FUEL_SYMBOLS } from '../api/types'
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
  const [range, setRange] = useState<RangeKey>('90d')
  const [currency, setCurrency] = useState<Currency>('PLN')

  const { from, to } = useMemo(() => rangeToDates(range), [range])
  const { data, loading, error, reload } = useAsync(() => findByDateRange(from, to), [from, to])

  const rows = useMemo(
    () => (data ?? []).filter((row) => row.currency === currency),
    [data, currency],
  )

  // Latest reading per grade, plus the step from the one before it.
  const readings = useMemo(() => {
    const result: Partial<Record<FuelSymbol, PylonReading>> = {}

    for (const symbol of FUEL_SYMBOLS) {
      const series = rows
        .filter((row) => row.fuelSymbol === symbol)
        .sort((a, b) => a.date.localeCompare(b.date))
      const last = series.at(-1)
      if (!last) continue

      const previous = series.at(-2)
      result[symbol] = {
        price: last.price,
        delta: previous ? Number((last.price - previous.price).toFixed(2)) : null,
        date: last.date,
      }
    }

    return result
  }, [rows])

  const recent = useMemo(
    () => [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [rows],
  )

  return (
    <div className="dash">
      <div className="dash__controls">
        <div>
          <h1>Pulpit</h1>
          <p className="dash__window num">
            {formatDayNumeric(from)} — {formatDayNumeric(to)}
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

      {loading && <Loading label="Odczyt notowań" />}
      {error != null && <ErrorNote error={error} onRetry={reload} />}

      {!loading && error == null && (
        <>
          <Pylon readings={readings} currency={currency} />

          <section className="panel dash__panel">
            <div className="panel__head">
              <h2>Trend</h2>
              <p className="dash__hint">Kliknij paliwo w legendzie, aby ukryć jego serię.</p>
            </div>
            {rows.length > 0 ? (
              <TrendChart rows={rows} currency={currency} />
            ) : (
              <Empty
                title={`Brak notowań w ${currency} w tym zakresie`}
                hint="Zmień zakres lub walutę, albo dodaj pierwszy odczyt."
                action={
                  <Link to="/notowania" className="btn btn--primary">
                    Dodaj odczyt
                  </Link>
                }
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
        </>
      )}
    </div>
  )
}
