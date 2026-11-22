import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { RECITERS } from '../lib/api'

interface AudioBarProps {
  surahName: string
  ayah: number
  isPlaying: boolean
  currentTime: number
  duration: number
  reciter: string
  hasPrevious: boolean
  hasNext: boolean
  onToggle: () => void
  onPrevious: () => void
  onNext: () => void
  onSeek: (time: number) => void
  onClose: () => void
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioBar({
  surahName,
  ayah,
  isPlaying,
  currentTime,
  duration,
  reciter,
  hasPrevious,
  hasNext,
  onToggle,
  onPrevious,
  onNext,
  onSeek,
  onClose,
}: AudioBarProps) {
  const reciterName = RECITERS.find((item) => item.id === reciter)?.name || 'Recitation'
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="audio-bar" role="region" aria-label="Audio player">
      <div className="audio-bar-progress">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => onSeek(Number(event.target.value))}
          style={{ '--progress': `${progress}%` } as CSSProperties}
          aria-label="Seek audio"
        />
      </div>
      <div className="audio-bar-inner">
        <div className="audio-info">
          <div className="audio-wave" aria-hidden="true"><i /><i /><i /><i /></div>
          <div>
            <strong>{surahName} · Ayah {ayah}</strong>
            <span>{reciterName}</span>
          </div>
        </div>

        <div className="audio-controls">
          <button onClick={onPrevious} disabled={!hasPrevious} aria-label="Previous ayah">
            <ChevronLeft size={20} />
          </button>
          <button className="audio-play" onClick={onToggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </button>
          <button onClick={onNext} disabled={!hasNext} aria-label="Next ayah">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="audio-time">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
          <button className="icon-button" onClick={onClose} aria-label="Close player">
            <X size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
