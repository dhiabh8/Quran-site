import { Bookmark, Trash2 } from 'lucide-react'
import type { Bookmark as BookmarkType } from '../lib/types'

interface BookmarksProps {
  bookmarks: BookmarkType[]
  onOpen: (surah: number, ayah: number) => void
  onRemove: (key: string) => void
}

export function Bookmarks({ bookmarks, onOpen, onRemove }: BookmarksProps) {
  return (
    <div className="page">
      <div className="page-heading">
        <span className="section-kicker">YOUR COLLECTION</span>
        <h1>Bookmarks</h1>
        <p>Ayahs you have saved for later reflection.</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="empty-state empty-state--large">
          <Bookmark size={32} />
          <h3>No bookmarks yet</h3>
          <p>Tap the bookmark icon on any ayah while reading to save it here.</p>
        </div>
      ) : (
        <div className="bookmark-list">
          {bookmarks.map((item) => (
            <article className="bookmark-card" key={item.key}>
              <button className="bookmark-main" onClick={() => onOpen(item.surah, item.ayah)}>
                <div className="bookmark-meta">
                  <span className="bookmark-surah">{item.surahName}</span>
                  <span className="bookmark-ayah">Ayah {item.ayah}</span>
                </div>
                <p className="bookmark-arabic" dir="rtl">{item.arabic}</p>
                <p className="bookmark-translation">{item.translation}</p>
              </button>
              <button
                className="icon-button bookmark-remove"
                onClick={() => onRemove(item.key)}
                aria-label="Remove bookmark"
                title="Remove bookmark"
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
