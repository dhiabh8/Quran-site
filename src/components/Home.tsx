import { ArrowRight, BookOpen, Bookmark, CircleDot, Layers3, Play, Sparkles } from 'lucide-react'
import type { LastRead, SurahSummary, View } from '../lib/types'
import { PrayerTimesCard } from './PrayerTimesCard'
import { SurahCard } from './SurahCard'

interface HomeProps {
  surahs: SurahSummary[]
  loading: boolean
  lastRead: LastRead | null
  bookmarksCount: number
  onOpenSurah: (number: number, ayah?: number) => void
  onNavigate: (view: View) => void
}

const FEATURED = [1, 2, 36, 55, 67, 112]

export function Home({
  surahs,
  loading,
  lastRead,
  bookmarksCount,
  onOpenSurah,
  onNavigate,
}: HomeProps) {
  const featured = FEATURED.map((n) => surahs.find((s) => s.number === n)).filter(
    (s): s is SurahSummary => Boolean(s),
  )

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sparkles size={15} />
            <span>A space for reflection</span>
          </div>
          <p className="hero-bismillah" dir="rtl">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
          <h1>
            Read, listen and <em>reflect</em>
            <br />
            on the Noble Quran.
          </h1>
          <p className="hero-description">
            A calm, focused space to explore all 114 surahs with authentic Arabic text,
            translation, transliteration and beautiful recitations.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onOpenSurah(lastRead?.surah || 1)}>
              <BookOpen size={18} />
              {lastRead ? 'Continue reading' : 'Start reading'}
            </button>
            <button className="ghost-button" onClick={() => onNavigate('surahs')}>
              Browse surahs
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <div className="hero-stats" aria-label="Quran statistics">
          <div>
            <strong>114</strong>
            <span>Surahs</span>
          </div>
          <div>
            <strong>30</strong>
            <span>Juz</span>
          </div>
          <div>
            <strong>6,236</strong>
            <span>Ayahs</span>
          </div>
        </div>
      </section>

      <PrayerTimesCard />

      <div className="quick-grid">
        <button className="quick-card" onClick={() => onOpenSurah(lastRead?.surah || 1)}>
          <span className="quick-icon quick-icon--green"><Play size={18} fill="currentColor" /></span>
          <span>
            <strong>{lastRead ? lastRead.surahName : 'Al-Faatiha'}</strong>
            <small>{lastRead ? `Ayah ${lastRead.ayah} · Resume` : 'Begin with the Opening'}</small>
          </span>
          <ArrowRight size={17} className="quick-arrow" />
        </button>
        <button className="quick-card" onClick={() => onNavigate('juz')}>
          <span className="quick-icon quick-icon--gold"><Layers3 size={18} /></span>
          <span>
            <strong>Explore by Juz</strong>
            <small>30 parts of the Quran</small>
          </span>
          <ArrowRight size={17} className="quick-arrow" />
        </button>
        <button className="quick-card" onClick={() => onNavigate('bookmarks')}>
          <span className="quick-icon quick-icon--blue"><Bookmark size={18} /></span>
          <span>
            <strong>Your Bookmarks</strong>
            <small>{bookmarksCount} saved {bookmarksCount === 1 ? 'ayah' : 'ayahs'}</small>
          </span>
          <ArrowRight size={17} className="quick-arrow" />
        </button>
        <button className="quick-card" onClick={() => onNavigate('tasbih')}>
          <span className="quick-icon quick-icon--gold"><CircleDot size={18} /></span>
          <span>
            <strong>Tasbih · تسبيح</strong>
            <small>Keep count of your dhikr</small>
          </span>
          <ArrowRight size={17} className="quick-arrow" />
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="section-kicker">POPULAR</span>
            <h2>Featured Surahs</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate('surahs')}>
            View all <ArrowRight size={16} />
          </button>
        </div>
        <div className="surah-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SurahCard key={i} skeleton />)
            : featured.map((surah) => (
                <SurahCard key={surah.number} surah={surah} onClick={() => onOpenSurah(surah.number)} />
              ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="section-kicker">START ANYWHERE</span>
            <h2>Browse the Quran</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate('surahs')}>
            All 114 surahs <ArrowRight size={16} />
          </button>
        </div>
        <div className="surah-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SurahCard key={i} skeleton />)
            : surahs.slice(0, 6).map((surah) => (
                <SurahCard key={surah.number} surah={surah} onClick={() => onOpenSurah(surah.number)} />
              ))}
        </div>
      </section>
    </div>
  )
}
