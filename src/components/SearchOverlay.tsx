import { CornerDownLeft, LoaderCircle, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { filterSurahs, searchQuran } from '../lib/api'
import type { SearchResult, SurahSummary } from '../lib/types'

interface SearchOverlayProps {
  open: boolean
  surahs: SurahSummary[]
  onClose: () => void
  onOpenResult: (surah: number, ayah: number) => void
  onOpenSurah: (surah: number) => void
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const index = text.toLowerCase().indexOf(query.trim().toLowerCase())
  if (index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.trim().length)}</mark>
      {text.slice(index + query.trim().length)}
    </>
  )
}

export function SearchOverlay({ open, surahs, onClose, onOpenResult, onOpenSurah }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const surahMatches = useMemo(() => filterSurahs(surahs, query).slice(0, 6), [surahs, query])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const timer = window.setTimeout(() => {
      searchQuran(trimmed)
        .then((found) => {
          if (active) setResults(found)
        })
        .catch(() => {
          if (active) setResults([])
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 320)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  if (!open) return null

  const hasQuery = query.trim().length >= 2

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search the Quran">
      <button className="search-overlay-scrim" onClick={onClose} aria-label="Close search" />
      <div className="search-panel">
        <div className="search-panel-input">
          <Search size={22} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
              if (event.key === 'Enter' && results[0]) {
                onOpenResult(results[0].surah, results[0].ayah)
              }
            }}
            placeholder="Search translations, surahs or ayahs..."
          />
          {query && (
            <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
          <kbd>ESC</kbd>
        </div>

        <div className="search-panel-body">
          {!hasQuery ? (
            <>
              <p className="search-hint-text">Type at least two characters to search the entire Quran.</p>
              <div className="suggestion-list">
                {['Merciful', 'Light', 'Patience', 'Paradise', 'Guidance'].map((word) => (
                  <button key={word} className="suggestion-chip" onClick={() => setQuery(word)}>
                    {word}
                  </button>
                ))}
              </div>
              <p className="search-section-title">JUMP TO A SURAH</p>
              <div className="search-surah-list">
                {surahs.slice(0, 8).map((surah) => (
                  <button key={surah.number} onClick={() => onOpenSurah(surah.number)}>
                    <span className="mini-surah-number">{surah.number}</span>
                    <span>{surah.englishName}</span>
                    <span className="mini-surah-meaning">{surah.englishNameTranslation}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {loading && (
                <div className="search-loading">
                  <LoaderCircle className="spin" size={20} /> Searching the Quran...
                </div>
              )}

              {surahMatches.length > 0 && (
                <section className="search-group">
                  <p className="search-section-title">SURAHS</p>
                  {surahMatches.map((surah) => (
                    <button
                      key={surah.number}
                      className="search-surah-row"
                      onClick={() => onOpenSurah(surah.number)}
                    >
                      <span className="mini-surah-number">{surah.number}</span>
                      <span className="search-surah-names">
                        <strong><Highlight text={surah.englishName} query={query} /></strong>
                        <small>{surah.englishNameTranslation} · {surah.numberOfAyahs} ayahs</small>
                      </span>
                      <CornerDownLeft size={15} />
                    </button>
                  ))}
                </section>
              )}

              <section className="search-group">
                <p className="search-section-title">VERSES · {results.length} RESULTS</p>
                {results.map((result) => (
                  <button
                    key={`${result.surah}-${result.ayah}`}
                    className="search-ayah-row"
                    onClick={() => onOpenResult(result.surah, result.ayah)}
                  >
                    <span className="search-ayah-badge">
                      {result.englishName} <b>{result.ayah}</b>
                    </span>
                    <span className="search-ayah-text"><Highlight text={result.text} query={query} /></span>
                  </button>
                ))}
                {!loading && results.length === 0 && (
                  <p className="search-empty">No matching verses. Try another word.</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
