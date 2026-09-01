import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Currency, FuelPriceResponse, FuelSymbol } from '../api/types'
import { FUEL_SYMBOLS } from '../api/types'
import { CURRENCY_SUFFIX, FUEL_META } from '../lib/fuel'
import { formatDayLong, formatDayShort, formatPrice } from '../lib/format'
import { FuelMark } from './FuelChip'
import './TrendChart.css'

type Row = { date: string } & Partial<Record<FuelSymbol, number>>

type TooltipProps = {
  active?: boolean
  label?: string | number
  payload?: { dataKey?: string | number; value?: number }[]
}

function ChartTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length || typeof label !== 'string') return null

  return (
    <div className="trend__tip">
      <p className="trend__tip-date">{formatDayLong(label)}</p>
      <ul className="trend__tip-list">
        {payload.map((entry) => {
          const symbol = entry.dataKey as FuelSymbol
          return (
            <li key={symbol}>
              <FuelMark symbol={symbol} size={10} />
              <span className="trend__tip-symbol">{symbol}</span>
              <span className="num trend__tip-value">{formatPrice(entry.value ?? 0)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type LabelProps = { x?: number | string; y?: number | string; index?: number }

/** Direct label at the end of each line, so identity never rests on colour alone. */
const endLabel =
  (symbol: FuelSymbol, last: number | undefined) =>
  ({ x, y, index }: LabelProps) => {
    if (index !== last || x === undefined || y === undefined) return null
    return (
      <text
        x={Number(x) + 9}
        y={Number(y)}
        dy={4}
        fill={FUEL_META[symbol].color}
        fontSize={12}
        fontWeight={700}
        fontFamily="Barlow Condensed, sans-serif"
        letterSpacing="0.06em"
      >
        {symbol}
      </text>
    )
  }

export function TrendChart({ rows, currency }: { rows: FuelPriceResponse[]; currency: Currency }) {
  const [hidden, setHidden] = useState<FuelSymbol[]>([])

  const { data, present } = useMemo(() => {
    const byDate = new Map<string, Row>()
    const seen = new Set<FuelSymbol>()

    for (const row of rows) {
      const bucket = byDate.get(row.date) ?? { date: row.date }
      bucket[row.fuelSymbol] = row.price
      byDate.set(row.date, bucket)
      seen.add(row.fuelSymbol)
    }

    return {
      data: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
      present: FUEL_SYMBOLS.filter((s) => seen.has(s)),
    }
  }, [rows])

  const lastIndex = useMemo(() => {
    const map: Partial<Record<FuelSymbol, number>> = {}
    data.forEach((row, i) => {
      for (const symbol of FUEL_SYMBOLS) if (row[symbol] != null) map[symbol] = i
    })
    return map
  }, [data])

  const visible = present.filter((s) => !hidden.includes(s))
  const sparse = data.length <= 31

  const toggle = (symbol: FuelSymbol) =>
    setHidden((current) =>
      current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol],
    )

  return (
    <div className="trend">
      <div className="trend__plot">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 56, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#1c2630" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayShort}
              tick={{ fill: '#64757f', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#232e38' }}
              minTickGap={44}
            />
            <YAxis
              width={56}
              domain={['auto', 'auto']}
              tickFormatter={formatPrice}
              tick={{ fill: '#64757f', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: '#ffb020', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            {visible.map((symbol) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                name={symbol}
                stroke={FUEL_META[symbol].color}
                strokeWidth={2}
                dot={sparse ? { r: 2.5, fill: FUEL_META[symbol].color, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: FUEL_META[symbol].color, stroke: '#141b22', strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              >
                <LabelList dataKey={symbol} content={endLabel(symbol, lastIndex[symbol])} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="trend__legend">
        <span className="trend__unit num">{CURRENCY_SUFFIX[currency]}</span>
        {present.map((symbol) => {
          const isHidden = hidden.includes(symbol)
          return (
            <button
              key={symbol}
              type="button"
              className={`trend__key${isHidden ? ' trend__key--off' : ''}`}
              onClick={() => toggle(symbol)}
              aria-pressed={!isHidden}
            >
              <FuelMark symbol={symbol} />
              {symbol}
              <span className="trend__key-name">{FUEL_META[symbol].name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
