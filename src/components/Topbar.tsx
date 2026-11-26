import { ChevronLeft, Menu, Search, SlidersHorizontal } from 'lucide-react'
import type { View } from '../lib/types'

interface TopbarProps {
  view: View
  title: string
  onBack: () => void
  onSearch: () => void
  onSettings: () => void
  onMenu: () => void
  backLabel?: string
}

export function Topbar({ view, title, onBack, onSearch, onSettings, onMenu, backLabel }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
        {view === 'reader' || view === 'khatmah' ? (
          <button className="back-button" onClick={onBack}>
            <ChevronLeft size={18} />
            <span>{backLabel ?? 'All Surahs'}</span>
          </button>
        ) : (
          <div className="topbar-title">{title}</div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="search-trigger" onClick={onSearch}>
          <Search size={17} />
          <span>Search Quran...</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="icon-button" onClick={onSettings} aria-label="Open settings">
          <SlidersHorizontal size={19} />
        </button>
      </div>
    </header>
  )
}
