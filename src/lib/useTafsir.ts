import { useEffect, useState } from 'react'
import { fetchTafsir } from './api'
import type { TafsirEntry, TafsirSourceId } from './types'

interface TafsirState {
  entry: TafsirEntry | null
  loading: boolean
  error: string
}

const EMPTY_STATE: TafsirState = { entry: null, loading: false, error: '' }

export function useTafsir(
  sourceId: TafsirSourceId,
  surah: number | null,
  ayah: number | null,
): TafsirState & { reload: () => void } {
  const [state, setState] = useState<TafsirState>(EMPTY_STATE)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (surah === null || ayah === null) {
      setState(EMPTY_STATE)
      return
    }

    let active = true
    setState({ entry: null, loading: true, error: '' })

    fetchTafsir(sourceId, surah, ayah)
      .then((entry) => {
        if (active) setState({ entry, loading: false, error: '' })
      })
      .catch(() => {
        if (active) setState({ entry: null, loading: false, error: 'تعذّر تحميل التفسير. حاول مرة أخرى.' })
      })

    return () => {
      active = false
    }
  }, [sourceId, surah, ayah, attempt])

  return { ...state, reload: () => setAttempt((value) => value + 1) }
}
