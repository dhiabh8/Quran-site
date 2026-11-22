import { ArrowRight, Layers3, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchJuz } from '../lib/api'
import type { JuzInfo } from '../lib/types'

interface JuzProps {
  onOpenJuz: (surah: number, ayah: number) => void
}

export function Juz({ onOpenJuz }: JuzProps) {
  const [juzList, setJuzList] = useState<JuzInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all(Array.from({ length: 30 }, (_, index) => fetchJuz(index + 1)))
      .then((result) => {
        if (active) setJuzList(result)
      })
      .catch(() => {
        if (active) setError('Could not load the juz index. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="page">
      <div className="page-heading">
        <span className="section-kicker">THIRTY PARTS</span>
        <h1>Juz Index</h1>
        <p>The Quran is divided into 30 juz, each containing two hizb.</p>
      </div>

      {loading ? (
        <div className="juz-loading">
          <LoaderCircle className="spin" size={28} />
          <span>Loading the 30 juz...</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <Layers3 size={28} />
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div className="juz-grid">
          {juzList.map((juz) => (
            <button
              key={juz.number}
              className="juz-card"
              onClick={() => onOpenJuz(juz.firstSurah.number, juz.firstAyah)}
            >
              <div className="juz-card-head">
                <span className="juz-number">{String(juz.number).padStart(2, '0')}</span>
                <span className="juz-label">JUZ</span>
              </div>
              <div className="juz-range">
                <strong>{juz.firstSurah.englishName}</strong>
                <span>{juz.firstAyah === juz.lastAyah && juz.firstSurah.number === juz.lastSurah.number
                  ? `Ayah ${juz.firstAyah}`
                  : `${juz.firstAyah} → ${juz.lastSurah.englishName} ${juz.lastAyah}`}</span>
              </div>
              <div className="juz-card-foot">
                <span>{juz.ayahCount} ayahs</span>
                <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
