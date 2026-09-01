import type { RangeKey } from '../lib/range'
import { RANGE_LABELS } from '../lib/range'
import './RangeTabs.css'

export function RangeTabs({ value, onChange }: { value: RangeKey; onChange: (key: RangeKey) => void }) {
  return (
    <div className="range" role="group" aria-label="Zakres dat">
      {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
        <button
          key={key}
          type="button"
          className={`range__tab${key === value ? ' range__tab--on' : ''}`}
          onClick={() => onChange(key)}
          aria-pressed={key === value}
        >
          {RANGE_LABELS[key]}
        </button>
      ))}
    </div>
  )
}
