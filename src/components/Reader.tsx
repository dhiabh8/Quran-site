import {
  Bookmark as BookmarkIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Headphones,
  Languages,
  LoaderCircle,
  Pause,
  Play,
  Type,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchSurah } from '../lib/api'
import type { Bookmark, Settings, SurahDetail, SurahSummary } from '../lib/types'

interface ReaderProps {
  surahNumber: number
  highlightAyah: number | null
  settings: Settings
  bookmarks: Bookmark[]
  playingAyah: number | null
  isPlaying: boolean
  onSurahLoaded: (surah: SurahDetail) => void
  onToggleBookmark: (bookmark: Omit<Bookmark, 'key' | 'createdAt'>) => void
  onPlayAyah: (ayah: number) => void
  onTogglePlayback: () => void
  onOpenSurah: (number: number) => void
  onToast: (message: string) => void
  onSettingChange: (patch: Partial<Settings>) => void
  surahs: SurahSummary[]
}

export function Reader({
  surahNumber,
  highlightAyah,
  settings,
  bookmarks,
  playingAyah,
  isPlaying,
  onSurahLoaded,
  onToggleBookmark,
  onPlayAyah,
  onTogglePlayback,
  onOpenSurah,
  onToast,
  onSettingChange,
  surahs,
}: ReaderProps) {
  const [surah, setSurah] = useState<SurahDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const scrollDone = useRef(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSurah(null)
    scrollDone.current = false
    fetchSurah(surahNumber, settings.reciter)
      .then((detail) => {
        if (!active) return
        setSurah(detail)
        onSurahLoaded(detail)
      })
      .catch(() => {
        if (active) setError('Could not load this surah. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // Reciter changes reload the ayah audio URLs with the new recitation.
  }, [surahNumber, settings.reciter, onSurahLoaded])

  useEffect(() => {
    if (loading || !surah || highlightAyah === null || scrollDone.current) return
    scrollDone.current = true
    const timer = window.setTimeout(() => {
      document.getElementById(`ayah-${highlightAyah}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)
    return () => window.clearTimeout(timer)
  }, [loading, surah, highlightAyah])

  if (loading) {
    return (
      <div className="page reader-page">
        <div className="reader-loading">
          <LoaderCircle className="spin" size={30} />
          <span>Loading surah...</span>
        </div>
      </div>
    )
  }

  if (error || !surah) {
    return (
      <div className="page">
        <div className="empty-state empty-state--large">
          <Headphones size={30} />
          <h3>{error || 'Surah not found'}</h3>
        </div>
      </div>
    )
  }

  const index = surahs.findIndex((item) => item.number === surahNumber)
  const previous = index > 0 ? surahs[index - 1] : null
  const next = index >= 0 && index < surahs.length - 1 ? surahs[index + 1] : null
  const showBismillah = surahNumber !== 1 && surahNumber !== 9

  const handleCopy = async (ayah: SurahDetail['ayahs'][number]) => {
    const text = `${ayah.text}\n\n${ayah.translation || ''}\n\n— ${surah.englishName} ${ayah.numberInSurah}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(ayah.numberInSurah)
      window.setTimeout(() => setCopied(null), 1800)
      onToast('Ayah copied to clipboard')
    } catch {
      onToast('Could not copy ayah')
    }
  }

  return (
    <div className="page reader-page">
      <div className="reader-nav">
        <button disabled={!previous} onClick={() => previous && onOpenSurah(previous.number)}>
          <ChevronLeft size={16} />
          <span>{previous ? previous.englishName : 'Beginning'}</span>
        </button>
        <button disabled={!next} onClick={() => next && onOpenSurah(next.number)}>
          <span>{next ? next.englishName : 'End'}</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <header className="reader-header">
        <p className="reader-arabic-name" dir="rtl">{surah.name}</p>
        <h1 className="reader-english-name">{surah.englishName}</h1>
        <p className="reader-meaning">{surah.englishNameTranslation}</p>
        <div className="reader-meta">
          <span className="meta-pill">{surah.revelationType}</span>
          <span>{surah.numberOfAyahs} ayahs</span>
          <span className="meta-divider" />
          <span>Juz {surah.ayahs[0]?.juz}</span>
          <span className="meta-divider" />
          <span>Page {surah.ayahs[0]?.page}</span>
        </div>

        <div className="reader-tools">
          <button className="reader-tool reader-tool--primary" onClick={onTogglePlayback}>
            {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            {isPlaying ? 'Pause recitation' : 'Play recitation'}
          </button>
          <button
            className={`reader-tool ${settings.showTranslation ? 'reader-tool--active' : ''}`}
            onClick={() => onSettingChange({ showTranslation: !settings.showTranslation })}
          >
            <Languages size={17} /> Translation
          </button>
          <button
            className={`reader-tool ${settings.showTransliteration ? 'reader-tool--active' : ''}`}
            onClick={() => onSettingChange({ showTransliteration: !settings.showTransliteration })}
          >
            <Type size={17} /> Transliteration
          </button>
        </div>
      </header>

      {showBismillah && (
        <div className="bismillah-banner" dir="rtl">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </div>
      )}

      <div className="ayah-list">
        {surah.ayahs.map((ayah) => {
          const isBookmarked = bookmarks.some((item) => item.key === `${surahNumber}:${ayah.numberInSurah}`)
          const highlighted = highlightAyah === ayah.numberInSurah || playingAyah === ayah.numberInSurah
          return (
            <article
              id={`ayah-${ayah.numberInSurah}`}
              key={ayah.number}
              className={`ayah-card ${highlighted ? 'ayah-card--highlight' : ''} ${playingAyah === ayah.numberInSurah ? 'ayah-card--playing' : ''}`}
            >
              <div className="ayah-actions">
                <button
                  onClick={() => onPlayAyah(ayah.numberInSurah)}
                  title={playingAyah === ayah.numberInSurah && isPlaying ? 'Pause' : 'Play this ayah'}
                  aria-label="Play ayah"
                >
                  {playingAyah === ayah.numberInSurah && isPlaying ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button
                  className={isBookmarked ? 'action-active' : ''}
                  onClick={() =>
                    onToggleBookmark({
                      surah: surahNumber,
                      ayah: ayah.numberInSurah,
                      surahName: surah.englishName,
                      arabic: ayah.text,
                      translation: ayah.translation || '',
                    })
                  }
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark ayah'}
                  aria-label="Bookmark ayah"
                >
                  <BookmarkIcon size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleCopy(ayah)}
                  title="Copy ayah"
                  aria-label="Copy ayah"
                >
                  {copied === ayah.numberInSurah ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>

              <p className="ayah-arabic" dir="rtl" style={{ fontSize: `${settings.arabicFontSize}px` }}>
                {ayah.text}
              </p>

              {settings.showTransliteration && ayah.transliteration && (
                <p className="ayah-transliteration">{ayah.transliteration}</p>
              )}

              {settings.showTranslation && ayah.translation && (
                <p className="ayah-translation">{ayah.translation}</p>
              )}

              <div className="ayah-footer">
                <span className="ayah-number">{ayah.numberInSurah}</span>
                {typeof ayah.sajda === 'object' && <span className="sajda-pill">Sajdah</span>}
                <span className="ayah-location">Juz {ayah.juz} · Page {ayah.page}</span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="reader-end">
        <p className="reader-end-arabic" dir="rtl">صَدَقَ ٱللَّهُ ٱلْعَظِيمُ</p>
        <span>Allah the Most High has spoken the truth.</span>
        <div className="reader-end-actions">
          {previous && <button onClick={() => onOpenSurah(previous.number)}>← {previous.englishName}</button>}
          {next && <button onClick={() => onOpenSurah(next.number)}>{next.englishName} →</button>}
        </div>
      </div>
    </div>
  )
}
