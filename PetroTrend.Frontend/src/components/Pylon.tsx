import type { Currency, FuelSymbol } from '../api/types'
import { FUEL_SYMBOLS } from '../api/types'
import { CURRENCY_SUFFIX, FUEL_META } from '../lib/fuel'
import { formatDayLong, formatDelta, formatPrice } from '../lib/format'
import { FuelMark } from './FuelChip'
import { RollingDigits } from './RollingDigits'
import './Pylon.css'

export type PylonReading = {
  price: number
  delta: number | null
  date: string
}

type PylonProps = {
  readings: Partial<Record<FuelSymbol, PylonReading>>
  currency: Currency
}

function Delta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="pylon__delta pylon__delta--none">pierwszy odczyt</span>
  }

  const direction = delta > 0 ? 'rise' : delta < 0 ? 'fall' : 'flat'
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '•'
  const label = delta > 0 ? 'wzrost' : delta < 0 ? 'spadek' : 'bez zmiany'

  return (
    <span className={`pylon__delta pylon__delta--${direction}`}>
      <span aria-hidden="true">{arrow}</span>
      <span className="num">{formatDelta(delta)}</span>
      <span className="pylon__delta-sr">{label} względem poprzedniego odczytu</span>
    </span>
  )
}

export function Pylon({ readings, currency }: PylonProps) {
  const dates = FUEL_SYMBOLS.map((s) => readings[s]?.date).filter(Boolean) as string[]
  const latest = dates.sort().at(-1)

  return (
    <div className="pylon">
      <div className="pylon__plate">
        <div className="pylon__head">
          <span className="eyebrow">Aktualne ceny</span>
          <span className="pylon__date">{latest ? formatDayLong(latest) : 'brak odczytów'}</span>
        </div>

        <ul className="pylon__rows">
          {FUEL_SYMBOLS.map((symbol) => {
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

                {reading ? <Delta delta={reading.delta} /> : <span className="pylon__delta pylon__delta--none">brak danych</span>}
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
