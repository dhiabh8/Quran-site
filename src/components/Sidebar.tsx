import { Bookmark, BookOpen, CircleDot, Compass, Home, Layers3, X } from 'lucide-react'
import type { LastRead, View } from '../lib/types'

interface SidebarProps {
  view: View
  onNavigate: (view: View) => void
  lastRead: LastRead | null
  onContinue: () => void
  open: boolean
  onClose: () => void
}

const NAV_ITEMS: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'surahs', label: 'All Surahs', icon: BookOpen },
  { id: 'juz', label: 'Juz Index', icon: Layers3 },
  { id: 'tasbih', label: 'Tasbih · تسبيح', icon: CircleDot },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
]

export function Sidebar({ view, onNavigate, lastRead, onContinue, open, onClose }: SidebarProps) {
  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Close menu" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span>ن</span>
          </div>
          <div>
            <div className="brand-name">Noor</div>
            <div className="brand-tagline">Quran Explorer</div>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <p className="nav-label">MENU</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = view === item.id || (view === 'reader' && item.id === 'surahs')
            return (
              <button
                key={item.id}
                className={`nav-item ${active ? 'nav-item--active' : ''}`}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {active && <span className="nav-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          {lastRead ? (
            <button className="continue-card" onClick={onContinue}>
              <div className="continue-head">
                <Compass size={16} />
                <span>Continue reading</span>
              </div>
              <strong>{lastRead.surahName}</strong>
              <span className="continue-meta">Ayah {lastRead.ayah}</span>
              <span className="continue-arrow">Open →</span>
            </button>
          ) : (
            <div className="sidebar-quote" dir="rtl">
              وَقُل رَّبِّ زِدْنِي عِلْمًا
              <span>“My Lord, increase me in knowledge.”</span>
            </div>
          )}

          <div className="sidebar-footer">
            <span className="status-dot" />
            <span>Made by <strong>Dhia</strong></span>
          </div>
        </div>
      </aside>
    </>
  )
}
