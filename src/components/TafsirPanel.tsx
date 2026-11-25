import { Bookmark, Check, Copy, LoaderCircle, Share2, X } from 'lucide-react'
import { useId, useState } from 'react'
import { TAFSIR_SOURCES } from '../lib/api'
import type { TafsirEntry, TafsirSourceId } from '../lib/types'

interface TafsirPanelProps {
  surahName: string
  ayah: number
  arabic: string
  sourceId: TafsirSourceId
  entry: TafsirEntry | null
  loading: boolean
  error: string
  closing: boolean
  isBookmarked: boolean
  onSourceChange: (source: TafsirSourceId) => void
  onClose: () => void
  onRetry: () => void
  onCopy: (text: string) => void
  onBookmark: () => void
  onShare: () => void
}

export function TafsirPanel({
  surahName,
  ayah,
  arabic,
  sourceId,
  entry,
  loading,
  error,
  closing,
  isBookmarked,
  onSourceChange,
  onClose,
  onRetry,
  onCopy,
  onBookmark,
  onShare,
}: TafsirPanelProps) {
  const selectId = useId()
  const [copied, setCopied] = useState(false)
  const activeSource = TAFSIR_SOURCES.find((source) => source.id === sourceId) || TAFSIR_SOURCES[0]
  const paragraphs = entry?.text.split('\n\n').filter(Boolean) || []

  const handleCopy = () => {
    if (!entry?.text) return
    onCopy(entry.text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section
      className={`tafsir-panel ${closing ? 'tafsir-panel--closing' : ''}`}
      aria-label={`تفسير الآية ${ayah} من ${surahName}`}
    >
      <span className="tafsir-accent" aria-hidden="true" />

      <header className="tafsir-head">
        <div>
          <span className="tafsir-kicker">تفسير الآية</span>
          <h3>{surahName} · الآية {ayah}</h3>
        </div>
        <button className="tafsir-close" onClick={onClose} aria-label="إغلاق التفسير" title="إغلاق">
          <X size={18} />
        </button>
      </header>

      <blockquote className="tafsir-verse" dir="rtl">
        {arabic}
      </blockquote>

      <div className="tafsir-source-row">
        <div className="tafsir-source-field">
          <label htmlFor={selectId}>المصدر</label>
          <select
            id={selectId}
            value={sourceId}
            onChange={(event) => onSourceChange(event.target.value as TafsirSourceId)}
          >
            {TAFSIR_SOURCES.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
        <span className="tafsir-source-name">{activeSource.author}</span>
      </div>

      <div className="tafsir-content" aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="tafsir-status">
            <LoaderCircle className="spin" size={20} />
            <span>جارٍ تحميل التفسير...</span>
          </div>
        )}

        {!loading && error && (
          <div className="tafsir-status tafsir-status--error">
            <span>{error}</span>
            <button onClick={onRetry}>إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && entry?.text && (
          <div className="tafsir-text" dir="rtl">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        {!loading && !error && entry && !entry.text && (
          <p className="tafsir-status">لا يتوفر تفسير لهذه الآية في هذا المصدر.</p>
        )}
      </div>

      <footer className="tafsir-actions">
        <span className="tafsir-credit">{entry?.sourceName || activeSource.name}</span>
        <div className="tafsir-action-buttons">
          <button onClick={handleCopy} disabled={!entry?.text} aria-label="نسخ التفسير">
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'تم النسخ' : 'نسخ التفسير'}
          </button>
          <button
            className={isBookmarked ? 'tafsir-action--active' : ''}
            onClick={onBookmark}
            aria-label="حفظ الآية"
          >
            <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
            {isBookmarked ? 'محفوظة' : 'حفظ'}
          </button>
          <button onClick={onShare} aria-label="مشاركة الآية والتفسير">
            <Share2 size={15} /> مشاركة
          </button>
        </div>
      </footer>
    </section>
  )
}
