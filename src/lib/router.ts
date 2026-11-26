import type { View } from './types'

export interface Route {
  view: View
  khatmahRef?: string
  surah?: number
}

const VIEW_PATHS: Partial<Record<View, string>> = {
  home: '/',
  surahs: '/surahs',
  juz: '/juz',
  tasbih: '/tasbih',
  bookmarks: '/bookmarks',
  feelings: '/feelings',
  khatmahs: '/khatmah',
}

export function buildRoute(view: View, options?: { khatmahRef?: string; surah?: number }): string {
  if (view === 'khatmah') {
    return `/khatmah/${encodeURIComponent(options?.khatmahRef || '')}`
  }
  if (view === 'reader') {
    return `/reader/${options?.surah ?? 1}`
  }
  return VIEW_PATHS[view] ?? '/'
}

export function parseRoute(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/'
  const khatmahMatch = /^\/khatmah\/([^/]+)$/.exec(clean)
  if (khatmahMatch) {
    try {
      return { view: 'khatmah', khatmahRef: decodeURIComponent(khatmahMatch[1]) }
    } catch {
      return { view: 'khatmah', khatmahRef: khatmahMatch[1] }
    }
  }
  const readerMatch = /^\/reader\/(\d+)$/.exec(clean)
  if (readerMatch) {
    const surah = Number(readerMatch[1])
    if (surah >= 1 && surah <= 114) return { view: 'reader', surah }
  }

  for (const [view, path] of Object.entries(VIEW_PATHS)) {
    if (path === clean) return { view: view as View }
  }
  return { view: 'home' }
}

export function pushRoute(path: string) {
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
}
