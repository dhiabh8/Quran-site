import { ArrowLeft, Sparkles } from 'lucide-react'
import { FEELINGS, getFeeling } from '../lib/feelings'
import type { FeelingId } from '../lib/types'
import './feelings.css'
import { FeelingIcon } from './FeelingIcon'

interface FeelingsHomeProps {
  onSelect: (id: FeelingId) => void
  recent: FeelingId[]
}

export function FeelingsHome({ onSelect, recent }: FeelingsHomeProps) {
  const recentFeelings = recent.map(getFeeling).filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <section className="feelings-section" aria-labelledby="feelings-heading">
      <div className="feelings-intro">
        <div>
          <span className="section-kicker">
            <Sparkles size={13} /> QURAN BY FEELINGS
          </span>
          <h2 id="feelings-heading">How are you feeling today?</h2>
          <p className="feelings-intro-ar" dir="rtl" lang="ar">
            كيف تشعر اليوم؟
          </p>
          <p className="feelings-intro-subtitle">
            Find comfort, reflection and guidance through the words of Allah.
          </p>
          <p className="feelings-intro-ar feelings-intro-ar--small" dir="rtl" lang="ar">
            اختر شعورك، واكتشف آيات تتدبّر معانيها.
          </p>
        </div>
        <p className="feelings-intro-note">
          A quiet way to connect with the Qur’an. Selections are for spiritual reflection, not
          medical or psychological advice.
        </p>
      </div>

      {recentFeelings.length > 0 && (
        <div className="feelings-recent">
          <span>Recently explored</span>
          {recentFeelings.map((feeling) => (
            <button key={feeling.id} onClick={() => onSelect(feeling.id)} className="feelings-recent-chip">
              {feeling.label}
            </button>
          ))}
        </div>
      )}

      <div className="feelings-grid">
        {FEELINGS.map((feeling) => (
          <button
            key={feeling.id}
            className="feeling-card"
            onClick={() => onSelect(feeling.id)}
            aria-label={`${feeling.label} — ${feeling.arabic}. ${feeling.description}`}
          >
            <span className="feeling-card-icon">
              <FeelingIcon id={feeling.id} />
            </span>
            <span className="feeling-card-text">
              <strong>{feeling.label}</strong>
              <span className="feeling-card-arabic" dir="rtl" lang="ar">
                {feeling.arabic}
              </span>
              <small>{feeling.description}</small>
            </span>
            <ArrowLeft size={16} className="feeling-card-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
}
