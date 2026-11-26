import {
  ArrowLeft,
  Check,
  Copy,
  Home,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  assignJuz,
  autoAssignJuz,
  getKhatmahPreview,
  getKhatmahSnapshot,
  joinKhatmah,
  khatmahInviteUrl,
  selfSelectJuz,
  setJoiningOpen,
  setJuzStatus,
  subscribeToKhatmah,
  updateDisplayName,
} from '../../lib/khatmah'
import type { KhatmahPreview, KhatmahSnapshot } from '../../lib/khatmahTypes'
import { JuzCard } from './JuzCard'
import './khatmah.css'

interface KhatmahPageProps {
  inviteRef: string
  configured: boolean
  onBack: () => void
  onHome: () => void
  onOpenSurah: (surah: number, ayah?: number) => void
  onToast: (message: string) => void
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function KhatmahPage({ inviteRef, configured, onBack, onHome, onOpenSurah, onToast }: KhatmahPageProps) {
  const [preview, setPreview] = useState<KhatmahPreview | null>(null)
  const [snapshot, setSnapshot] = useState<KhatmahSnapshot | null>(null)
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const load = useCallback(async () => {
    if (!configured) {
      setError('Shared Khatmah is not configured yet. See SUPABASE_SETUP.md.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const nextPreview = await getKhatmahPreview(inviteRef)
      setPreview(nextPreview)
      if (nextPreview.viewer_is_member) {
        setSnapshot(await getKhatmahSnapshot(nextPreview.id))
      } else {
        setSnapshot(null)
      }
    } catch (err) {
      setPreview(null)
      setSnapshot(null)
      setError(errorMessage(err, 'Could not open this Khatmah.'))
    } finally {
      setLoading(false)
    }
  }, [configured, inviteRef])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!snapshot?.khatmah.id) return
    let timer = 0
    const unsubscribe = subscribeToKhatmah(
      snapshot.khatmah.id,
      () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => void load(), 140)
      },
      setConnected,
    )
    const onOnline = () => void load()
    window.addEventListener('online', onOnline)
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
      window.removeEventListener('online', onOnline)
    }
  }, [snapshot?.khatmah.id, load])

  const run = async (action: () => Promise<void>, success?: string) => {
    setBusy(true)
    setActionError('')
    try {
      await action()
      if (success) onToast(success)
      await load()
    } catch (err) {
      const message = errorMessage(err, 'Something went wrong. Please try again.')
      setActionError(message)
      onToast(message)
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = (event: FormEvent) => {
    event.preventDefault()
    if (displayName.trim().length < 2) {
      setActionError('Please enter a display name of at least 2 characters.')
      return
    }
    void run(() => joinKhatmah(inviteRef, displayName), 'You joined the Khatmah')
  }

  const handleNameSave = (event: FormEvent) => {
    event.preventDefault()
    if (!snapshot?.currentParticipantId || nameDraft.trim().length < 2) return
    void run(
      () => updateDisplayName(snapshot.currentParticipantId as string, nameDraft),
      'Display name updated',
    ).then(() => setEditingName(false))
  }

  const inviteUrl = configured ? khatmahInviteUrl(inviteRef) : ''
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      onToast('Invitation link copied')
    } catch {
      onToast('Could not copy the link')
    }
  }
  const shareWhatsApp = () => {
    const text = `Join our shared Khatmah${preview ? ` — ${preview.title}` : ''}: ${inviteUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="page khatmah-page">
        <div className="khatmah-loading" role="status">
          <LoaderCircle className="spin" size={28} /> Opening Khatmah…
        </div>
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className="page khatmah-page">
        <div className="khatmah-empty khatmah-empty--large">
          <LockKeyhole size={30} />
          <h3>{error || 'This Khatmah could not be opened.'}</h3>
          <p>Check the invitation link, or ask the creator to send a new one.</p>
          <button className="primary-button" onClick={onBack}>
            <ArrowLeft size={16} /> Shared Khatmah
          </button>
        </div>
      </div>
    )
  }

  const title = snapshot?.khatmah.title ?? preview.title
  const description = snapshot?.khatmah.description ?? preview.description
  const participants = snapshot?.participants ?? []
  const juz = snapshot?.juz ?? []
  const completed = juz.filter((item) => item.status === 'completed').length
  const percent = Math.round((completed / 30) * 100)
  const isOwner = snapshot?.isOwner ?? false
  const currentName = participants.find((item) => item.id === snapshot?.currentParticipantId)?.display_name

  return (
    <div className="page khatmah-page">
      <div className="khatmah-page-top">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} /> Shared Khatmah
        </button>
        <span className={`khatmah-connection ${connected ? 'is-online' : 'is-offline'}`}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? 'Live updates on' : 'Reconnecting…'}
        </span>
      </div>

      <header className="khatmah-hero">
        <div>
          <span className="section-kicker">SHARED JOURNEY</span>
          <h1>{title}</h1>
          <p className="khatmah-hero-ar" dir="rtl" lang="ar">الختمة الجماعية</p>
          {description && <p className="khatmah-hero-description">{description}</p>}
          <div className="khatmah-hero-meta">
            <span><Users size={14} /> {preview.participant_count} participants</span>
            {preview.target_date && <span>Target: {preview.target_date}</span>}
            {snapshot?.khatmah.status === 'completed' && <span className="khatmah-badge khatmah-badge--completed">Completed</span>}
          </div>
        </div>
        <div className="khatmah-invite" dir="ltr">
          <span>Invitation link</span>
          <code>{inviteUrl}</code>
          <div className="khatmah-invite-actions">
            <button className="ghost-button" onClick={() => void copyInvite()}><Copy size={15} /> Copy link</button>
            <button className="primary-button" onClick={shareWhatsApp}>Share on WhatsApp</button>
          </div>
        </div>
      </header>

      {actionError && <div className="khatmah-error" role="alert">{actionError}</div>}

      {!snapshot ? (
        <section className="khatmah-join-panel">
          <span className="section-kicker">YOU ARE INVITED</span>
          <h2>Join this Khatmah</h2>
          <p>
            Enter the name your group should see. You can join without an account — no email or
            password needed.
          </p>
          {!preview.joining_open && (
            <p className="khatmah-error" role="status">
              The creator has closed joining for this Khatmah.
            </p>
          )}
          <form onSubmit={handleJoin}>
            <label htmlFor="khatmah-name">Your display name</label>
            <div className="khatmah-join-row">
              <input
                id="khatmah-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={60}
                placeholder="e.g. Maryam"
                disabled={!preview.joining_open || busy}
              />
              <button className="primary-button" disabled={!preview.joining_open || busy}>
                {busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                Join Khatmah
              </button>
            </div>
          </form>
          <p className="khatmah-privacy-note">
            Your anonymous session is kept in this browser. If you clear browser data, you may not
            be able to recover your identity or progress. A display name is never used as proof of
            identity.
          </p>
          <button className="text-button" onClick={onHome}><Home size={15} /> Back to NOOR home</button>
        </section>
      ) : (
        <>
          {completed === 30 ? (
            <section className="khatmah-complete" aria-labelledby="khatmah-complete-heading">
              <Sparkles size={34} />
              <h2 id="khatmah-complete-heading" dir="rtl" lang="ar">الحمد لله، اكتملت الختمة!</h2>
              <p dir="rtl" lang="ar">اجتمعتم على تلاوة كتاب الله، تقبّل الله منكم.</p>
              <p className="khatmah-complete-en">
                All 30 juz are complete. May Allah accept this shared recitation from you all.
              </p>
              <div className="khatmah-complete-actions">
                <button className="primary-button" onClick={onBack}>View Khatmah history</button>
                <button className="ghost-button" onClick={onHome}>Back to home</button>
              </div>
            </section>
          ) : (
            <section className="khatmah-dashboard" aria-label="Shared progress">
              <div className="khatmah-progress-head">
                <div>
                  <span className="section-kicker">SHARED PROGRESS</span>
                  <h2>{percent}% complete</h2>
                </div>
                <button className="text-button" disabled={busy} onClick={() => void load()}>
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>
              <div className="khatmah-progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${percent}%` }} />
              </div>
              <div className="khatmah-stats">
                <div><strong>{completed}</strong><span>Completed juz</span></div>
                <div><strong>{30 - completed}</strong><span>Remaining juz</span></div>
                <div><strong>{participants.length}</strong><span>Participants</span></div>
              </div>
            </section>
          )}

          <section className="khatmah-participants" aria-labelledby="khatmah-participants-heading">
            <div className="khatmah-section-head">
              <h2 id="khatmah-participants-heading">Participants</h2>
              {isOwner && (
                <div className="khatmah-owner-controls">
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void run(() => autoAssignJuz(snapshot.khatmah.id), 'Available juz distributed')}
                  >
                    Auto-assign available juz
                  </button>
                  <label className="khatmah-toggle">
                    <input
                      type="checkbox"
                      checked={snapshot.khatmah.joining_open}
                      disabled={busy}
                      onChange={(event) => void run(() => setJoiningOpen(snapshot.khatmah.id, event.target.checked), 'Joining settings updated')}
                    />
                    Allow new participants
                  </label>
                </div>
              )}
            </div>
            <div className="khatmah-participant-list">
              {participants.map((participant) => {
                const mine = juz.filter((item) => item.assigned_to === participant.id).length
                const done = juz.filter((item) => item.assigned_to === participant.id && item.status === 'completed').length
                return (
                  <div className="khatmah-participant" key={participant.id}>
                    <span className="khatmah-avatar">{participant.display_name.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{participant.display_name}</strong>
                      <span>{participant.role === 'owner' ? 'Creator' : 'Participant'} · {done}/{mine} juz</span>
                    </div>
                    {participant.id === snapshot.currentParticipantId && !editingName && (
                      <button className="text-button" onClick={() => { setNameDraft(participant.display_name); setEditingName(true) }}>Edit name</button>
                    )}
                  </div>
                )
              })}
            </div>
            {editingName && currentName && (
              <form className="khatmah-name-form" onSubmit={handleNameSave}>
                <label htmlFor="khatmah-rename">Update your display name</label>
                <div className="khatmah-join-row">
                  <input id="khatmah-rename" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={60} />
                  <button className="ghost-button" disabled={busy}>Save</button>
                  <button type="button" className="text-button" onClick={() => setEditingName(false)}>Cancel</button>
                </div>
              </form>
            )}
          </section>

          <section className="khatmah-section" aria-labelledby="khatmah-juz-heading">
            <div className="khatmah-section-head">
              <div>
                <span className="section-kicker">THIRTY JUZ</span>
                <h2 id="khatmah-juz-heading">Juz assignments</h2>
              </div>
              <span className="khatmah-hint">
                Opening a juz in the reader never marks it complete.
              </span>
            </div>
            <div className="khatmah-juz-grid">
              {juz.length === 0 ? (
                <div className="khatmah-empty">
                  <p>No juz records were found for this Khatmah.</p>
                </div>
              ) : (
                juz.map((item) => (
                  <JuzCard
                    key={item.id}
                    juz={item}
                    participants={participants}
                    isOwner={isOwner}
                    currentParticipantId={snapshot.currentParticipantId}
                    busy={busy}
                    onAssign={(participantId) => void run(() => assignJuz(item.id, participantId))}
                    onSelect={() => void run(() => selfSelectJuz(item.id), 'Juz added to your journey')}
                    onStatus={(status: 'in_progress' | 'completed' | 'assigned') =>
                      void run(() => setJuzStatus(item.id, status), status === 'completed' ? 'Juz marked complete' : undefined)
                    }
                    onRead={(surah, ayah) => onOpenSurah(surah, ayah)}
                    onToast={onToast}
                  />
                ))
              )}
            </div>
          </section>

          <p className="khatmah-no-gamification">
            This is a shared act of worship, not a competition. Progress is recorded only when a
            participant deliberately marks a juz complete.
          </p>
        </>
      )}
    </div>
  )
}
