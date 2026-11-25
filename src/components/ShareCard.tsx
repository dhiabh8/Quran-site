import { Check, Copy, Share2, X } from 'lucide-react'
import { useState } from 'react'

interface ShareCardProps {
  open: boolean
  surahName: string
  surahNumber: number
  ayah: number
  arabic: string
  translation?: string
  tafsirText?: string
  tafsirSource?: string
  onClose: () => void
  onToast: (message: string) => void
}

export function ShareCard({
  open,
  surahName,
  surahNumber,
  ayah,
  arabic,
  translation,
  tafsirText,
  tafsirSource,
  onClose,
  onToast,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false)
  if (!open) return null

  const shareText = [
    arabic,
    translation ? `\n${translation}` : '',
    `\n${surahName} · ${surahNumber}:${ayah}`,
    tafsirText && tafsirSource ? `\nتفسير ${tafsirSource}:\n${tafsirText}` : '',
    '\n— NOOR · Quran Explorer',
  ]
    .filter(Boolean)
    .join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      onToast('Share text copied')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      onToast('Could not copy share text')
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy()
      return
    }
    try {
      await navigator.share({ title: `${surahName} ${surahNumber}:${ayah}`, text: shareText })
    } catch {
      // The user dismissed the native share sheet.
    }
  }

  return (
    <div className="share-overlay" role="dialog" aria-modal="true" aria-label="Share ayah">
      <button className="share-scrim" onClick={onClose} aria-label="Close share card" />
      <div className="share-card">
        <div className="share-card-head">
          <div className="share-brand">
            <span className="share-brand-mark" aria-hidden="true">ن</span>
            <span>NOOR</span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close share card">
            <X size={18} />
          </button>
        </div>

        <p className="share-card-eyebrow">آية من القرآن الكريم</p>
        <p className="share-card-arabic" dir="rtl">{arabic}</p>
        <p className="share-card-reference">{surahName} · الآية {ayah}</p>

        {translation && <p className="share-card-translation">{translation}</p>}

        {tafsirText && (
          <div className="share-card-tafsir" dir="rtl">
            <span>{tafsirSource || 'تفسير الآية'}</span>
            <p>{tafsirText}</p>
          </div>
        )}

        <div className="share-card-actions">
          <button className="share-copy" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy text'}
          </button>
          <button className="share-native" onClick={handleNativeShare}>
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  )
}
