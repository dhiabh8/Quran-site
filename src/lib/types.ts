export type RevelationType = 'Meccan' | 'Medinan'

export interface SurahSummary {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: RevelationType
}

export interface Ayah {
  number: number
  numberInSurah: number
  text: string
  translation?: string
  transliteration?: string
  audio?: string
  juz: number
  page: number
  sajda: boolean | Record<string, unknown>
}

export interface SurahDetail {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  revelationType: RevelationType
  numberOfAyahs: number
  ayahs: Ayah[]
}

export interface JuzInfo {
  number: number
  firstSurah: SurahSummary
  firstAyah: number
  lastSurah: SurahSummary
  lastAyah: number
  ayahCount: number
}

export interface Bookmark {
  key: string
  surah: number
  ayah: number
  surahName: string
  arabic: string
  translation: string
  createdAt: number
}

export interface LastRead {
  surah: number
  ayah: number
  surahName: string
  timestamp: number
}

export type Theme = 'dark' | 'light'

export type View = 'home' | 'surahs' | 'juz' | 'tasbih' | 'bookmarks' | 'reader'

export interface Settings {
  theme: Theme
  arabicFontSize: number
  showTranslation: boolean
  showTransliteration: boolean
  reciter: string
}

export interface SearchResult {
  number: number
  surah: number
  surahName: string
  englishName: string
  ayah: number
  text: string
}
