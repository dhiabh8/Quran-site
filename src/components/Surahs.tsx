import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { filterSurahs } from '../lib/api'
import type { SurahSummary } from '../lib/types'
import { SurahCard } from './SurahCard'

interface SurahsProps {
  surahs: SurahSummary[]
  loading: boolean
  onOpenSurah: (number: number) => void
}

type RevelationFilter = 'all' | 'Meccan' | 'Medinan'

export function Surahs({ surahs, loading, onOpenSurah }: SurahsProps) {
  const [query, setQuery] = useState('')
  const [revelation, setRevelation] = useState<RevelationFilter>('all')
  const [alphabetical, setAlphabetical] = useState(false)

  const filtered = useMemo(() => {
    const result = filterSurahs(surahs, query).filter(
      (surah) => revelation === 'all' || surah.revelationType === revelation,
    )
    return alphabetical
      ? [...result].sort((a, b) => a.englishName.localeCompare(b.englishName))
      : result
  }, [surahs, query, revelation, alphabetical])

  return (
    <div className="page">
      <div className="page-heading">
        <span className="section-kicker">THE NOBLE QURAN</span>
        <h1>All Surahs</h1>
        <p>Choose a chapter to read, listen and reflect.</p>
      </div>

      <div className="filter-bar">
        <label className="filter-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a surah by name or number..."
          />
        </label>
        <div className="filter-chips" role="group" aria-label="Filter by revelation">
          {(['all', 'Meccan', 'Medinan'] as RevelationFilter[]).map((option) => (
            <button
              key={option}
              className={`chip ${revelation === option ? 'chip--active' : ''}`}
              onClick={() => setRevelation(option)}
            >
              {option === 'all' ? 'All' : option}
            </button>
          ))}
        </div>
        <button
          className={`sort-button ${alphabetical ? 'sort-button--active' : ''}`}
          onClick={() => setAlphabetical((value) => !value)}
          title="Toggle alphabetical order"
        >
          <SlidersHorizontal size={16} />
          {alphabetical ? 'A–Z' : 'Revelation order'}
        </button>
      </div>

      <div className="result-count">
        {loading ? 'Loading surahs...' : `${filtered.length} surah${filtered.length === 1 ? '' : 's'}`}
      </div>

      {loading ? (
        <div className="surah-grid">
          {Array.from({ length: 12 }).map((_, index) => <SurahCard key={index} skeleton />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="surah-grid">
          {filtered.map((surah) => (
            <SurahCard key={surah.number} surah={surah} onClick={() => onOpenSurah(surah.number)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h3>No surahs found</h3>
          <p>Try a different name or number.</p>
        </div>
      )}
    </div>
  )
}
