import { ArrowLeft, Users } from 'lucide-react'
import './khatmah.css'

interface KhatmahHomeProps {
  configured: boolean
  onOpen: () => void
}

export function KhatmahHome({ configured, onOpen }: KhatmahHomeProps) {
  return (
    <section className="khatmah-teaser" aria-labelledby="khatmah-home-heading">
      <div className="khatmah-teaser-copy">
        <span className="section-kicker">
          <Users size={13} /> TOGETHER
        </span>
        <h2 id="khatmah-home-heading">Shared Khatmah — الختمة الجماعية</h2>
        <p className="khatmah-teaser-ar" dir="rtl" lang="ar">
          الختمة الجماعية
        </p>
        <p className="khatmah-teaser-text">
          Complete the Quran together with family and friends. Create a group, invite your loved
          ones with a link, and follow the 30 juz as one shared journey.
        </p>
        {!configured && (
          <p className="khatmah-setup-note">
            Shared Khatmah needs Supabase configuration before it can be used. The setup guide is
            included in the project (<code>SUPABASE_SETUP.md</code>).
          </p>
        )}
      </div>
      <button className="khatmah-teaser-action" onClick={onOpen}>
        <span>{configured ? 'Open Shared Khatmah' : 'View setup details'}</span>
        <ArrowLeft size={18} aria-hidden="true" />
      </button>
    </section>
  )
}
