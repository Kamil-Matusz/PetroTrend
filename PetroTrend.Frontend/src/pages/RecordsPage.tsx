import { useState } from 'react'
import { create, remove, search, update } from '../api/fuelPrices'
import type {
  Currency,
  FuelPriceRequest,
  FuelPriceResponse,
  FuelSymbol,
  SortDirection,
  SortProperty,
} from '../api/types'
import { CURRENCIES, FUEL_SYMBOLS } from '../api/types'
import { Modal } from '../components/Modal'
import { PriceForm } from '../components/PriceForm'
import { PriceTable } from '../components/PriceTable'
import { RangePurge } from '../components/RangePurge'
import { Banner, Empty, ErrorNote, Loading } from '../components/States'
import { useAsync } from '../hooks/useAsync'
import { FUEL_META } from '../lib/fuel'
import { formatDayNumeric, formatMoney, pluralRecords } from '../lib/format'
import './RecordsPage.css'

const PAGE_SIZES = [10, 20, 50, 100]

type Dialog =
  | { mode: 'create' }
  | { mode: 'edit'; row: FuelPriceResponse }
  | { mode: 'delete'; row: FuelPriceResponse }
  | { mode: 'purge' }

export function RecordsPage() {
  const [fuelSymbol, setFuelSymbol] = useState<FuelSymbol | ''>('')
  const [currency, setCurrency] = useState<Currency | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState<SortProperty>('date')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [size, setSize] = useState(20)
  const [page, setPage] = useState(0)

  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [purged, setPurged] = useState<number | null>(null)

  const { data, loading, error, reload } = useAsync(
    () =>
      search(
        { fuelSymbol: fuelSymbol || null, currency: currency || null, from: from || null, to: to || null },
        { page, size, sort, direction },
      ),
    [fuelSymbol, currency, from, to, page, size, sort, direction],
  )

  const rows = data?.content ?? []
  const meta = data?.page

  const onSort = (property: SortProperty) => {
    if (property === sort) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(property)
      setDirection('desc')
    }
    setPage(0)
  }

  const resetFilters = () => {
    setFuelSymbol('')
    setCurrency('')
    setFrom('')
    setTo('')
    setPage(0)
  }

  const closeDialog = () => {
    setDialog(null)
    setSaveError(null)
  }

  const submit = async (request: FuelPriceRequest) => {
    if (dialog?.mode !== 'create' && dialog?.mode !== 'edit') return
    setSaving(true)
    setSaveError(null)
    try {
      if (dialog.mode === 'edit') await update(dialog.row.id, request)
      else await create(request)
      closeDialog()
      reload()
    } catch (cause) {
      setSaveError(cause)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (dialog?.mode !== 'delete') return
    setSaving(true)
    setSaveError(null)
    try {
      await remove(dialog.row.id)
      closeDialog()
      reload()
    } catch (cause) {
      setSaveError(cause)
    } finally {
      setSaving(false)
    }
  }

  const onPurged = (deleted: number) => {
    closeDialog()
    setPurged(deleted)
    setPage(0)
    reload()
  }

  const hasFilters = Boolean(fuelSymbol || currency || from || to)

  return (
    <div className="recs">
      <div className="recs__head">
        <div>
          <h1>Notowania</h1>
          <p className="recs__count num">{meta ? `${meta.totalElements} odczytów` : '-'}</p>
        </div>
        <div className="recs__head-actions">
          <button type="button" className="btn" onClick={() => setDialog({ mode: 'purge' })}>
            Wyczyść okres
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setDialog({ mode: 'create' })}>
            Dodaj odczyt
          </button>
        </div>
      </div>

      {purged != null && (
        <p className="recs__notice" role="status">
          Usunięto <span className="num">{purged}</span> {pluralRecords(purged)} z wybranego okresu.
          <button type="button" className="recs__notice-close" onClick={() => setPurged(null)} aria-label="Zamknij komunikat">
            ×
          </button>
        </p>
      )}

      <section className="panel recs__filters" aria-label="Filtry">
        <div className="field">
          <label htmlFor="f-fuel">Paliwo</label>
          <select
            id="f-fuel"
            value={fuelSymbol}
            onChange={(e) => {
              setFuelSymbol(e.target.value as FuelSymbol | '')
              setPage(0)
            }}
          >
            <option value="">Wszystkie</option>
            {FUEL_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol} - {FUEL_META[symbol].name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-currency">Waluta</label>
          <select
            id="f-currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value as Currency | '')
              setPage(0)
            }}
          >
            <option value="">Wszystkie</option>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-from">Od</label>
          <input
            id="f-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(0)
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="f-to">Do</label>
          <input
            id="f-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(0)
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="f-size">Na stronę</label>
          <select
            id="f-size"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value))
              setPage(0)
            }}
          >
            {PAGE_SIZES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn recs__reset" onClick={resetFilters} disabled={!hasFilters}>
          Wyczyść
        </button>
      </section>

      <section className="panel recs__results">
        {loading && <Loading label="Wyszukiwanie" />}
        {error != null && <ErrorNote error={error} onRetry={reload} />}

        {!loading && error == null && rows.length === 0 && (
          <Empty
            title={hasFilters ? 'Żadne notowanie nie pasuje do filtrów' : 'Brak notowań'}
            hint={
              hasFilters
                ? 'Poluzuj filtry albo wyczyść je i zacznij od nowa.'
                : 'Dodaj pierwszy odczyt ceny, aby zacząć śledzić trend.'
            }
            action={
              hasFilters ? (
                <button type="button" className="btn" onClick={resetFilters}>
                  Wyczyść filtry
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={() => setDialog({ mode: 'create' })}>
                  Dodaj odczyt
                </button>
              )
            }
          />
        )}

        {!loading && error == null && rows.length > 0 && (
          <>
            <PriceTable
              rows={rows}
              sort={sort}
              direction={direction}
              onSort={onSort}
              onEdit={(row) => setDialog({ mode: 'edit', row })}
              onDelete={(row) => setDialog({ mode: 'delete', row })}
            />

            {meta && meta.totalPages > 1 && (
              <div className="recs__pager">
                <button type="button" className="btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                  ← Poprzednia
                </button>
                <span className="num recs__pager-label">
                  Strona {meta.number + 1} z {meta.totalPages}
                </span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={meta.number + 1 >= meta.totalPages}
                >
                  Następna →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {dialog?.mode === 'create' && (
        <Modal title="Nowy odczyt" onClose={closeDialog}>
          <PriceForm submitting={saving} error={saveError} onSubmit={submit} onCancel={closeDialog} />
        </Modal>
      )}

      {dialog?.mode === 'edit' && (
        <Modal title="Edycja odczytu" onClose={closeDialog}>
          <PriceForm
            initial={dialog.row}
            submitting={saving}
            error={saveError}
            onSubmit={submit}
            onCancel={closeDialog}
          />
        </Modal>
      )}

      {dialog?.mode === 'purge' && (
        <Modal title="Wyczyść okres" onClose={closeDialog}>
          <RangePurge onClose={closeDialog} onDeleted={onPurged} />
        </Modal>
      )}

      {dialog?.mode === 'delete' && (
        <Modal title="Usuń odczyt" onClose={closeDialog}>
          <div className="recs__confirm">
            {saveError != null && <Banner error={saveError} />}
            <p>
              Usunąć notowanie <strong>{dialog.row.fuelSymbol}</strong> z dnia{' '}
              <span className="num">{formatDayNumeric(dialog.row.date)}</span> w cenie{' '}
              <span className="num">{formatMoney(dialog.row.price, dialog.row.currency)}</span>?
            </p>
            <p className="recs__confirm-note">Tej operacji nie da się cofnąć.</p>
            <div className="recs__confirm-actions">
              <button type="button" className="btn" onClick={closeDialog}>
                Anuluj
              </button>
              <button type="button" className="btn btn--danger" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Usuwanie…' : 'Usuń'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
