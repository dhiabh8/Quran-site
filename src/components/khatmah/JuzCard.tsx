import { BookOpen, Check, CircleDot, LoaderCircle, UserPlus } from 'lucide-react'
import { fetchJuz } from '../../lib/api'
import type { KhatmahJuz, KhatmahParticipant } from '../../lib/khatmahTypes'
import './khatmah.css'

interface JuzCardProps {
  juz: KhatmahJuz
  participants: KhatmahParticipant[]
  isOwner: boolean
  currentParticipantId: string | null
  busy: boolean
  onAssign: (participantId: string | null) => void
  onSelect: () => void
  onStatus: (status: 'in_progress' | 'completed' | 'assigned') => void
  onRead: (surah: number, ayah: number) => void
  onToast: (message: string) => void
}

const STATUS_LABELS: Record<KhatmahJuz['status'], string> = {
  available: 'Available',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
}

export function JuzCard({
  juz,
  participants,
  isOwner,
  currentParticipantId,
  busy,
  onAssign,
  onSelect,
  onStatus,
  onRead,
  onToast,
}: JuzCardProps) {
  const assignee = participants.find((item) => item.id === juz.assigned_to)
  const isMine = Boolean(currentParticipantId && juz.assigned_to === currentParticipantId)
  const isCompleted = juz.status === 'completed'

  const openInReader = async () => {
    try {
      const info = await fetchJuz(juz.juz_number)
      onRead(info.firstSurah.number, info.firstAyah)
    } catch {
      onToast('Could not open this juz right now')
    }
  }

  return (
    <article className={`khatmah-juz-card khatmah-juz-card--${juz.status}`}>
      <div className="khatmah-juz-head">
        <span className="khatmah-juz-number">{String(juz.juz_number).padStart(2, '0')}</span>
        <span className={`khatmah-juz-status khatmah-juz-status--${juz.status}`}>
          {juz.status === 'completed' ? <Check size={11} /> : <CircleDot size={11} />}
          {STATUS_LABELS[juz.status]}
        </span>
      </div>

      <p className="khatmah-juz-assignee">
        {assignee ? assignee.display_name : 'Not assigned yet'}
      </p>

      <button className="khatmah-juz-read" onClick={() => void openInReader()}>
        <BookOpen size={13} /> Read juz in Quran
      </button>

      {isOwner && !isCompleted && (
        <label className="khatmah-juz-select">
          <span>Assign to</span>
          <select
            value={juz.assigned_to ?? ''}
            disabled={busy}
            onChange={(event) => onAssign(event.target.value || null)}
          >
            <option value="">Available</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.display_name}
                {participant.role === 'owner' ? ' (creator)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {!isOwner && isMine && !isCompleted && (
        <div className="khatmah-juz-actions">
          {juz.status === 'assigned' && (
            <button disabled={busy} onClick={() => onStatus('in_progress')}>
              <LoaderCircle size={13} /> Start reading
            </button>
          )}
          {juz.status === 'in_progress' && (
            <button disabled={busy} onClick={() => onStatus('completed')}>
              <Check size={13} /> Mark complete
            </button>
          )}
          {juz.status === 'in_progress' && (
            <button className="khatmah-juz-quiet" disabled={busy} onClick={() => onStatus('assigned')}>
              Undo start
            </button>
          )}
        </div>
      )}

      {isMine && isCompleted && (
        <button className="khatmah-juz-quiet" disabled={busy} onClick={() => onStatus('assigned')}>
          Correction: not complete
        </button>
      )}

      {!isOwner && !isMine && juz.status === 'available' && currentParticipantId && (
        <button className="khatmah-juz-select-btn" disabled={busy} onClick={onSelect}>
          <UserPlus size={13} /> Choose this juz
        </button>
      )}
    </article>
  )
}
