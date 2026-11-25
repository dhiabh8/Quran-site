import { useEffect, useState } from 'react'

export function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return initialValue
      const parsed = JSON.parse(stored) as T

      // Merge saved objects with defaults so newly added settings are picked up.
      if (
        !Array.isArray(initialValue) &&
        initialValue !== null &&
        typeof initialValue === 'object' &&
        parsed !== null &&
        typeof parsed === 'object'
      ) {
        return { ...initialValue, ...parsed } as T
      }

      return parsed
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage may be unavailable in private browsing; ignore.
    }
  }, [key, value])

  return [value, setValue] as const
}
