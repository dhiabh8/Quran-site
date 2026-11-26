import { ArrowLeft, Check, Copy, LoaderCircle, Plus, RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createKhatmah, khatmahInviteUrl, listMyKhatmahs } from '../../lib/khatmah'
import type { KhatmahListItem } from '../../lib/khatmahTypes'
import './khatmah.css'

interface KhatmahListProps {
  configured: boolean
  onOpen: (inviteRef: string) => void
  onToast: (message: string) => void
}

function today() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function codeFromInput(value: string) {
  const trimmed = value.trim()
  const match = /\/khatmah\/([^/?#]+)/.exec(trimmed)
  try {
    return match ? decodeURIComponent(match[1]) : trimmed
  } catch {
    return match ? match[1] : trimmed
  }
}

export function KhatmahList({ configured, onOpen, onToast }: KhatmahListProps) {
  const [items, setItems] = useState<KhatmahListItem[]>([])
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [description, setDescription] = useState('')
  const [startedAt, setStartedAt] = useState(today())
  const [targetDate, setTargetDate] = useState('')

  const load = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setError('')
    try {
      setItems(await listMyKhatmahs())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your Khatmahs.')
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!configured) return
    if (title.trim().length < 3 || creatorName.trim().length < 2) {
      setError('Please add a name of at least 3 characters and your display name.')
      return
    }
    setCreating(true)
    setError('')
    try {
      const created = await createKhatmah({
        title,
        description,
        creatorDisplayName: creatorName,
        startedAt: startedAt || null,
        targetDate: targetDate || null,
      })
      onToast('Your Khatmah is ready')
      onOpen(created.inviteCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the Khatmah.')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = (event: FormEvent) => {
    event.preventDefault()
    const code = codeFromInput(joinCode)
    if (!code) {
      setError('Paste a valid invitation link or code.')
      return
    }
    onOpen(code)
  }

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(khatmahInviteUrl(code))
      onToast('Invitation link copied')
    } catch {
      onToast('Could not copy the link')
    }
  }

  return (
    <div className="page khatmah-list-page">
      <div className="page-heading">
        <span className="section-kicker">TOGETHER</span>
        <h1>Shared Khatmah</h1>
        <p>الختمة الجماعية — one Quran journey, shared with the people you love.</p>
      </div>

      {!configured && (
        <div className="khatmah-empty">
          <Users size={30} />
          <h3>Setup required</h3>
          <p>
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to{' '}
            <code>.env</code>, apply the SQL migration in <code>supabase/migrations</code>, then
            follow <code>SUPABASE_SETUP.md</code>. Nothing is sent anywhere until you do.
          </p>
        </div>
      )}

      {configured && (
        <>
          <div className="khatmah-list-actions">
            <button className="primary-button" onClick={() => setShowCreate((open) => !open)}>
              <Plus size={17} /> {showCreate ? 'Close form' : 'Create a Khatmah'}
            </button>
            <button className="ghost-button" onClick={() => void load()}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {showCreate && (
            <form className="khatmah-form" onSubmit={(event) => void handleCreate(event)}>
              <h2>Start a new shared journey</h2>
              <label>
                Group name
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required placeholder="Family Khatmah" />
              </label>
              <label>
                Your display name
                <input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} maxLength={60} required placeholder="e.g. Aisha" />
              </label>
              <label>
                Description <span>(optional)</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={3} placeholder="A gentle note for everyone joining" />
              </label>
              <div className="khatmah-form-row">
                <label>
                  Start date <span>(optional)</span>
                  <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
                </label>
                <label>
                  Target date <span>(optional)</span>
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} min={startedAt || undefined} />
                </label>
              </div>
              <p className="khatmah-form-note">
                You will join anonymously in this browser. Clearing browser data may prevent
                recovery of your creator identity.
              </p>
              <button className="primary-button" disabled={creating}>
                {creating ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                {creating ? 'Creating…' : 'Create Khatmah'}
              </button>
            </form>
          )}

          <form className="khatmah-join-form" onSubmit={handleJoin}>
            <label htmlFor="khatmah-code">Have an invitation?</label>
            <div className="khatmah-join-row">
              <input
                id="khatmah-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste invitation link or code"
                dir="ltr"
              />
              <button className="ghost-button" type="submit">Open invitation</button>
            </div>
          </form>

          {error && <div className="khatmah-error" role="alert">{error}</div>}

          {loading ? (
            <div className="khatmah-loading" role="status">
              <LoaderCircle className="spin" size={26} /> Loading your Khatmahs…
            </div>
          ) : items.length === 0 ? (
            <div className="khatmah-empty">
              <Users size={28} />
              <h3>No Khatmahs yet</h3>
              <p>Create one above, or open an invitation link from someone you know.</p>
            </div>
          ) : (
            <div className="khatmah-card-grid">
              {items.map((item) => (
                <article className="khatmah-card" key={item.id}>
                  <div className="khatmah-card-top">
                    <span className={`khatmah-badge khatmah-badge--${item.status}`}>
                      {item.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                    <span className="khatmah-role">{item.viewer_role === 'owner' ? 'Creator' : 'Participant'}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.completed_count} of 30 juz completed · {item.participant_count} participants</p>
                  <div className="khatmah-mini-progress" aria-hidden="true">
                    <span style={{ width: `${(item.completed_count / 30) * 100}%` }} />
                  </div>
                  <div className="khatmah-card-actions">
                    <button className="text-button" onClick={() => onOpen(item.invite_code)}>
                      Open <ArrowLeft size={15} />
                    </button>
                    <button className="icon-button" title="Copy invitation link" aria-label="Copy invitation link" onClick={() => void copyLink(item.invite_code)}>
                      <Copy size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
