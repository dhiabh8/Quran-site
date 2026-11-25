import {
  Bookmark as BookmarkIcon,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Headphones,
  Languages,
  LoaderCircle,
  Pause,
  Play,
  Share2,
  Type,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSurah } from '../lib/api'
import type { Bookmark, Settings, SurahDetail, SurahSummary } from '../lib/types'
import { useTafsir } from '../lib/useTafsir'
import { ShareCard } from './ShareCard'
import { TafsirPanel } from './TafsirPanel'

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
  onReadProgress: (surah: number, ayah: number) => void
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
  onReadProgress,
  onToast,
  onSettingChange,
  surahs,
}: ReaderProps) {
  const [surah, setSurah] = useState<SurahDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null)
  const [tafsirOpen, setTafsirOpen] = useState(false)
  const [tafsirClosing, setTafsirClosing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const scrollDone = useRef(false)
  const lastProgress = useRef(0)
  const closeTimer = useRef<number | null>(null)

  const tafsir = useTafsir(
    settings.tafsirSource,
    tafsirOpen ? surahNumber : null,
    tafsirOpen ? selectedAyah : null,
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSurah(null)
    setSelectedAyah(null)
    setTafsirOpen(false)
    setTafsirClosing(false)
    setShareOpen(false)
    scrollDone.current = false
    lastProgress.current = 0
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
    scrollDone.current = false
  }, [highlightAyah])

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

  useEffect(() => {
    if (!surah) return
    let frame = 0

    const updateProgress = () => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-ayah]'))
      if (cards.length === 0) return
      const marker = window.innerHeight * 0.38
      let current = Number(cards[0].dataset.ayah) || 1
      for (const card of cards) {
        if (card.getBoundingClientRect().top <= marker) {
          current = Number(card.dataset.ayah) || current
        }
      }
      if (current !== lastProgress.current) {
        lastProgress.current = current
        onReadProgress(surahNumber, current)
      }
    }

    const handleScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateProgress()
      })
    }

    updateProgress()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [surah, surahNumber, onReadProgress])

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const closeTafsir = useCallback(() => {
    setTafsirClosing(true)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setTafsirOpen(false)
      setTafsirClosing(false)
      closeTimer.current = null
    }, 180)
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (shareOpen) setShareOpen(false)
      else if (tafsirOpen) closeTafsir()
      else setSelectedAyah(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [shareOpen, tafsirOpen, closeTafsir])

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
  const selectedDetail = surah.ayahs.find((item) => item.numberInSurah === selectedAyah)

  const scrollToAyah = (number: number) => {
    document.getElementById(`ayah-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const selectAyah = (number: number) => {
    if (selectedAyah === number) {
      setSelectedAyah(null)
      setTafsirOpen(false)
      return
    }
    setSelectedAyah(number)
    setTafsirOpen(false)
    setShareOpen(false)
  }

  const openTafsir = () => {
    setTafsirClosing(false)
    setTafsirOpen(true)
  }

  const navigateAyah = (delta: number) => {
    if (selectedAyah === null) return
    const target = selectedAyah + delta
    if (target < 1 || target > surah.numberOfAyahs) return
    setTafsirOpen(false)
    setSelectedAyah(target)
    scrollToAyah(target)
  }

  const handleAyahKey = (event: React.KeyboardEvent<HTMLDivElement>, number: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectAyah(number)
      return
    }
    if (selectedAyah !== number) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      navigateAyah(1)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      navigateAyah(-1)
    }
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      onToast('Could not copy to clipboard')
    }
  }

  const handleCopy = async (ayah: SurahDetail['ayahs'][number]) => {
    const text = `${ayah.text}\n\n${ayah.translation || ''}\n\n— ${surah.englishName} ${ayah.numberInSurah}`
    await copyText(text)
    setCopied(ayah.numberInSurah)
    window.setTimeout(() => setCopied(null), 1800)
    onToast('Ayah copied to clipboard')
  }

  const bookmarkAyah = (ayah: SurahDetail['ayahs'][number]) => {
    onToggleBookmark({
      surah: surahNumber,
      ayah: ayah.numberInSurah,
      surahName: surah.englishName,
      arabic: ayah.text,
      translation: ayah.translation || '',
    })
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
        <span className="reader-ornament" aria-hidden="true">❖</span>
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
          <span className="meta-divider" />
          <span>Surah {surahNumber}</span>
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
          const selected = selectedAyah === ayah.numberInSurah
          return (
            <article
              id={`ayah-${ayah.numberInSurah}`}
              data-ayah={ayah.numberInSurah}
              key={ayah.number}
              className={`ayah-card ${highlighted ? 'ayah-card--highlight' : ''} ${selected ? 'ayah-card--selected' : ''} ${playingAyah === ayah.numberInSurah ? 'ayah-card--playing' : ''}`}
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
                  onClick={() => bookmarkAyah(ayah)}
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

              <div
                className="ayah-selectable"
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`Select ayah ${ayah.numberInSurah}`}
                onClick={() => selectAyah(ayah.numberInSurah)}
                onKeyDown={(event) => handleAyahKey(event, ayah.numberInSurah)}
              >
                <p className="ayah-arabic" dir="rtl" style={{ fontSize: `${settings.arabicFontSize}px` }}>
                  {ayah.text}
                </p>

                {settings.showTransliteration && ayah.transliteration && (
                  <p className="ayah-transliteration">{ayah.transliteration}</p>
                )}

                {settings.showTranslation && ayah.translation && (
                  <p className="ayah-translation">{ayah.translation}</p>
                )}
              </div>

              {selected && (
                <div className="ayah-context-menu" role="group" aria-label={`Actions for ayah ${ayah.numberInSurah}`}>
                  <button onClick={openTafsir}>
                    <BookOpen size={15} /> <span>تفسير</span>
                  </button>
                  <button onClick={() => onPlayAyah(ayah.numberInSurah)}>
                    <Headphones size={15} /> <span>استماع</span>
                  </button>
                  <button onClick={() => handleCopy(ayah)}>
                    <Copy size={15} /> <span>نسخ</span>
                  </button>
                  <button className={isBookmarked ? 'context-action--active' : ''} onClick={() => bookmarkAyah(ayah)}>
                    <BookmarkIcon size={15} fill={isBookmarked ? 'currentColor' : 'none'} /> <span>حفظ</span>
                  </button>
                  <button onClick={() => setShareOpen(true)}>
                    <Share2 size={15} /> <span>مشاركة</span>
                  </button>
                  <span className="context-nav">
                    <button
                      onClick={() => navigateAyah(-1)}
                      disabled={ayah.numberInSurah === 1}
                      aria-label="Previous ayah"
                      title="Previous ayah"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() => navigateAyah(1)}
                      disabled={ayah.numberInSurah === surah.numberOfAyahs}
                      aria-label="Next ayah"
                      title="Next ayah"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </span>
                </div>
              )}

              {selected && tafsirOpen && (
                <TafsirPanel
                  surahName={surah.englishName}
                  ayah={ayah.numberInSurah}
                  arabic={ayah.text}
                  sourceId={settings.tafsirSource}
                  entry={tafsir.entry}
                  loading={tafsir.loading}
                  error={tafsir.error}
                  closing={tafsirClosing}
                  isBookmarked={isBookmarked}
                  onSourceChange={(source) => onSettingChange({ tafsirSource: source })}
                  onClose={closeTafsir}
                  onRetry={tafsir.reload}
                  onCopy={(text) => {
                    void copyText(text)
                    onToast('Tafsir copied to clipboard')
                  }}
                  onBookmark={() => bookmarkAyah(ayah)}
                  onShare={() => setShareOpen(true)}
                />
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

      <ShareCard
        open={shareOpen && Boolean(selectedDetail)}
        surahName={surah.englishName}
        surahNumber={surahNumber}
        ayah={selectedAyah ?? 1}
        arabic={selectedDetail?.text || ''}
        translation={selectedDetail?.translation}
        tafsirText={tafsirOpen ? tafsir.entry?.text : undefined}
        tafsirSource={tafsirOpen ? tafsir.entry?.sourceName : undefined}
        onClose={() => setShareOpen(false)}
        onToast={onToast}
      />
    </div>
  )
}
