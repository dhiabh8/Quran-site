import type { LastRead } from './types'

export const READING_PROGRESS_KEY = 'noor.readingProgress.v1'

export interface ReadingActivityDay {
  date: string // local YYYY-MM-DD
  surah: number
  ayah: number
  surahName: string
  updatedAt: number
}

export interface KhatmahPlan {
  id: string
  createdAt: number
  startDate: string // local YYYY-MM-DD
  targetDays: number
  currentSurah: number
  currentAyah: number
  currentSurahName: string
  status: 'active' | 'completed'
  completedAt?: number
}

export interface KhatmahCompletion {
  id: string
  planId: string
  completedAt: number
  startDate: string
  endDate: string
  targetDays: number
}

export interface ReadingProgressState {
  version: 1
  activityByDate: Record<string, ReadingActivityDay>
  lastPosition: LastRead | null
  khatmah: {
    activePlan: KhatmahPlan | null
    completed: KhatmahCompletion[]
  }
}

export interface ReadingProgressStorage {
  load: () => ReadingProgressState
  save: (state: ReadingProgressState) => void
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDefaultReadingProgress(): ReadingProgressState {
  return {
    version: 1,
    activityByDate: {},
    lastPosition: null,
    khatmah: {
      activePlan: null,
      completed: [],
    },
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asPositiveInt(value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const rounded = Math.floor(value)
  if (rounded < 1) return fallback
  return Math.min(rounded, max)
}

function asNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const rounded = Math.floor(value)
  if (rounded < 0) return fallback
  return rounded
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function sanitizeLastPosition(value: unknown): LastRead | null {
  if (!isObject(value)) return null
  const surah = asPositiveInt(value.surah, 0, 114)
  const ayah = asPositiveInt(value.ayah, 0, 286)
  const timestamp = asNonNegativeInt(value.timestamp, 0)
  const surahName = asString(value.surahName).trim()
  if (!surah || !ayah || !surahName) return null
  return { surah, ayah, surahName, timestamp: timestamp || Date.now() }
}

function sanitizeActivityDay(value: unknown): ReadingActivityDay | null {
  if (!isObject(value)) return null
  const date = isDateKey(value.date) ? value.date : null
  const surah = asPositiveInt(value.surah, 0, 114)
  const ayah = asPositiveInt(value.ayah, 0, 286)
  const surahName = asString(value.surahName).trim()
  const updatedAt = asNonNegativeInt(value.updatedAt, 0)
  if (!date || !surah || !ayah || !surahName) return null
  return { date, surah, ayah, surahName, updatedAt: updatedAt || Date.now() }
}

function sanitizePlan(value: unknown): KhatmahPlan | null {
  if (!isObject(value)) return null
  const id = asString(value.id).trim()
  const createdAt = asNonNegativeInt(value.createdAt, 0)
  const startDate = isDateKey(value.startDate) ? value.startDate : null
  const targetDays = asPositiveInt(value.targetDays, 30, 3650)
  const currentSurah = asPositiveInt(value.currentSurah, 1, 114)
  const currentAyah = asPositiveInt(value.currentAyah, 1, 286)
  const currentSurahName = asString(value.currentSurahName, 'Al-Faatiha').trim() || 'Al-Faatiha'
  const status = value.status === 'completed' ? 'completed' : value.status === 'active' ? 'active' : null
  const completedAt = asNonNegativeInt(value.completedAt, 0)
  if (!id || !createdAt || !startDate || !status) return null
  return {
    id,
    createdAt,
    startDate,
    targetDays,
    currentSurah,
    currentAyah,
    currentSurahName,
    status,
    ...(completedAt ? { completedAt } : {}),
  }
}

function sanitizeCompletion(value: unknown): KhatmahCompletion | null {
  if (!isObject(value)) return null
  const id = asString(value.id).trim()
  const planId = asString(value.planId).trim()
  const completedAt = asNonNegativeInt(value.completedAt, 0)
  const startDate = isDateKey(value.startDate) ? value.startDate : null
  const endDate = isDateKey(value.endDate) ? value.endDate : null
  const targetDays = asPositiveInt(value.targetDays, 30, 3650)
  if (!id || !planId || !completedAt || !startDate || !endDate) return null
  return { id, planId, completedAt, startDate, endDate, targetDays }
}

export function sanitizeReadingProgress(value: unknown): ReadingProgressState {
  const defaults = createDefaultReadingProgress()
  if (!isObject(value)) return defaults

  const activityByDate: Record<string, ReadingActivityDay> = {}
  if (isObject(value.activityByDate)) {
    for (const [key, entry] of Object.entries(value.activityByDate)) {
      if (!isDateKey(key)) continue
      const sanitized = sanitizeActivityDay(entry)
      if (sanitized && sanitized.date === key) activityByDate[key] = sanitized
    }
  }

  const khatmahRaw = isObject(value.khatmah) ? value.khatmah : {}
  const activePlan = sanitizePlan(khatmahRaw.activePlan)
  const completed = Array.isArray(khatmahRaw.completed)
    ? khatmahRaw.completed.map(sanitizeCompletion).filter((item): item is KhatmahCompletion => Boolean(item)).slice(0, 100)
    : []

  return {
    version: 1,
    activityByDate,
    lastPosition: sanitizeLastPosition(value.lastPosition),
    khatmah: {
      activePlan: activePlan?.status === 'active' ? activePlan : null,
      completed,
    },
  }
}

export const localReadingProgressStorage: ReadingProgressStorage = {
  load() {
    if (typeof window === 'undefined') return createDefaultReadingProgress()
    try {
      const raw = window.localStorage.getItem(READING_PROGRESS_KEY)
      if (!raw) return createDefaultReadingProgress()
      return sanitizeReadingProgress(JSON.parse(raw))
    } catch {
      return createDefaultReadingProgress()
    }
  },
  save(state) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage failures (private mode/quota).
    }
  },
}

export function calculateStreak(activityByDate: Record<string, ReadingActivityDay>, today = new Date()): { current: number; best: number } {
  const dates = new Set(Object.keys(activityByDate))
  const dayMs = 86_400_000
  const toUtcDay = (key: string) => {
    const [y, m, d] = key.split('-').map(Number)
    return Math.floor(Date.UTC(y, m - 1, d) / dayMs)
  }

  let current = 0
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (;;) {
    const key = getLocalDateKey(cursor)
    if (!dates.has(key)) break
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  const sortedDays = Array.from(dates).sort().map(toUtcDay)
  let best = 0
  let run = 0
  let prev: number | null = null
  for (const day of sortedDays) {
    run = prev !== null && day === prev + 1 ? run + 1 : 1
    if (run > best) best = run
    prev = day
  }
  return { current, best }
}

export function hasReadToday(activityByDate: Record<string, ReadingActivityDay>, today = new Date()): boolean {
  return Boolean(activityByDate[getLocalDateKey(today)])
}

export function recordReadingActivity(
  state: ReadingProgressState,
  position: { surah: number; ayah: number; surahName: string },
  timestamp = Date.now(),
): ReadingProgressState {
  const date = getLocalDateKey(new Date(timestamp))
  const existing = state.activityByDate[date]
  const lastPosition: LastRead = {
    surah: position.surah,
    ayah: position.ayah,
    surahName: position.surahName,
    timestamp,
  }
  // Prevent duplicate date entries: update the same date key.
  const activityByDate = {
    ...state.activityByDate,
    [date]: {
      date,
      surah: position.surah,
      ayah: position.ayah,
      surahName: position.surahName,
      updatedAt: timestamp,
    },
  }

  let activePlan = state.khatmah.activePlan
  if (activePlan && activePlan.status === 'active') {
    activePlan = {
      ...activePlan,
      currentSurah: position.surah,
      currentAyah: position.ayah,
      currentSurahName: position.surahName,
    }
  }

  // Avoid unnecessary state churn.
  if (
    existing &&
    existing.surah === position.surah &&
    existing.ayah === position.ayah &&
    existing.surahName === position.surahName &&
    state.lastPosition?.surah === position.surah &&
    state.lastPosition?.ayah === position.ayah &&
    state.lastPosition?.surahName === position.surahName &&
    state.khatmah.activePlan?.currentSurah === activePlan?.currentSurah &&
    state.khatmah.activePlan?.currentAyah === activePlan?.currentAyah
  ) {
    return state
  }

  return {
    ...state,
    activityByDate,
    lastPosition,
    khatmah: { ...state.khatmah, activePlan },
  }
}

export function startKhatmah(
  state: ReadingProgressState,
  targetDays: number,
  position: { surah: number; ayah: number; surahName: string },
  now = Date.now(),
): ReadingProgressState {
  const plan: KhatmahPlan = {
    id: `khatmah-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    startDate: getLocalDateKey(new Date(now)),
    targetDays: Math.max(1, Math.min(3650, Math.floor(targetDays))),
    currentSurah: position.surah,
    currentAyah: position.ayah,
    currentSurahName: position.surahName,
    status: 'active',
  }
  return { ...state, khatmah: { ...state.khatmah, activePlan: plan } }
}

export function completeKhatmah(state: ReadingProgressState, now = Date.now()): ReadingProgressState {
  const plan = state.khatmah.activePlan
  if (!plan) return state
  const endDate = getLocalDateKey(new Date(now))
  const completion: KhatmahCompletion = {
    id: `khatmah-complete-${now}`,
    planId: plan.id,
    completedAt: now,
    startDate: plan.startDate,
    endDate,
    targetDays: plan.targetDays,
  }
  return {
    ...state,
    khatmah: {
      activePlan: null,
      completed: [completion, ...state.khatmah.completed].slice(0, 100),
    },
  }
}

export function abandonKhatmah(state: ReadingProgressState): ReadingProgressState {
  if (!state.khatmah.activePlan) return state
  return { ...state, khatmah: { ...state.khatmah, activePlan: null } }
}
