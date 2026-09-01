import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    panel.current?.querySelector<HTMLElement>('input, select, button')?.focus()

    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel" ref={panel} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Zamknij">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
