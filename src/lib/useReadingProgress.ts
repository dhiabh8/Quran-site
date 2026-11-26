import { useCallback, useEffect, useState } from 'react'
import {
  abandonKhatmah,
  completeKhatmah,
  createDefaultReadingProgress,
  localReadingProgressStorage,
  recordReadingActivity,
  startKhatmah,
  type ReadingProgressState,
} from './readingProgress'

export function useReadingProgress() {
  const [state, setState] = useState<ReadingProgressState>(() => localReadingProgressStorage.load())

  useEffect(() => {
    localReadingProgressStorage.save(state)
  }, [state])

  const record = useCallback((position: { surah: number; ayah: number; surahName: string }) => {
    setState((current) => recordReadingActivity(current, position))
  }, [])

  const start = useCallback((targetDays: number, position: { surah: number; ayah: number; surahName: string }) => {
    setState((current) => startKhatmah(current, targetDays, position))
  }, [])

  const complete = useCallback(() => {
    setState((current) => completeKhatmah(current))
  }, [])

  const abandon = useCallback(() => {
    setState((current) => abandonKhatmah(current))
  }, [])

  const ensureLastPosition = useCallback((position: { surah: number; ayah: number; surahName: string; timestamp: number }) => {
    setState((current) => {
      if (current.lastPosition) return current
      return {
        ...current,
        lastPosition: position,
      }
    })
  }, [])

  const reset = useCallback(() => setState(createDefaultReadingProgress()), [])

  return { state, record, start, complete, abandon, ensureLastPosition, reset }
}
