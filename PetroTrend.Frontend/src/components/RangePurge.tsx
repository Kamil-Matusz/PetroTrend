import { useState } from 'react'
import { findByDateRange, removeRange } from '../api/fuelPrices'
import type { FuelPriceResponse } from '../api/types'
import { CURRENCIES, FUEL_SYMBOLS } from '../api/types'
import { FuelMark } from './FuelChip'
import { Banner, ErrorNote, Loading } from './States'
import { useAsync } from '../hooks/useAsync'
import { formatDayNumeric, pluralRecords } from '../lib/format'
import './RangePurge.css'

type RangePurgeProps = {
  onClose: () => void
  onDeleted: (deleted: number) => void
}

/**
 * The endpoint ignores fuel and currency, so this deliberately stands apart from the table
 * filters. The preview is the confirmation step: `DELETE /range` answers 204 without a count,
 * so the only honest number is the one we read back before deleting.
 */
export function RangePurge({ onClose, onDeleted }: RangePurgeProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<unknown>(null)

  const inverted = Boolean(from && to) && from > to
  const ready = Boolean(from && to) && !inverted

  const { data: preview, loading, error, reload } = useAsync(
    () => (ready ? findByDateRange(from, to) : Promise.resolve(null)),
    [from, to],
  )

  const total = preview?.length ?? 0

  const confirm = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await removeRange(from, to)
      onDeleted(total)
    } catch (cause) {
      setDeleteError(cause)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="purge">
      {deleteError != null && <Banner error={deleteError} />}

      <p className="purge__lead">
        Usuwa <strong>wszystkie</strong> notowania z wybranego okresu - każde paliwo i każdą walutę,
        niezależnie od filtrów tabeli.
      </p>

      <div className="purge__dates">
        <div className="field">
          <label htmlFor="purge-from">Od</label>
          <input id="purge-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="purge-to">Do</label>
          <input id="purge-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {inverted && <p className="purge__hint purge__hint--bad">Data początkowa jest późniejsza niż końcowa.</p>}

      {!ready && !inverted && <p className="purge__hint">Wybierz obie daty, aby zobaczyć, co zostanie usunięte.</p>}

      {ready && loading && <Loading label="Liczenie notowań" />}
      {ready && error != null && <ErrorNote error={error} onRetry={reload} />}

      {ready && !loading && error == null && preview != null && (
        <Summary from={from} to={to} rows={preview} />
      )}

      <div className="purge__actions">
        <button type="button" className="btn" onClick={onClose}>
          Anuluj
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={confirm}
          disabled={!ready || loading || total === 0 || deleting}
        >
          {deleting ? 'Usuwanie…' : total > 0 ? `Usuń ${total} ${pluralRecords(total)}` : 'Usuń'}
        </button>
      </div>
    </div>
  )
}

function Summary({ from, to, rows }: { from: string; to: string; rows: FuelPriceResponse[] }) {
  const period = (
    <span className="num">
      {formatDayNumeric(from)} - {formatDayNumeric(to)}
    </span>
  )

  if (rows.length === 0) {
    return (
      <p className="purge__hint">
        W okresie {period} nie ma żadnych notowań - nie ma czego usuwać.
      </p>
    )
  }

  const fuels = FUEL_SYMBOLS.map((symbol) => ({
    symbol,
    count: rows.filter((row) => row.fuelSymbol === symbol).length,
  })).filter((entry) => entry.count > 0)

  const currencies = CURRENCIES.filter((code) => rows.some((row) => row.currency === code))

  return (
    <div className="purge__summary" role="status">
      <p className="purge__total">
        Usuniesz <strong className="num">{rows.length}</strong> {pluralRecords(rows.length)} z okresu {period}.
      </p>
      <ul className="purge__breakdown">
        {fuels.map(({ symbol, count }) => (
          <li key={symbol}>
            <FuelMark symbol={symbol} />
            <span>{symbol}</span>
            <span className="num purge__breakdown-count">{count}</span>
          </li>
        ))}
      </ul>
      <p className="purge__hint">Waluty w tym okresie: {currencies.join(', ')}. Tej operacji nie da się cofnąć.</p>
    </div>
  )
}