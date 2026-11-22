import type { Ayah, JuzInfo, SearchResult, SurahDetail, SurahSummary } from './types'

const BASE = 'https://api.alquran.cloud/v1'

export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Al-Afasy', native: 'مشاري العفاسي' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdur-Rahman As-Sudais', native: 'عبدالرحمن السديس' },
  { id: 'ar.husary', name: 'Mahmoud Al-Husary', native: 'محمود خليل الحصري' },
  { id: 'ar.minshawi', name: 'Muhammad Siddiq Al-Minshawi', native: 'محمد صديق المنشاوي' },
] as const

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Unable to load Quran data (${response.status})`)
  }
  const json = await response.json()
  if (json.code !== 200) {
    throw new Error(json.data || 'Unable to load Quran data')
  }
  return json.data as T
}

export async function fetchSurahs(): Promise<SurahSummary[]> {
  return getJson<SurahSummary[]>('/surah')
}

interface ApiEdition {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  revelationType: string
  numberOfAyahs: number
  ayahs: Array<{
    number: number
    numberInSurah: number
    text: string
    audio?: string
    juz: number
    page: number
    sajda: boolean | Record<string, unknown>
  }>
}

export async function fetchSurah(number: number, reciter: string): Promise<SurahDetail> {
  const editions = `quran-uthmani,en.sahih,en.transliteration,${reciter}`
  const data = await getJson<ApiEdition[]>(`/surah/${number}/editions/${editions}`)
  const [arabic, translation, transliteration, audio] = data

  const ayahs: Ayah[] = arabic.ayahs.map((ayah, index) => ({
    number: ayah.number,
    numberInSurah: ayah.numberInSurah,
    text: ayah.text.replace(/^\uFEFF/, '').trim(),
    translation: translation?.ayahs[index]?.text,
    transliteration: transliteration?.ayahs[index]?.text,
    audio: audio?.ayahs[index]?.audio,
    juz: ayah.juz,
    page: ayah.page,
    sajda: ayah.sajda,
  }))

  return {
    number: arabic.number,
    name: arabic.name,
    englishName: arabic.englishName,
    englishNameTranslation: arabic.englishNameTranslation,
    revelationType: arabic.revelationType as SurahDetail['revelationType'],
    numberOfAyahs: arabic.numberOfAyahs,
    ayahs,
  }
}

export async function fetchAudioForSurah(number: number, reciter: string): Promise<string[]> {
  const data = await getJson<ApiEdition>(`/surah/${number}/${reciter}`)
  return data.ayahs.map((ayah) => ayah.audio || '')
}

interface JuzApiResponse {
  number: number
  ayahs: Array<{
    number: number
    numberInSurah: number
    surah: SurahSummary
  }>
}

export async function fetchJuz(number: number): Promise<JuzInfo> {
  const data = await getJson<JuzApiResponse>(`/juz/${number}`)
  const first = data.ayahs[0]
  const last = data.ayahs[data.ayahs.length - 1]
  return {
    number,
    firstSurah: first.surah,
    firstAyah: first.numberInSurah,
    lastSurah: last.surah,
    lastAyah: last.numberInSurah,
    ayahCount: data.ayahs.length,
  }
}

interface FullQuranResponse {
  surahs: Array<{
    number: number
    englishName: string
    ayahs: Array<{ numberInSurah: number; text: string }>
  }>
}

let translationCache: SearchResult[] | null = null

export async function searchQuran(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  if (!translationCache) {
    const data = await getJson<FullQuranResponse>('/quran/en.sahih')
    translationCache = data.surahs.flatMap((surah) =>
      surah.ayahs.map((ayah) => ({
        number: ayah.numberInSurah,
        surah: surah.number,
        surahName: surah.englishName,
        englishName: surah.englishName,
        ayah: ayah.numberInSurah,
        text: ayah.text,
      })),
    )
  }

  return translationCache
    .filter((result) => result.text.toLowerCase().includes(q))
    .slice(0, 40)
}

export function filterSurahs(surahs: SurahSummary[], query: string): SurahSummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return surahs
  return surahs.filter(
    (surah) =>
      surah.englishName.toLowerCase().includes(q) ||
      surah.englishNameTranslation.toLowerCase().includes(q) ||
      surah.name.includes(query.trim()) ||
      String(surah.number) === q,
  )
}
