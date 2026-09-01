import { useMemo, useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Currency, FuelPriceResponse, FuelSymbol } from '../api/types'
import { FUEL_SYMBOLS } from '../api/types'
import { CURRENCY_SUFFIX, FUEL_META } from '../lib/fuel'
import {
  formatDayLong,
  formatDayShort,
  formatIndex,
  formatMonth,
  formatMonthShort,
  formatPrice,
  formatSigned,
  formatSignedPercent,
} from '../lib/format'
import type { Pair, TrendMode } from '../lib/trend'
import {
  MODE_LABELS,
  SPREAD_PAIRS,
  pairLabel,
  pivotLevels,
  toChange,
  toIndexed,
  toSpread,
} from '../lib/trend'
import { Empty } from './States'
import { FuelMark } from './FuelChip'
import './TrendChart.css'

/** Signed value with ▲/▼ plus screen-reader text - direction never rests on colour alone. */
function Delta({ value }: { value: number }) {
  const tone = value === 0 ? 'flat' : value > 0 ? 'up' : 'down'

  return (
    <span className={`num trend__tip-value trend__tip-value--${tone}`}>
      {value !== 0 && <span aria-hidden="true">{value > 0 ? '▲' : '▼'}</span>}
      <span className="sr-only">{value === 0 ? 'bez zmian' : value > 0 ? 'wzrost' : 'spadek'}</span>
      {formatSigned(value)}
    </span>
  )
}

type TooltipProps = {
  active?: boolean
  label?: string | number
  payload?: { dataKey?: string | number; value?: number }[]
  mode?: TrendMode
  pair?: Pair
  monthly?: boolean
}

function ChartTooltip({ active, label, payload, mode, pair, monthly }: TooltipProps) {
  if (!active || !payload?.length || typeof label !== 'string' || !mode) return null

  const heading =
    mode !== 'change'
      ? formatDayLong(label)
      : monthly
        ? formatMonth(label)
        : `tydzień od ${formatDayShort(label)}`

  return (
    <div className="trend__tip">
      <p className="trend__tip-date">{heading}</p>
      <ul className="trend__tip-list">
        {mode === 'spread' && pair ? (
          <li>
            <FuelMark symbol={pair.a} size={10} />
            <span className="trend__tip-symbol">{pairLabel(pair)}</span>
            <Delta value={payload[0]?.value ?? 0} />
          </li>
        ) : (
          payload.map((entry) => {
            const symbol = entry.dataKey as FuelSymbol
            const value = entry.value ?? 0
            return (
              <li key={symbol}>
                <FuelMark symbol={symbol} size={10} />
                <span className="trend__tip-symbol">{symbol}</span>
                {mode === 'change' ? (
                  <Delta value={value} />
                ) : mode === 'index' ? (
                  <span className="num trend__tip-value">
                    {formatIndex(value)}
                    <span className="trend__tip-aside">{formatSignedPercent(value / 100 - 1)}</span>
                  </span>
                ) : (
                  <span className="num trend__tip-value">{formatPrice(value)}</span>
                )}
              </li>
            )
          })
        )}
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

const AXIS_TICK = { fill: '#64757f', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }

export function TrendChart({ rows, currency }: { rows: FuelPriceResponse[]; currency: Currency }) {
  const [mode, setMode] = useState<TrendMode>('level')
  const [hidden, setHidden] = useState<FuelSymbol[]>([])
  const [pairKey, setPairKey] = useState<string | null>(null)

  const { levels, present, monthly } = useMemo(() => pivotLevels(rows), [rows])

  const pairs = useMemo(
    () => SPREAD_PAIRS.filter((p) => present.includes(p.a) && present.includes(p.b)),
    [present],
  )
  const pair = pairs.find((p) => p.key === pairKey) ?? pairs[0]

  const data = useMemo(() => {
    if (mode === 'index') return toIndexed(levels, present)
    if (mode === 'spread') return pair ? toSpread(levels, pair) : []
    if (mode === 'change') return toChange(levels, present, monthly)
    return levels
  }, [mode, levels, present, pair, monthly])

  const lastIndex = useMemo(() => {
    const map: Partial<Record<FuelSymbol, number>> = {}
    data.forEach((row, i) => {
      for (const symbol of FUEL_SYMBOLS) if (row[symbol] != null) map[symbol] = i
    })
    return map
  }, [data])

  const visible = present.filter((symbol) => !hidden.includes(symbol))
  const sparse = data.length <= 31
  const isLine = mode === 'level' || mode === 'index'

  const tickFormat = mode === 'index' ? formatIndex : mode === 'change' ? formatSigned : formatPrice
  const dayFormat = mode === 'change' && monthly ? formatMonthShort : formatDayShort

  const unit =
    mode === 'index'
      ? 'indeks · start okna = 100'
      : mode === 'change'
        ? `Δ ${CURRENCY_SUFFIX[currency]} · zmiana ${monthly ? 'miesięczna' : 'tygodniowa'}`
        : CURRENCY_SUFFIX[currency]

  const toggle = (symbol: FuelSymbol) =>
    setHidden((current) =>
      current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol],
    )

  return (
    <div className="trend">
      <div className="trend__modes" role="group" aria-label="Tryb wykresu">
        {(Object.keys(MODE_LABELS) as TrendMode[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`trend__mode${key === mode ? ' trend__mode--on' : ''}`}
            onClick={() => setMode(key)}
            aria-pressed={key === mode}
          >
            {MODE_LABELS[key]}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <Empty
          title={
            mode === 'spread'
              ? 'Brak pary do porównania'
              : `Za krótka historia na zmianę ${monthly ? 'miesięczną' : 'tygodniową'}`
          }
          hint={
            mode === 'spread'
              ? 'Spread wymaga dwóch gatunków notowanych w tym oknie.'
              : `Potrzebne są odczyty z co najmniej dwóch ${monthly ? 'miesięcy' : 'tygodni'}.`
          }
        />
      ) : (
        <div className="trend__plot">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 12, right: isLine ? 56 : 16, bottom: 4, left: 0 }}
              barGap={2}
              barCategoryGap="22%"
            >
              <CartesianGrid stroke="#1c2630" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={dayFormat}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: '#232e38' }}
                minTickGap={44}
              />
              <YAxis
                width={56}
                domain={['auto', 'auto']}
                tickFormatter={tickFormat}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip mode={mode} pair={pair} monthly={monthly} />}
                cursor={
                  mode === 'change'
                    ? { fill: 'rgba(255, 176, 32, 0.07)' }
                    : { stroke: '#ffb020', strokeWidth: 1, strokeDasharray: '3 3' }
                }
              />

              {mode === 'index' && <ReferenceLine y={100} stroke="#3a4753" strokeDasharray="4 4" />}
              {(mode === 'spread' || mode === 'change') && <ReferenceLine y={0} stroke="#3a4753" />}

              {mode === 'spread' && (
                <Area
                  type="monotone"
                  dataKey="spread"
                  stroke="#ffb020"
                  strokeWidth={2}
                  fill="#ffb020"
                  fillOpacity={0.12}
                  dot={sparse ? { r: 2.5, fill: '#ffb020', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#ffb020', stroke: '#141b22', strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                />
              )}

              {mode === 'change' &&
                visible.map((symbol) => (
                  <Bar
                    key={symbol}
                    dataKey={symbol}
                    name={symbol}
                    fill={FUEL_META[symbol].color}
                    radius={2}
                    isAnimationActive={false}
                  />
                ))}

              {isLine &&
                visible.map((symbol) => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    name={symbol}
                    stroke={FUEL_META[symbol].color}
                    strokeWidth={2}
                    dot={sparse ? { r: 2.5, fill: FUEL_META[symbol].color, strokeWidth: 0 } : false}
                    activeDot={{
                      r: 5,
                      fill: FUEL_META[symbol].color,
                      stroke: '#141b22',
                      strokeWidth: 2,
                    }}
                    connectNulls
                    isAnimationActive={false}
                  >
                    <LabelList dataKey={symbol} content={endLabel(symbol, lastIndex[symbol])} />
                  </Line>
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="trend__legend">
        <span className="trend__unit num">{unit}</span>

        {mode === 'spread'
          ? pairs.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`trend__key${option.key === pair?.key ? '' : ' trend__key--off'}`}
                onClick={() => setPairKey(option.key)}
                aria-pressed={option.key === pair?.key}
              >
                <FuelMark symbol={option.a} />
                <FuelMark symbol={option.b} />
                {pairLabel(option)}
              </button>
            ))
          : present.map((symbol) => {
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
