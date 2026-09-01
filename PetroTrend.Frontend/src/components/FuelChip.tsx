import type { FuelSymbol } from '../api/types'
import { FUEL_META } from '../lib/fuel'
import './FuelChip.css'

/** EN 16942 pump-label geometry: diesel square, petrol circle, gaseous diamond. */
export function FuelMark({ symbol, size = 12 }: { symbol: FuelSymbol; size?: number }) {
  const { color, shape } = FUEL_META[symbol]
  const c = size / 2
  const r = size / 2 - 1

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      {shape === 'circle' && <circle cx={c} cy={c} r={r} fill={color} />}
      {shape === 'square' && <rect x="1" y="1" width={size - 2} height={size - 2} fill={color} />}
      {shape === 'diamond' && (
        <polygon points={`${c},0.5 ${size - 0.5},${c} ${c},${size - 0.5} 0.5,${c}`} fill={color} />
      )}
    </svg>
  )
}

export function FuelChip({ symbol, withName = false }: { symbol: FuelSymbol; withName?: boolean }) {
  const { name } = FUEL_META[symbol]

  return (
    <span className="fuel-chip" title={name}>
      <FuelMark symbol={symbol} />
      <span className="fuel-chip__symbol">{symbol}</span>
      {withName && <span className="fuel-chip__name">{name}</span>}
    </span>
  )
}
