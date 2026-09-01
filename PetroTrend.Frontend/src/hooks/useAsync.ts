import { useCallback, useEffect, useRef, useState } from 'react'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: unknown
  reload: () => void
}

/** Runs `fn` on mount and whenever `deps` change; the latest call always wins. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<Omit<AsyncState<T>, 'reload'>>({
    data: null,
    loading: true,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  // The caller's closure changes every render, so the effect keys off the deps instead.
  const latest = useRef(fn)
  const key = JSON.stringify(deps)

  useEffect(() => {
    latest.current = fn
  })

  useEffect(() => {
    let active = true
    // oxlint-disable-next-line set-state-in-effect -- the request is the external system here.
    setState((current) => ({ ...current, loading: true, error: null }))

    latest.current().then(
      (data) => {
        if (active) setState({ data, loading: false, error: null })
      },
      (error: unknown) => {
        if (active) setState({ data: null, loading: false, error })
      },
    )

    return () => {
      active = false
    }
  }, [key, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, reload }
}
