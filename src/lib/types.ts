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

export type FeelingId =
  | 'sad'
  | 'anxious'
  | 'grateful'
  | 'lost'
  | 'hopeful'
  | 'peace'
  | 'afraid'
  | 'lonely'
  | 'overwhelmed'
  | 'repentant'

export interface FeelingInfo {
  id: FeelingId
  label: string
  arabic: string
  description: string
  descriptionAr: string
  intro: string
  introAr: string
}

export interface FeelingPassageContent {
  refs: VerseRef[]
  theme: string
  themeAr: string
  note: string
  noteAr: string
}

export type View =
  | 'home'
  | 'surahs'
  | 'juz'
  | 'tasbih'
  | 'bookmarks'
  | 'reader'
  | 'feelings'
  | 'khatmahs'
  | 'khatmah'

/** A verified Qur'anic reference: surah number (1-114) and ayah within it. */
export interface VerseRef {
  surah: number
  ayah: number
}

/** Arabic and translation fetched from api.alquran.cloud for a VerseRef. */
export interface VerseLookup extends VerseRef {
  number: number
  arabic: string
  translation: string
  surahName: string
  surahNameArabic: string
}

export type TafsirSourceId = 'ibnkathir' | 'saadi' | 'tabari' | 'muyassar'

export interface TafsirSource {
  id: TafsirSourceId
  name: string
  author: string
  resourceId: number
}

export interface TafsirEntry {
  sourceId: TafsirSourceId
  surah: number
  ayah: number
  sourceName: string
  text: string
}

export interface Settings {
  theme: Theme
  arabicFontSize: number
  showTranslation: boolean
  showTransliteration: boolean
  reciter: string
  tafsirSource: TafsirSourceId
}

export interface SearchResult {
  number: number
  surah: number
  surahName: string
  englishName: string
  ayah: number
  text: string
}
