import { ArrowUpRight } from 'lucide-react'
import type { SurahSummary } from '../lib/types'

interface SurahCardProps {
  surah?: SurahSummary
  onClick?: () => void
  skeleton?: boolean
}

export function SurahCard({ surah, onClick, skeleton }: SurahCardProps) {
  if (skeleton || !surah) {
    return <div className="surah-card surah-card--skeleton"><div className="skeleton-line w40" /><div className="skeleton-line w70" /><div className="skeleton-line w50" /></div>
  }

  return (
    <button className="surah-card" onClick={onClick}>
      <div className="surah-card-top">
        <span className="surah-number">{surah.number}</span>
        <span className="revelation-pill">{surah.revelationType}</span>
      </div>
      <div className="surah-arabic" dir="rtl">
        {surah.name.replace('سُورَةُ ', '')}
      </div>
      <div className="surah-card-name">{surah.englishName}</div>
      <div className="surah-card-translation">{surah.englishNameTranslation}</div>
      <div className="surah-card-footer">
        <span>{surah.numberOfAyahs} ayahs</span>
        <ArrowUpRight size={16} />
      </div>
    </button>
  )
}
