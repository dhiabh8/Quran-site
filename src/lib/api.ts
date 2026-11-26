import type {
  Ayah,
  JuzInfo,
  SearchResult,
  SurahDetail,
  SurahSummary,
  TafsirEntry,
  TafsirSource,
  TafsirSourceId,
  VerseLookup,
  VerseRef,
} from './types'

const BASE = 'https://api.alquran.cloud/v1'
const TAFSIR_BASE = 'https://api.quran.com/api/v4'

export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Al-Afasy', native: 'مشاري العفاسي' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdur-Rahman As-Sudais', native: 'عبدالرحمن السديس' },
  { id: 'ar.husary', name: 'Mahmoud Al-Husary', native: 'محمود خليل الحصري' },
  { id: 'ar.minshawi', name: 'Muhammad Siddiq Al-Minshawi', native: 'محمد صديق المنشاوي' },
] as const

export const TAFSIR_SOURCES: TafsirSource[] = [
  { id: 'ibnkathir', name: 'تفسير ابن كثير', author: 'الحافظ ابن كثير', resourceId: 14 },
  { id: 'saadi', name: 'تفسير السعدي', author: 'عبد الرحمن السعدي', resourceId: 91 },
  { id: 'tabari', name: 'تفسير الطبري', author: 'الإمام الطبري', resourceId: 15 },
  { id: 'muyassar', name: 'التفسير الميسّر', author: 'مجمع الملك فهد لطباعة المصحف', resourceId: 16 },
]

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

interface AyahEdition {
  number: number
  text: string
  surah: { number: number; name: string; englishName: string }
}

const verseCache = new Map<string, VerseLookup>()

/**
 * Fetches verified Arabic (Uthmani) and Saheeh International translation for
 * curated references. Text always comes from the API — never from local data.
 */
export async function fetchVerses(refs: VerseRef[]): Promise<VerseLookup[]> {
  const unique = new Map<string, VerseRef>()
  for (const ref of refs) unique.set(`${ref.surah}:${ref.ayah}`, ref)

  await Promise.all(
    Array.from(unique.values()).map(async (ref) => {
      const key = `${ref.surah}:${ref.ayah}`
      if (verseCache.has(key)) return

      const data = await getJson<AyahEdition[]>(
        `/ayah/${ref.surah}:${ref.ayah}/editions/quran-uthmani,en.sahih`,
      )
      const [arabic, translation] = data
      if (!arabic || !translation || !arabic.text?.trim() || !translation.text?.trim()) {
        throw new Error(`No verified text for ${key}`)
      }

      verseCache.set(key, {
        surah: ref.surah,
        ayah: ref.ayah,
        number: arabic.number,
        arabic: arabic.text.replace(/^\uFEFF/, '').trim(),
        translation: translation.text.trim(),
        surahName: arabic.surah.englishName,
        surahNameArabic: arabic.surah.name.replace(/^سُورَةُ\s*/, '').trim(),
      })
    }),
  )

  return refs
    .map((ref) => verseCache.get(`${ref.surah}:${ref.ayah}`))
    .filter((verse): verse is VerseLookup => Boolean(verse))
}

/** Audio URL for a single verse, using the same reciter editions as the reader. */
export async function fetchAudioForAyah(ref: VerseRef, reciter: string): Promise<string> {
  const data = await getJson<{ audio?: string }>(`/ayah/${ref.surah}:${ref.ayah}/${reciter}`)
  if (!data.audio) throw new Error('Audio is unavailable for this verse')
  return data.audio
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

export function tafsirTextToPlain(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const paragraphs = Array.from(doc.body.querySelectorAll('p'))
      .map((node) => node.textContent?.trim() || '')
      .filter(Boolean)
    const text = paragraphs.length > 0 ? paragraphs.join('\n\n') : doc.body.textContent?.trim() || ''
    return text.replace(/\n{3,}/g, '\n\n').trim()
  }

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface TafsirApiResponse {
  tafsir?: {
    text?: string
    resource_name?: string
    verses?: Record<string, { id: number }>
  }
}

const tafsirCache = new Map<string, TafsirEntry>()

export async function fetchTafsir(
  sourceId: TafsirSourceId,
  surah: number,
  ayah: number,
): Promise<TafsirEntry> {
  const source = TAFSIR_SOURCES.find((item) => item.id === sourceId)
  if (!source) throw new Error('Unknown tafsir source')

  const key = `${sourceId}:${surah}:${ayah}`
  const cached = tafsirCache.get(key)
  if (cached) return cached

  const response = await fetch(`${TAFSIR_BASE}/tafsirs/${source.resourceId}/by_ayah/${surah}:${ayah}`)
  if (!response.ok) throw new Error(`Unable to load tafsir (${response.status})`)

  const json = (await response.json()) as TafsirApiResponse
  const text = tafsirTextToPlain(json.tafsir?.text || '')
  const entry: TafsirEntry = {
    sourceId,
    surah,
    ayah,
    sourceName: json.tafsir?.resource_name || source.name,
    text,
  }

  if (text) tafsirCache.set(key, entry)
  return entry
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
