import { Clock3, MapPin, Sunrise, Sun, Sunset, MoonStar, CloudSun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface PrayerTimings {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

interface AladhanResponse {
  code: number
  data?: {
    timings: PrayerTimings
    date: {
      readable: string
      hijri: {
        day: string
        month: { en: string }
        year: string
      }
    }
    meta?: {
      timezone?: string
    }
  }
}

interface PrayerRow {
  name: string
  time: string
  icon: typeof Sun
}

const DEFAULT_COORDS = { latitude: 21.4225, longitude: 39.8262, label: 'Makkah' }

function cleanTime(value: string) {
  return value.split(' ')[0]?.slice(0, 5) ?? value
}

function toMinutes(value: string) {
  const [hours, minutes] = cleanTime(value).split(':').map(Number)
  return hours * 60 + minutes
}

function formatNow(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function PrayerTimesCard() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null)
  const [hijri, setHijri] = useState('')
  const [locationLabel, setLocationLabel] = useState('Locating...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true

    const load = async (latitude: number, longitude: number, label: string) => {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          method: '2',
        })
        const response = await fetch(`https://api.aladhan.com/v1/timings?${params.toString()}`)
        if (!response.ok) throw new Error('Unable to load prayer times')
        const json = (await response.json()) as AladhanResponse
        if (!active) return
        if (json.code !== 200 || !json.data) throw new Error('Unable to load prayer times')
        setTimings(json.data.timings)
        setHijri(
          `${json.data.date.hijri.day} ${json.data.date.hijri.month.en} ${json.data.date.hijri.year} AH`,
        )
        setLocationLabel(label)
      } catch {
        if (active) setError('Prayer times unavailable right now.')
      } finally {
        if (active) setLoading(false)
      }
    }

    const fallback = () => {
      void load(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude, DEFAULT_COORDS.label)
    }

    if (!('geolocation' in navigator)) {
      fallback()
      return () => {
        active = false
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void load(position.coords.latitude, position.coords.longitude, 'Near you')
      },
      () => fallback(),
      { timeout: 5000, maximumAge: 600_000 },
    )

    return () => {
      active = false
    }
  }, [])

  const prayers = useMemo<PrayerRow[]>(() => {
    if (!timings) return []
    return [
      { name: 'Fajr', time: cleanTime(timings.Fajr), icon: CloudSun },
      { name: 'Sunrise', time: cleanTime(timings.Sunrise), icon: Sunrise },
      { name: 'Dhuhr', time: cleanTime(timings.Dhuhr), icon: Sun },
      { name: 'Asr', time: cleanTime(timings.Asr), icon: Sun },
      { name: 'Maghrib', time: cleanTime(timings.Maghrib), icon: Sunset },
      { name: 'Isha', time: cleanTime(timings.Isha), icon: MoonStar },
    ]
  }, [timings])

  const nextPrayer = useMemo(() => {
    if (prayers.length === 0) return null
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const upcoming = prayers.find((prayer) => prayer.name !== 'Sunrise' && toMinutes(prayer.time) > currentMinutes)
    return upcoming ?? prayers.find((prayer) => prayer.name === 'Fajr') ?? prayers[0]
  }, [prayers, now])

  return (
    <section className="prayer-times-card" aria-label="Prayer times">
      <div className="prayer-times-head">
        <div>
          <span className="section-kicker">PRAYER TIMES</span>
          <h2>Today&apos;s Prayer Times</h2>
          <p className="prayer-times-subtitle">
            <MapPin size={14} />
            <span>{locationLabel}</span>
            {hijri && <span className="prayer-times-dot">·</span>}
            {hijri && <span>{hijri}</span>}
          </p>
        </div>
        <div className="prayer-times-current">
          <span className="prayer-times-current-label">
            <Clock3 size={14} /> Local time
          </span>
          <strong>{formatNow(now)}</strong>
          {nextPrayer && <span>Next: {nextPrayer.name} {nextPrayer.time}</span>}
        </div>
      </div>

      {loading ? (
        <div className="prayer-times-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="prayer-time-item prayer-time-item--skeleton">
              <div className="skeleton-line w40" />
              <div className="skeleton-line w50" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="prayer-times-status">{error}</div>
      ) : (
        <div className="prayer-times-grid">
          {prayers.map((prayer) => {
            const Icon = prayer.icon
            const active = nextPrayer?.name === prayer.name
            return (
              <div key={prayer.name} className={`prayer-time-item ${active ? 'prayer-time-item--active' : ''}`}>
                <div className="prayer-time-name">
                  <span className="prayer-time-icon"><Icon size={15} /></span>
                  <span>{prayer.name}</span>
                </div>
                <strong>{prayer.time}</strong>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
