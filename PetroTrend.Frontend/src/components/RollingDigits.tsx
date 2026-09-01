import { useMemo } from 'react'
import './RollingDigits.css'

const REEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
/** Three stacked copies of 0-9, so a digit can roll in from four slots below its home position. */
const SLOTS = REEL.concat(REEL, REEL)

function Reel({ digit, delay }: { digit: number; delay: number }) {
  return (
    <span className="roll__slot" aria-hidden="true">
      <span
        // Remounting on digit change replays the roll for exactly the digits that moved.
        key={digit}
        className="roll__reel"
        style={{ '--i': String(10 + digit), animationDelay: `${delay}ms` } as React.CSSProperties}
      >
        {SLOTS.map((d, i) => (
          <span key={i} className="roll__digit">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

/** Prices land the way a dispenser counter lands - each wheel rolling up into place. */
export function RollingDigits({ value }: { value: string }) {
  const chars = useMemo(() => {
    let position = 0
    return value.split('').map((char) => ({
      char,
      position: /\d/.test(char) ? position++ : -1,
    }))
  }, [value])

  return (
    <span className="roll">
      <span className="roll__value">{value}</span>
      {chars.map(({ char, position }, i) =>
        position < 0 ? (
          <span key={i} className="roll__sep" aria-hidden="true">
            {char}
          </span>
        ) : (
          <Reel key={i} digit={Number(char)} delay={position * 70} />
        ),
      )}
    </span>
  )
}
