import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioBar } from './components/AudioBar'
import { Bookmarks } from './components/Bookmarks'
import { Home } from './components/Home'
import { Juz } from './components/Juz'
import { Reader } from './components/Reader'
import { SearchOverlay } from './components/SearchOverlay'
import { DEFAULT_SETTINGS, SettingsDrawer } from './components/SettingsDrawer'
import { Sidebar } from './components/Sidebar'
import { Surahs } from './components/Surahs'
import { Tasbih } from './components/Tasbih'
import { Topbar } from './components/Topbar'
import { fetchAudioForSurah, fetchSurahs } from './lib/api'
import type { Bookmark, LastRead, Settings, SurahDetail, SurahSummary, View } from './lib/types'
import { useStoredState } from './lib/useStoredState'

const VIEW_TITLES: Record<View, string> = {
  home: 'Overview',
  surahs: 'All Surahs',
  juz: 'Juz Index',
  tasbih: 'Tasbih',
  bookmarks: 'Bookmarks',
  reader: '',
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [surahs, setSurahs] = useState<SurahSummary[]>([])
  const [surahsLoading, setSurahsLoading] = useState(true)
  const [surahNumber, setSurahNumber] = useState(1)
  const [highlightAyah, setHighlightAyah] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null)

  const [settings, setSettings] = useStoredState<Settings>('noor.settings', DEFAULT_SETTINGS)
  const [bookmarks, setBookmarks] = useStoredState<Bookmark[]>('noor.bookmarks', [])
  const [lastRead, setLastRead] = useStoredState<LastRead | null>('noor.lastRead', null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const audioSurahRef = useRef<number | null>(null)
  const playingAyahRef = useRef<number | null>(null)
  const [audioSurah, setAudioSurah] = useState<number | null>(null)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const showToast = (message: string) => setToast(message)

  useEffect(() => {
    let active = true
    fetchSurahs()
      .then((data) => {
        if (active) setSurahs(data)
      })
      .catch(() => {
        if (active) showToast('Could not load surahs. Check your connection.')
      })
      .finally(() => {
        if (active) setSurahsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSettingsOpen(false)
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // When the reciter changes mid-recitation, swap the audio source in place.
  useEffect(() => {
    if (audioSurahRef.current === null || playingAyahRef.current === null) return
    let active = true
    const surah = audioSurahRef.current
    const ayah = playingAyahRef.current
    fetchAudioForSurah(surah, settings.reciter)
      .then((urls) => {
        if (!active || !audioRef.current || !urls[ayah - 1]) return
        const audio = audioRef.current
        const wasPlaying = !audio.paused
        audio.src = urls[ayah - 1]
        if (wasPlaying) void audio.play().catch(() => setIsPlaying(false))
      })
      .catch(() => setIsPlaying(false))
    return () => {
      active = false
    }
  }, [settings.reciter])

  const handleSurahLoaded = useCallback((detail: SurahDetail) => {
    setSurahDetail(detail)
  }, [])

  const openSurah = useCallback(
    (number: number, ayah?: number) => {
      setSurahNumber(number)
      setView('reader')
      setHighlightAyah(ayah ?? null)
      setSearchOpen(false)
      const meta = surahs.find((item) => item.number === number)
      setLastRead({
        surah: number,
        ayah: ayah ?? 1,
        surahName: meta?.englishName || `Surah ${number}`,
        timestamp: Date.now(),
      })
      window.scrollTo({ top: 0, behavior: 'auto' })
    },
    [surahs, setLastRead],
  )

  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const updateSettings = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }))

  const toggleBookmark = (bookmark: Omit<Bookmark, 'key' | 'createdAt'>) => {
    const key = `${bookmark.surah}:${bookmark.ayah}`
    const exists = bookmarks.some((item) => item.key === key)
    setBookmarks((current) =>
      exists
        ? current.filter((item) => item.key !== key)
        : [{ ...bookmark, key, createdAt: Date.now() }, ...current],
    )
    showToast(exists ? 'Bookmark removed' : 'Ayah bookmarked')
  }

  const playAyah = useCallback(
    (number: number) => {
      const detail = surahDetail
      const audio = audioRef.current
      if (!detail || !audio) return
      const ayah = detail.ayahs.find((item) => item.numberInSurah === number)
      if (!ayah?.audio) return

      if (audioSurahRef.current === detail.number && playingAyahRef.current === number) {
        if (audio.paused) {
          void audio.play().catch(() => setIsPlaying(false))
        } else {
          audio.pause()
        }
        return
      }

      audioSurahRef.current = detail.number
      playingAyahRef.current = number
      setAudioSurah(detail.number)
      setPlayingAyah(number)
      audio.src = ayah.audio
      audio.currentTime = 0
      setCurrentTime(0)
      setDuration(0)
      void audio.play().catch(() => setIsPlaying(false))
    },
    [surahDetail],
  )

  const stopAudio = () => {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.src = ''
    audioSurahRef.current = null
    playingAyahRef.current = null
    setAudioSurah(null)
    setPlayingAyah(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const skipAyah = (delta: number) => {
    if (playingAyah === null || !surahDetail || surahDetail.number !== audioSurah) return
    const next = playingAyah + delta
    if (next < 1 || next > surahDetail.numberOfAyahs) return
    playAyah(next)
  }

  const handleAudioEnded = () => {
    if (playingAyahRef.current !== null) skipAyah(1)
    if (playingAyahRef.current === surahDetail?.numberOfAyahs) {
      stopAudio()
    }
  }

  const togglePlayback = () => {
    if (playingAyah !== null && audioRef.current && audioSurah === surahNumber) {
      if (audioRef.current.paused) void audioRef.current.play().catch(() => setIsPlaying(false))
      else audioRef.current.pause()
    } else {
      playAyah(1)
    }
  }

  const audioSurahName = surahs.find((item) => item.number === audioSurah)?.englishName || 'Quran'

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onNavigate={navigate}
        lastRead={lastRead}
        onContinue={() => lastRead && openSurah(lastRead.surah, lastRead.ayah)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-shell">
        <Topbar
          view={view}
          title={VIEW_TITLES[view]}
          onBack={() => navigate('surahs')}
          onSearch={() => setSearchOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onMenu={() => setSidebarOpen(true)}
        />

        <main className="main-content">
          {view === 'home' && (
            <Home
              surahs={surahs}
              loading={surahsLoading}
              lastRead={lastRead}
              bookmarksCount={bookmarks.length}
              onOpenSurah={(number, ayah) => openSurah(number, ayah)}
              onNavigate={navigate}
            />
          )}
          {view === 'surahs' && (
            <Surahs surahs={surahs} loading={surahsLoading} onOpenSurah={(number) => openSurah(number)} />
          )}
          {view === 'juz' && (
            <Juz onOpenJuz={(surah, ayah) => openSurah(surah, ayah)} />
          )}
          {view === 'tasbih' && (
            <Tasbih
              onToast={showToast}
              theme={settings.theme}
              onToggleTheme={() =>
                updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
              }
            />
          )}
          {view === 'bookmarks' && (
            <Bookmarks
              bookmarks={bookmarks}
              onOpen={(surah, ayah) => openSurah(surah, ayah)}
              onRemove={(key) => setBookmarks((current) => current.filter((item) => item.key !== key))}
            />
          )}
          {view === 'reader' && (
            <Reader
              surahNumber={surahNumber}
              highlightAyah={highlightAyah}
              settings={settings}
              bookmarks={bookmarks}
              playingAyah={playingAyah}
              isPlaying={isPlaying}
              onSurahLoaded={handleSurahLoaded}
              onToggleBookmark={toggleBookmark}
              onPlayAyah={playAyah}
              onTogglePlayback={togglePlayback}
              onOpenSurah={(number) => openSurah(number)}
              onToast={showToast}
              onSettingChange={updateSettings}
              surahs={surahs}
            />
          )}

          <footer className="site-footer">
            <span>نور · Quran Explorer</span>
            <span>Made with care by <strong>Dhia</strong></span>
          </footer>
        </main>
      </div>

      <SearchOverlay
        open={searchOpen}
        surahs={surahs}
        onClose={() => setSearchOpen(false)}
        onOpenResult={(surah, ayah) => openSurah(surah, ayah)}
        onOpenSurah={(surah) => openSurah(surah)}
      />

      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
        onClose={() => setSettingsOpen(false)}
      />

      {audioSurah !== null && playingAyah !== null && (
        <AudioBar
          surahName={audioSurahName}
          ayah={playingAyah}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          reciter={settings.reciter}
          hasPrevious={playingAyah > 1}
          hasNext={playingAyah < (surahDetail?.number === audioSurah ? surahDetail.numberOfAyahs : 0)}
          onToggle={() => {
            const audio = audioRef.current
            if (!audio) return
            if (audio.paused) void audio.play().catch(() => setIsPlaying(false))
            else audio.pause()
          }}
          onPrevious={() => skipAyah(-1)}
          onNext={() => skipAyah(1)}
          onSeek={(time) => {
            if (audioRef.current) audioRef.current.currentTime = time
            setCurrentTime(time)
          }}
          onClose={stopAudio}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={handleAudioEnded}
      />
    </div>
  )
}
