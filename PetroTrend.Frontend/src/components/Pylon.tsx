import type { Currency, FuelSymbol } from '../api/types'
import { CURRENCY_SUFFIX, FUEL_META } from '../lib/fuel'
import { formatDayLong, formatDayNumeric, formatPrice } from '../lib/format'
import { FuelMark } from './FuelChip'
import { RollingDigits } from './RollingDigits'
import './Pylon.css'

export type PylonReading = {
  price: number
  date: string
}

type PylonProps = {
  symbols: readonly FuelSymbol[]
  readings: Partial<Record<FuelSymbol, PylonReading>>
  currency: Currency
}

export function Pylon({ symbols, readings, currency }: PylonProps) {
  const dates = symbols.map((s) => readings[s]?.date).filter(Boolean) as string[]
  const latest = dates.sort().at(-1)

  return (
    <div className="pylon">
      <div className="pylon__plate">
        <div className="pylon__head">
          <span className="eyebrow">Aktualne ceny</span>
          <span className="pylon__date">{latest ? formatDayLong(latest) : 'brak odczytów'}</span>
        </div>

        <ul className="pylon__rows">
          {symbols.map((symbol) => {
            const reading = readings[symbol]
            return (
              <li key={symbol} className="pylon__row">
                <span className="pylon__grade">
                  <FuelMark symbol={symbol} size={14} />
                  <span className="pylon__symbol">{symbol}</span>
                  <span className="pylon__name">{FUEL_META[symbol].name}</span>
                </span>

                <span className={`pylon__price num${reading ? '' : ' pylon__price--void'}`}>
                  {reading ? <RollingDigits value={formatPrice(reading.price)} /> : '—,——'}
                </span>

                <span className="pylon__stamp">
                  {reading ? (
                    <span className="num">{formatDayNumeric(reading.date)}</span>
                  ) : (
                    'brak danych'
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="pylon__foot">
          <span className="num">{CURRENCY_SUFFIX[currency]}</span>
          <span>Ceny detaliczne wg zapisanych notowań</span>
        </div>
      </div>

      <div className="pylon__mast" aria-hidden="true" />
      <div className="pylon__pool" aria-hidden="true" />
    </div>
  )
}
