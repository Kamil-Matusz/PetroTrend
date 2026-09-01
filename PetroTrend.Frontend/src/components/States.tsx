import type { ReactNode } from 'react'
import { describeError } from '../lib/errors'
import './States.css'

export function Loading({ label = 'Pobieranie danych' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="state__pump" aria-hidden="true" />
      <p className="state__text">{label}…</p>
    </div>
  )
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="state">
      <p className="state__title">{title}</p>
      {hint && <p className="state__text">{hint}</p>}
      {action}
    </div>
  )
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">Nie udało się pobrać danych</p>
      <p className="state__text">{describeError(error)}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Spróbuj ponownie
        </button>
      )}
    </div>
  )
}

export function Banner({ error, onDismiss }: { error: unknown; onDismiss?: () => void }) {
  return (
    <div className="banner" role="alert">
      <span className="banner__text">{describeError(error)}</span>
      {onDismiss && (
        <button type="button" className="banner__close" onClick={onDismiss} aria-label="Zamknij komunikat">
          ×
        </button>
      )}
    </div>
  )
}
