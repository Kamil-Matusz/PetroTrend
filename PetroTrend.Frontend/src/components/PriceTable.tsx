import type { FuelPriceResponse, SortDirection, SortProperty } from '../api/types'
import { FUEL_META } from '../lib/fuel'
import { formatDayNumeric, formatMoney, formatStamp } from '../lib/format'
import { FuelChip } from './FuelChip'
import './PriceTable.css'

type PriceTableProps = {
  rows: FuelPriceResponse[]
  sort?: SortProperty
  direction?: SortDirection
  onSort?: (property: SortProperty) => void
  onEdit?: (row: FuelPriceResponse) => void
  onDelete?: (row: FuelPriceResponse) => void
}

function SortHeader({
  property,
  label,
  sort,
  direction,
  onSort,
}: {
  property: SortProperty
  label: string
  sort?: SortProperty
  direction?: SortDirection
  onSort?: (property: SortProperty) => void
}) {
  if (!onSort) return <th scope="col">{label}</th>

  const active = sort === property
  return (
    <th scope="col" aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={`ptable__sort${active ? ' ptable__sort--on' : ''}`} onClick={() => onSort(property)}>
        {label}
        <span aria-hidden="true">{active ? (direction === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  )
}

export function PriceTable({ rows, sort, direction, onSort, onEdit, onDelete }: PriceTableProps) {
  const editable = Boolean(onEdit || onDelete)

  return (
    <div className="ptable__scroll">
      <table className="ptable">
        <thead>
          <tr>
            <SortHeader property="date" label="Data" sort={sort} direction={direction} onSort={onSort} />
            <th scope="col">Paliwo</th>
            <SortHeader property="price" label="Cena" sort={sort} direction={direction} onSort={onSort} />
            <th scope="col">Źródło</th>
            <th scope="col">Zapisano</th>
            {editable && <th scope="col" className="ptable__actions-head">Akcje</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ '--grade': FUEL_META[row.fuelSymbol].color } as React.CSSProperties}>
              <td className="num">{formatDayNumeric(row.date)}</td>
              <td>
                <FuelChip symbol={row.fuelSymbol} />
              </td>
              <td className="num ptable__price">{formatMoney(row.price, row.currency)}</td>
              <td className="ptable__source">{row.source || <span className="ptable__void">—</span>}</td>
              <td className="num ptable__stamp">{formatStamp(row.createdAt)}</td>
              {editable && (
                <td className="ptable__actions">
                  {onEdit && (
                    <button type="button" className="ptable__action" onClick={() => onEdit(row)}>
                      Edytuj
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" className="ptable__action ptable__action--danger" onClick={() => onDelete(row)}>
                      Usuń
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
