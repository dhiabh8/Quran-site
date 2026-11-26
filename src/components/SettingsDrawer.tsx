import { Moon, RotateCcw, Sun, X } from 'lucide-react'
import { RECITERS, TAFSIR_SOURCES } from '../lib/api'
import type { Settings, TafsirSourceId } from '../lib/types'
import { InstallAppCard } from './InstallAppCard'

interface SettingsDrawerProps {
  open: boolean
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onReset: () => void
  onClose: () => void
  onToast: (message: string) => void
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  arabicFontSize: 38,
  showTranslation: true,
  showTransliteration: false,
  reciter: 'ar.alafasy',
  tafsirSource: 'ibnkathir',
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

export function SettingsDrawer({ open, settings, onChange, onReset, onClose, onToast }: SettingsDrawerProps) {
  return (
    <>
      {open && <button className="drawer-scrim" onClick={onClose} aria-label="Close settings" />}
      <aside className={`settings-drawer ${open ? 'settings-drawer--open' : ''}`}>
        <div className="drawer-head">
          <div>
            <span className="section-kicker">PREFERENCES</span>
            <h2>Reading settings</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          <div className="setting-group">
            <label className="setting-label">التطبيق</label>
            <InstallAppCard onToast={onToast} compact />
          </div>
          <div className="setting-group">
            <label className="setting-label">Appearance</label>
            <div className="theme-switch">
              <button
                className={settings.theme === 'dark' ? 'theme-option theme-option--active' : 'theme-option'}
                onClick={() => onChange({ theme: 'dark' })}
              >
                <Moon size={18} /> Night
              </button>
              <button
                className={settings.theme === 'light' ? 'theme-option theme-option--active' : 'theme-option'}
                onClick={() => onChange({ theme: 'light' })}
              >
                <Sun size={18} /> Day
              </button>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label" htmlFor="reciter">Reciter</label>
            <select
              id="reciter"
              className="select-input"
              value={settings.reciter}
              onChange={(event) => onChange({ reciter: event.target.value })}
            >
              {RECITERS.map((reciter) => (
                <option key={reciter.id} value={reciter.id}>
                  {reciter.name} · {reciter.native}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label" htmlFor="tafsir-source">Default tafsir</label>
            <select
              id="tafsir-source"
              className="select-input"
              value={settings.tafsirSource}
              onChange={(event) => onChange({ tafsirSource: event.target.value as TafsirSourceId })}
            >
              {TAFSIR_SOURCES.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name} · {source.author}
                </option>
              ))}
            </select>
            <p className="setting-hint">Authentic Arabic tafsir from Quran.com.</p>
          </div>

          <div className="setting-group">
            <div className="setting-row">
              <label className="setting-label" htmlFor="font-size">Arabic text size</label>
              <span className="setting-value">{settings.arabicFontSize}px</span>
            </div>
            <input
              id="font-size"
              className="range-input"
              type="range"
              min="28"
              max="54"
              step="2"
              value={settings.arabicFontSize}
              onChange={(event) => onChange({ arabicFontSize: Number(event.target.value) })}
            />
            <div className="range-labels"><span>Small</span><span>Large</span></div>
          </div>

          <div className="setting-group setting-group--divided">
            <div className="setting-row">
              <div>
                <div className="setting-title">English translation</div>
                <p className="setting-hint">Show Sahih International translation</p>
              </div>
              <Toggle
                label="English translation"
                checked={settings.showTranslation}
                onChange={(value) => onChange({ showTranslation: value })}
              />
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-title">Transliteration</div>
                <p className="setting-hint">Show Latin pronunciation guide</p>
              </div>
              <Toggle
                label="Transliteration"
                checked={settings.showTransliteration}
                onChange={(value) => onChange({ showTransliteration: value })}
              />
            </div>
          </div>

          <button className="reset-button" onClick={onReset}>
            <RotateCcw size={16} /> Reset to defaults
          </button>
        </div>
      </aside>
    </>
  )
}
