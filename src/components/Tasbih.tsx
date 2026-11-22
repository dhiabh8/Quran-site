import {
  Check,
  Moon,
  Plus,
  RotateCcw,
  Settings2,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Target,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Theme } from '../lib/types'
import { useStoredState } from '../lib/useStoredState'
import './tasbih.css'

interface TasbihProps {
  onToast: (message: string) => void
  theme: Theme
  onToggleTheme: () => void
}

interface Dhikr {
  id: string
  arabic: string
  translation: string
  explanation: string
  category: string
  suggestedTarget: number
  favorite: boolean
  custom?: boolean
}

interface FeedbackSettings {
  sound: boolean
  vibration: boolean
}

const DEFAULT_DHIKRS: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سبحان الله',
    translation: 'Glory be to Allah',
    explanation: 'تنزيه الله سبحانه وتعالى عن كل نقص وعيب.',
    category: 'تسبيح',
    suggestedTarget: 33,
    favorite: true,
  },
  {
    id: 'alhamdulillah',
    arabic: 'الحمد لله',
    translation: 'All praise is for Allah',
    explanation: 'الثناء على الله بصفات الكمال ونعمه.',
    category: 'تحميد',
    suggestedTarget: 33,
    favorite: true,
  },
  {
    id: 'allahuakbar',
    arabic: 'الله أكبر',
    translation: 'Allah is the Greatest',
    explanation: 'تعظيم الله وتكبيره فوق كل كبير.',
    category: 'تكبير',
    suggestedTarget: 33,
    favorite: false,
  },
  {
    id: 'astaghfirullah',
    arabic: 'أستغفر الله',
    translation: 'I seek forgiveness from Allah',
    explanation: 'طلب المغفرة من الله سبحانه وتعالى.',
    category: 'استغفار',
    suggestedTarget: 100,
    favorite: false,
  },
  {
    id: 'laillahaillallah',
    arabic: 'لا إله إلا الله',
    translation: 'There is no deity except Allah',
    explanation: 'إفراد الله بالعبادة ونفي الشرك عنه.',
    category: 'توحيد',
    suggestedTarget: 100,
    favorite: true,
  },
  {
    id: 'subhanallahibihamdi',
    arabic: 'سبحان الله وبحمده',
    translation: 'Glory be to Allah and praise Him',
    explanation: 'جمع بين التنزيه والحمد لله سبحانه.',
    category: 'تسبيح وحمد',
    suggestedTarget: 100,
    favorite: false,
  },
]

const PRESET_TARGETS = [33, 99, 100, 1000]
const MAX_COUNT = 999999

function createAudioContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

export function Tasbih({ onToast, theme, onToggleTheme }: TasbihProps) {
  const [library, setLibrary] = useStoredState<Dhikr[]>('noor.tasbih.library.v2', DEFAULT_DHIKRS)
  const [selectedId, setSelectedId] = useStoredState<string>('noor.tasbih.selected.v2', 'subhanallah')
  const [count, setCount] = useStoredState<number>('noor.tasbih.count.v2', 0)
  const [target, setTarget] = useStoredState<number>('noor.tasbih.target.v2', 33)
  const [feedback, setFeedback] = useStoredState<FeedbackSettings>('noor.tasbih.feedback.v2', {
    sound: false,
    vibration: true,
  })

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [customTarget, setCustomTarget] = useState('')
  const [targetError, setTargetError] = useState('')
  const [form, setForm] = useState({ arabic: '', translation: '', explanation: '', target: '100' })
  const [formError, setFormError] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const [pressed, setPressed] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const previousCount = useRef(count)

  const dhikr = library.find((item) => item.id === selectedId) || library[0] || DEFAULT_DHIKRS[0]
  const safeTarget = Math.max(1, Math.min(target, MAX_COUNT))
  const percent = Math.min(100, Math.round((count / safeTarget) * 100))
  const remaining = Math.max(0, safeTarget - count)

  useEffect(() => {
    if (previousCount.current < safeTarget && count >= safeTarget) {
      setShowCompletion(true)
    }
    previousCount.current = count
  }, [count, safeTarget])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setTargetOpen(false)
      setResetOpen(false)
      setAdding(false)
      setSettingsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const playTick = () => {
    if (!feedback.sound) return
    try {
      let context = audioCtxRef.current
      if (!context) {
        context = createAudioContext()
        if (!context) return
        audioCtxRef.current = context
      }
      if (context.state === 'suspended') void context.resume()
      const now = context.currentTime
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(760, now)
      oscillator.frequency.exponentialRampToValueAtTime(480, now + 0.09)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.14)
    } catch {
      // Sound feedback is optional; ignore unsupported audio environments.
    }
  }

  const increment = () => {
    setCount((current) => Math.min(current + 1, MAX_COUNT))
    if (feedback.vibration && 'vibrate' in navigator) navigator.vibrate(12)
    playTick()
    setPressed(true)
    window.setTimeout(() => setPressed(false), 140)
  }

  const applyTarget = (value: number) => {
    setTarget(Math.max(1, Math.min(value, MAX_COUNT)))
    setTargetOpen(false)
    setCustomTarget('')
    setTargetError('')
  }

  const applyCustomTarget = () => {
    const value = Number(customTarget)
    if (!Number.isInteger(value) || value < 1 || value > MAX_COUNT) {
      setTargetError('أدخل رقماً صحيحاً بين 1 و 999999')
      return
    }
    applyTarget(value)
  }

  const selectDhikr = (id: string) => {
    const chosen = library.find((item) => item.id === id)
    if (!chosen) return
    setSelectedId(id)
    setTarget(chosen.suggestedTarget)
  }

  const toggleFavorite = (id: string) => {
    setLibrary((current) =>
      current.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)),
    )
  }

  const addCustomDhikr = () => {
    const arabic = form.arabic.trim()
    const value = Number(form.target)
    if (!arabic) {
      setFormError('أدخل نص الذكر')
      return
    }
    if (!Number.isInteger(value) || value < 1 || value > MAX_COUNT) {
      setFormError('أدخل هدفاً صحيحاً بين 1 و 999999')
      return
    }
    const item: Dhikr = {
      id: `custom-${Date.now()}`,
      arabic,
      translation: form.translation.trim() || 'Custom dhikr',
      explanation: form.explanation.trim() || 'ذكر مضاف بواسطة المستخدم.',
      category: 'مخصص',
      suggestedTarget: value,
      favorite: false,
      custom: true,
    }
    setLibrary((current) => [...current, item])
    setSelectedId(item.id)
    setTarget(value)
    setAdding(false)
    setForm({ arabic: '', translation: '', explanation: '', target: '100' })
    setFormError('')
    onToast('تمت إضافة الذكر')
  }

  const confirmReset = () => {
    setCount(0)
    setShowCompletion(false)
    setResetOpen(false)
    onToast('تم إعادة التصفير')
  }

  return (
    <div className="tsb-page" dir="rtl" data-theme={theme}>
      <div className="tsb-session">
        <header className="tsb-header">
          <div className="tsb-header-title">
            <span className="tsb-emblem" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="24" cy="24" r="21" />
                <path d="M24 5 29 19 43 24 29 29 24 43 19 29 5 24 19 19Z" />
                <circle cx="24" cy="24" r="5" />
              </svg>
            </span>
            <div>
              <h1>المسبحة الإلكترونية</h1>
              <p>جلسة ذكر هادئة</p>
            </div>
          </div>
          <div className="tsb-header-actions">
            <button
              className="tsb-icon-button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              aria-label="إعدادات الجلسة"
            >
              <Settings2 size={18} />
            </button>
            <button className="tsb-icon-button" onClick={onToggleTheme} aria-label="تبديل المظهر">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {settingsOpen && (
          <div className="tsb-settings">
            <div className="tsb-settings-head">
              <h2>إعدادات الجلسة</h2>
              <button className="tsb-icon-button" onClick={() => setSettingsOpen(false)} aria-label="إغلاق">
                <X size={15} />
              </button>
            </div>
            <div className="tsb-setting-row">
              <span>الصوت عند كل تسبيحة</span>
              <button
                className="tsb-switch"
                role="switch"
                aria-checked={feedback.sound}
                aria-label="الصوت"
                onClick={() => setFeedback((current) => ({ ...current, sound: !current.sound }))}
              >
                <i />
              </button>
            </div>
            <div className="tsb-setting-row">
              <span>الاهتزاز عند كل تسبيحة</span>
              <button
                className="tsb-switch"
                role="switch"
                aria-checked={feedback.vibration}
                aria-label="الاهتزاز"
                onClick={() => setFeedback((current) => ({ ...current, vibration: !current.vibration }))}
              >
                <i />
              </button>
            </div>
            <div className="tsb-setting-row tsb-setting-info">
              {feedback.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {feedback.vibration ? <Smartphone size={16} /> : null}
              <span>تحفظ الإعدادات تلقائياً على هذا الجهاز.</span>
            </div>
          </div>
        )}

        <section className="tsb-card tsb-dhikr-card" aria-label="الذكر الحالي">
          <div className="tsb-card-top">
            <span className="tsb-label">الذكر الحالي</span>
            <span className="tsb-category">{dhikr.category}</span>
          </div>
          <p className="tsb-dhikr-arabic" dir="rtl">{dhikr.arabic}</p>
          <p className="tsb-dhikr-translation">{dhikr.translation}</p>
          <p className="tsb-dhikr-explanation">{dhikr.explanation}</p>
          <span className="tsb-target-chip">الهدف: {safeTarget}</span>
        </section>

        <section className="tsb-card tsb-counter-card" aria-label="العداد">
          <div className="tsb-counter-label">العدد</div>
          <div className="tsb-counter" aria-live="polite" aria-atomic="true">
            <span key={count} className="tsb-counter-number">{count}</span>
          </div>
          <div className="tsb-counter-target">{count} / {safeTarget}</div>

          <div
            className="tsb-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={safeTarget}
            aria-valuenow={Math.min(count, safeTarget)}
            aria-label="نسبة الإنجاز"
          >
            <div className="tsb-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="tsb-progress-meta">
            <span>{percent}%</span>
            <span>المتبقي: {remaining}</span>
          </div>

          <div className="tsb-tap-wrap">
            <button
              className={`tsb-tap-button ${pressed ? 'is-pressed' : ''}`}
              onClick={increment}
              aria-label={`تسبيح، العدد الحالي ${count}`}
            >
              <span className="tsb-tap-plus"><Plus size={22} strokeWidth={2.2} /></span>
              <span className="tsb-tap-label">تسبيح</span>
            </button>
          </div>
          <p className="tsb-tap-hint">اضغط للتسبيح · Space أو Enter أيضاً</p>
        </section>

        {showCompletion && (
          <section className="tsb-completion" role="status">
            <Sparkles size={18} aria-hidden="true" />
            <p>تقبل الله ذكرك</p>
            <small>أكملت {count} من {safeTarget} تسبيحة</small>
            <div className="tsb-completion-actions">
              <button onClick={() => setShowCompletion(false)}>متابعة</button>
              <button onClick={() => setResetOpen(true)}>جلسة جديدة</button>
            </div>
          </section>
        )}

        <div className="tsb-controls">
          <button className="tsb-control" onClick={() => setCount((current) => Math.max(0, current - 1))} disabled={count === 0}>
            <Undo2 size={18} />
            <span>التراجع</span>
          </button>
          <button className="tsb-control" onClick={() => setResetOpen(true)}>
            <RotateCcw size={18} />
            <span>إعادة التصفير</span>
          </button>
          <button className="tsb-control" onClick={() => setTargetOpen(true)}>
            <Target size={18} />
            <span>تغيير الهدف</span>
          </button>
        </div>

        <section className="tsb-card tsb-library" aria-label="مكتبة الأذكار">
          <div className="tsb-library-head">
            <h2>مكتبة الأذكار</h2>
            <button className="tsb-add-button" onClick={() => setAdding((open) => !open)} aria-expanded={adding}>
              <Plus size={14} /> إضافة ذكر
            </button>
          </div>

          <div className="tsb-dhikr-list">
            {library.map((item) => (
              <div key={item.id} className={`tsb-dhikr-row ${item.id === dhikr.id ? 'tsb-dhikr-row--active' : ''}`}>
                <button className="tsb-dhikr-select" onClick={() => selectDhikr(item.id)}>
                  <strong dir="rtl">{item.arabic}</strong>
                  <small>{item.translation} · الهدف {item.suggestedTarget}</small>
                </button>
                {item.id === dhikr.id && <Check size={15} color="var(--tsb-gold)" aria-hidden="true" />}
                <button
                  className={`tsb-fav ${item.favorite ? 'tsb-fav--on' : ''}`}
                  onClick={() => toggleFavorite(item.id)}
                  aria-label={item.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                >
                  <Star size={16} fill={item.favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>

          {adding && (
            <div className="tsb-add-form">
              <input
                className="tsb-input"
                dir="rtl"
                value={form.arabic}
                onChange={(event) => setForm((current) => ({ ...current, arabic: event.target.value }))}
                placeholder="نص الذكر"
                aria-label="نص الذكر"
              />
              <input
                className="tsb-input"
                value={form.translation}
                onChange={(event) => setForm((current) => ({ ...current, translation: event.target.value }))}
                placeholder="الترجمة (اختياري)"
                aria-label="الترجمة"
              />
              <input
                className="tsb-input"
                dir="rtl"
                value={form.explanation}
                onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))}
                placeholder="الشرح (اختياري)"
                aria-label="الشرح"
              />
              <input
                className="tsb-input"
                type="number"
                min="1"
                max={MAX_COUNT}
                value={form.target}
                onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}
                placeholder="الهدف المقترح"
                aria-label="الهدف المقترح"
              />
              {formError && <p className="tsb-error" role="alert">{formError}</p>}
              <div className="tsb-form-actions">
                <button className="tsb-form-submit" onClick={addCustomDhikr}>إضافة</button>
                <button className="tsb-form-cancel" onClick={() => { setAdding(false); setFormError('') }}>إلغاء</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {targetOpen && (
        <div className="tsb-modal" role="presentation" onClick={() => setTargetOpen(false)}>
          <div className="tsb-modal-card" role="dialog" aria-modal="true" aria-labelledby="tsb-target-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="tsb-target-title">تغيير الهدف</h2>
            <p>اختر هدفاً جاهزاً أو أدخل رقماً مخصصاً. لن يتم تغيير العدد الحالي.</p>
            <div className="tsb-target-options">
              {PRESET_TARGETS.map((value) => (
                <button key={value} className={safeTarget === value ? 'tsb-selected' : ''} onClick={() => applyTarget(value)} autoFocus={value === PRESET_TARGETS[0]}>
                  {value}
                </button>
              ))}
            </div>
            <input
              className="tsb-input"
              type="number"
              min="1"
              max={MAX_COUNT}
              inputMode="numeric"
              value={customTarget}
              onChange={(event) => { setCustomTarget(event.target.value); setTargetError('') }}
              onKeyDown={(event) => { if (event.key === 'Enter') applyCustomTarget() }}
              placeholder="هدف مخصص"
              aria-label="هدف مخصص"
            />
            {targetError && <p className="tsb-error" role="alert">{targetError}</p>}
            <div className="tsb-modal-actions">
              <button className="tsb-btn-primary" onClick={applyCustomTarget}>تطبيق</button>
              <button className="tsb-btn-secondary" onClick={() => setTargetOpen(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {resetOpen && (
        <div className="tsb-modal" role="presentation" onClick={() => setResetOpen(false)}>
          <div className="tsb-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="tsb-reset-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="tsb-reset-title">إعادة التصفير؟</h2>
            <p>سيتم ضبط العدد الحالي ({count}) إلى صفر. لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="tsb-modal-actions">
              <button className="tsb-btn-danger" onClick={confirmReset} autoFocus>إعادة التصفير</button>
              <button className="tsb-btn-secondary" onClick={() => setResetOpen(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
