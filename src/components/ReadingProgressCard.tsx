import { Flame, Target, Trophy, BookOpenCheck, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { calculateStreak, getLocalDateKey, hasReadToday, type ReadingProgressState } from '../lib/readingProgress'

interface ReadingProgressCardProps {
  progress: ReadingProgressState
  onStartKhatmah: (targetDays: number) => void
  onCompleteKhatmah: () => void
  onAbandonKhatmah: () => void
  onContinue: () => void
}

const TARGET_PRESETS = [7, 15, 30, 60]

export function ReadingProgressCard({
  progress,
  onStartKhatmah,
  onCompleteKhatmah,
  onAbandonKhatmah,
  onContinue,
}: ReadingProgressCardProps) {
  const [targetDays, setTargetDays] = useState(30)
  const todayKey = getLocalDateKey()
  const streak = useMemo(() => calculateStreak(progress.activityByDate), [progress.activityByDate])
  const readToday = useMemo(() => hasReadToday(progress.activityByDate), [progress.activityByDate])
  const activePlan = progress.khatmah.activePlan
  const completedCount = progress.khatmah.completed.length

  const planDaysElapsed = useMemo(() => {
    if (!activePlan) return 0
    const start = activePlan.startDate
    const [y, m, d] = start.split('-').map(Number)
    const startUtc = Date.UTC(y, m - 1, d)
    const [ny, nm, nd] = todayKey.split('-').map(Number)
    const nowUtc = Date.UTC(ny, nm - 1, nd)
    return Math.max(1, Math.floor((nowUtc - startUtc) / 86_400_000) + 1)
  }, [activePlan, todayKey])

  const planPercent = activePlan ? Math.min(100, Math.round((planDaysElapsed / activePlan.targetDays) * 100)) : 0

  return (
    <section className="reading-progress-card" aria-label="Reading streak and khatmah">
      <div className="reading-progress-head">
        <div>
          <span className="section-kicker">READING JOURNEY</span>
          <h2>Streak & Khatmah</h2>
          <p className="reading-progress-subtitle">
            {readToday ? 'You have read today. Keep the momentum going.' : 'Read any ayah today to keep your streak alive.'}
          </p>
        </div>
        <button className="text-button" onClick={onContinue}>
          <BookOpenCheck size={16} /> Continue
        </button>
      </div>

      <div className="reading-progress-grid">
        <div className="reading-stat">
          <div className="reading-stat-icon reading-stat-icon--gold"><Flame size={18} /></div>
          <div>
            <strong>{streak.current}</strong>
            <span>Day streak</span>
          </div>
        </div>
        <div className="reading-stat">
          <div className="reading-stat-icon"><Trophy size={18} /></div>
          <div>
            <strong>{streak.best}</strong>
            <span>Best streak</span>
          </div>
        </div>
        <div className="reading-stat">
          <div className="reading-stat-icon reading-stat-icon--blue"><Target size={18} /></div>
          <div>
            <strong>{completedCount}</strong>
            <span>Khatmahs completed</span>
          </div>
        </div>
      </div>

      <div className="khatmah-panel">
        {activePlan ? (
          <>
            <div className="khatmah-panel-head">
              <div>
                <strong>Active Khatmah</strong>
                <p>
                  Day {Math.min(planDaysElapsed, activePlan.targetDays)} of {activePlan.targetDays} · Started {activePlan.startDate}
                </p>
              </div>
              <span className="khatmah-percent">{planPercent}%</span>
            </div>
            <div className="khatmah-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={activePlan.targetDays} aria-valuenow={Math.min(planDaysElapsed, activePlan.targetDays)}>
              <div className="khatmah-progress-fill" style={{ width: `${planPercent}%` }} />
            </div>
            <p className="khatmah-current">
              Current position: <b>{activePlan.currentSurahName}</b> · Ayah {activePlan.currentAyah}
            </p>
            <div className="khatmah-actions">
              <button className="install-button khatmah-action-primary" onClick={onCompleteKhatmah}>Mark Khatmah Complete</button>
              <button className="khatmah-action-secondary" onClick={onAbandonKhatmah}><RotateCcw size={14} /> Reset plan</button>
            </div>
          </>
        ) : (
          <>
            <div className="khatmah-panel-head">
              <div>
                <strong>Start a Khatmah</strong>
                <p>Set a target and track your journey locally on this device.</p>
              </div>
            </div>
            <div className="khatmah-targets" role="group" aria-label="Khatmah target days">
              {TARGET_PRESETS.map((days) => (
                <button
                  key={days}
                  className={`khatmah-target ${targetDays === days ? 'khatmah-target--active' : ''}`}
                  onClick={() => setTargetDays(days)}
                >
                  {days} days
                </button>
              ))}
            </div>
            <label className="khatmah-custom-target">
              <span>Custom days</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={targetDays}
                onChange={(e) => setTargetDays(Math.max(1, Math.min(3650, Number(e.target.value) || 1)))}
              />
            </label>
            <div className="khatmah-actions">
              <button className="install-button khatmah-action-primary" onClick={() => onStartKhatmah(targetDays)}>Start Khatmah</button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
