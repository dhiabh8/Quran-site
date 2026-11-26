import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bookmark as BookmarkIcon,
  Check,
  Copy,
  Headphones,
  Home,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchVerses } from '../lib/api'
import {
  getFeeling,
  getFeelingPassages,
  getFeelingRefs,
  REFLECTION_DISCLAIMER,
  REFLECTION_DISCLAIMER_AR,
  TRANSLATION_SOURCE,
  QURAN_TEXT_SOURCE,
} from '../lib/feelings'
import type {
  Bookmark,
  FeelingId,
  Settings,
  VerseLookup,
  VerseRef,
} from '../lib/types'
import { useTafsir } from '../lib/useTafsir'
import './feelings.css'
import { FeelingIcon } from './FeelingIcon'
import { ShareCard } from './ShareCard'
import { TafsirPanel } from './TafsirPanel'

interface FeelingResultsProps {
  feelingId: FeelingId
  settings: Settings
  bookmarks: Bookmark[]
  isOnline: boolean
  playing: VerseRef | null
  isPlaying: boolean
  onChooseAnother: () => void
  onBackHome: () => void
  onReadInContext: (surah: number, ayah: number) => void
  onPlayVerse: (ref: VerseRef) => void
  onToggleBookmark: (bookmark: Omit<Bookmark, 'key' | 'createdAt'>) => void
  onSaveCollection: (verses: VerseLookup[]) => void
  onSettingChange: (patch: Partial<Settings>) => void
  onToast: (message: string) => void
}

interface VerseCardProps {
  verse: VerseLookup
  settings: Settings
  isBookmarked: boolean
  isThisPlaying: boolean
  onRead: () => void
  onPlay: () => void
  onBookmark: () => void
  onSettingChange: (patch: Partial<Settings>) => void
  onToast: (message: string) => void
}

function VerseCard({
  verse,
  settings,
  isBookmarked,
  isThisPlaying,
  onRead,
  onPlay,
  onBookmark,
  onSettingChange,
  onToast,
}: VerseCardProps) {
  const [tafsirOpen, setTafsirOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const tafsir = useTafsir(
    settings.tafsirSource,
    tafsirOpen ? verse.surah : null,
    tafsirOpen ? verse.ayah : null,
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${verse.arabic}\n\n${verse.translation}\n\n— ${verse.surahName} ${verse.surah}:${verse.ayah}`)
      setCopied(true)
      onToast('Verse copied to clipboard')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      onToast('Could not copy to clipboard')
    }
  }

  return (
    <article className="feeling-verse">
      <div className="feeling-verse-ref">
        <span className="feeling-verse-ref-name" dir="rtl" lang="ar">{verse.surahNameArabic}</span>
        <span className="feeling-verse-ref-en">
          {verse.surahName} · {verse.surah}:{verse.ayah}
        </span>
      </div>

      <p className="feeling-verse-arabic" dir="rtl" lang="ar" style={{ fontSize: `${Math.min(settings.arabicFontSize, 44)}px` }}>
        {verse.arabic}
      </p>

      {settings.showTranslation && (
        <p className="feeling-verse-translation">{verse.translation}</p>
      )}

      <div className="feeling-verse-actions" role="group" aria-label={`Actions for ${verse.surahName} ${verse.surah}:${verse.ayah}`}>
        <button onClick={onRead} title="Read in the full Qur'an context">
          <ArrowUpRight size={15} /> <span>Read in Quran</span>
        </button>
        <button onClick={onPlay} aria-label={isThisPlaying ? 'Pause verse' : 'Listen to verse'}>
          {isThisPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>{isThisPlaying ? 'Pause' : 'Listen'}</span>
        </button>
        <button
          className={tafsirOpen ? 'feeling-action-active' : ''}
          onClick={() => setTafsirOpen((open) => !open)}
          aria-expanded={tafsirOpen}
        >
          <BookOpen size={15} /> <span>{tafsirOpen ? 'Hide Tafsir' : 'View Tafsir'}</span>
        </button>
        <button className={isBookmarked ? 'feeling-action-active' : ''} onClick={onBookmark}>
          <BookmarkIcon size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
          <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
        </button>
        <button onClick={() => void handleCopy()}>
          {copied ? <Check size={15} /> : <Copy size={15} />} <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <button onClick={() => setShareOpen(true)}>
          <Share2 size={15} /> <span>Share</span>
        </button>
      </div>

      {tafsirOpen && (
        <TafsirPanel
          surahName={verse.surahName}
          ayah={verse.ayah}
          arabic={verse.arabic}
          sourceId={settings.tafsirSource}
          entry={tafsir.entry}
          loading={tafsir.loading}
          error={tafsir.error}
          closing={false}
          isBookmarked={isBookmarked}
          onSourceChange={(source) => onSettingChange({ tafsirSource: source })}
          onClose={() => setTafsirOpen(false)}
          onRetry={tafsir.reload}
          onCopy={(text) => {
            void navigator.clipboard.writeText(text).then(
              () => onToast('Tafsir copied to clipboard'),
              () => onToast('Could not copy to clipboard'),
            )
          }}
          onBookmark={onBookmark}
          onShare={() => setShareOpen(true)}
        />
      )}

      <ShareCard
        open={shareOpen}
        surahName={verse.surahName}
        surahNumber={verse.surah}
        ayah={verse.ayah}
        arabic={verse.arabic}
        translation={verse.translation}
        tafsirText={tafsirOpen ? tafsir.entry?.text : undefined}
        tafsirSource={tafsirOpen ? tafsir.entry?.sourceName : undefined}
        onClose={() => setShareOpen(false)}
        onToast={onToast}
      />
    </article>
  )
}

export function FeelingResults({
  feelingId,
  settings,
  bookmarks,
  isOnline,
  playing,
  isPlaying,
  onChooseAnother,
  onBackHome,
  onReadInContext,
  onPlayVerse,
  onToggleBookmark,
  onSaveCollection,
  onSettingChange,
  onToast,
}: FeelingResultsProps) {
  const feeling = getFeeling(feelingId)
  const passages = getFeelingPassages(feelingId)
  const [verses, setVerses] = useState<VerseLookup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setVerses([])

    fetchVerses(getFeelingRefs(feelingId))
      .then((data) => {
        if (active) setVerses(data)
      })
      .catch(() => {
        if (active) setError('Could not load these verses. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [feelingId, attempt])

  const verseMap = new Map(verses.map((verse) => [`${verse.surah}:${verse.ayah}`, verse]))

  const bookmarkVerse = (verse: VerseLookup) => {
    onToggleBookmark({
      surah: verse.surah,
      ayah: verse.ayah,
      surahName: verse.surahName,
      arabic: verse.arabic,
      translation: verse.translation,
    })
  }

  if (!feeling) {
    return (
      <div className="page">
        <div className="empty-state empty-state--large">
          <Sparkles size={30} />
          <h3>This feeling is not available</h3>
          <button className="text-button" onClick={onChooseAnother}>Choose another feeling</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page feelings-results">
      <div className="feelings-results-top">
        <button className="text-button" onClick={onChooseAnother}>
          <ArrowLeft size={16} /> Choose another feeling
        </button>
        <button className="text-button" onClick={onBackHome}>
          <Home size={16} /> Back to home
        </button>
      </div>

      <header className="feelings-results-header">
        <span className="feelings-results-icon"><FeelingIcon id={feeling.id} size={26} /></span>
        <div>
          <span className="section-kicker">QURAN BY FEELINGS</span>
          <h1>{feeling.label}</h1>
          <p className="feelings-results-arabic" dir="rtl" lang="ar">{feeling.arabic}</p>
          <p className="feelings-results-intro">{feeling.intro}</p>
          <p className="feelings-results-intro-ar" dir="rtl" lang="ar">{feeling.introAr}</p>
        </div>
      </header>

      {!isOnline && (
        <p className="feelings-notice" role="status">
          You are offline. Verses already loaded may still be visible, but remote audio and Tafsir may be unavailable.
        </p>
      )}

      <aside className="feelings-disclaimer" aria-label="Important note">
        <p>{REFLECTION_DISCLAIMER}</p>
        <p dir="rtl" lang="ar">{REFLECTION_DISCLAIMER_AR}</p>
      </aside>

      {loading ? (
        <div className="feelings-loading" role="status">
          <LoaderCircle className="spin" size={26} />
          <span>Loading verified verses…</span>
        </div>
      ) : error ? (
        <div className="empty-state empty-state--large">
          <RefreshCw size={28} />
          <h3>{error}</h3>
          <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        </div>
      ) : verses.length === 0 ? (
        <div className="empty-state empty-state--large">
          <Sparkles size={28} />
          <h3>No verified passages are available for this feeling yet.</h3>
          <button className="primary-button" onClick={onChooseAnother}>Choose another feeling</button>
        </div>
      ) : (
        <>
          <div className="feelings-source-line">
            <span>Arabic: {QURAN_TEXT_SOURCE}</span>
            <span>Translation: {TRANSLATION_SOURCE}</span>
            <span>Reflections are editorial notes, not tafsir. Open Tafsir for verified explanations.</span>
          </div>

          {passages.map((passage, index) => {
            const passageVerses = passage.refs
              .map((ref) => verseMap.get(`${ref.surah}:${ref.ayah}`))
              .filter((verse): verse is VerseLookup => Boolean(verse))

            if (passageVerses.length === 0) return null

            return (
              <section className="feeling-passage" key={`${feelingId}-${index}`} aria-labelledby={`passage-${feelingId}-${index}`}>
                <div className="feeling-passage-head">
                  <span className="feeling-passage-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h2 id={`passage-${feelingId}-${index}`}>{passage.theme}</h2>
                    <p dir="rtl" lang="ar">{passage.themeAr}</p>
                  </div>
                </div>
                <p className="feeling-passage-note">{passage.note}</p>
                <p className="feeling-passage-note-ar" dir="rtl" lang="ar">{passage.noteAr}</p>

                <div className="feeling-passage-verses">
                  {passageVerses.map((verse) => (
                    <VerseCard
                      key={`${verse.surah}:${verse.ayah}`}
                      verse={verse}
                      settings={settings}
                      isBookmarked={bookmarks.some((item) => item.key === `${verse.surah}:${verse.ayah}`)}
                      isThisPlaying={isPlaying && playing?.surah === verse.surah && playing?.ayah === verse.ayah}
                      onRead={() => onReadInContext(verse.surah, verse.ayah)}
                      onPlay={() => onPlayVerse({ surah: verse.surah, ayah: verse.ayah })}
                      onBookmark={() => bookmarkVerse(verse)}
                      onSettingChange={onSettingChange}
                      onToast={onToast}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <div className="feelings-results-footer">
            <button className="primary-button" onClick={onChooseAnother}>
              <RefreshCw size={16} /> Choose another feeling
            </button>
            <button className="ghost-button" onClick={() => onSaveCollection(verses)}>
              <BookmarkIcon size={16} /> Save this collection
            </button>
            <button className="text-button" onClick={onBackHome}>
              <Home size={16} /> Back to home
            </button>
          </div>

          <p className="feelings-audio-hint">
            <Headphones size={14} /> Listening uses the reciter selected in Settings. Tafsir uses the verified sources configured there.
          </p>
        </>
      )}
    </div>
  )
}
