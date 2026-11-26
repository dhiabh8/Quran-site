import { Download, Share, PlusSquare, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDeferredInstallPrompt, isIosDevice, isStandaloneMode, onAppInstalled, onInstallPromptChange, promptInstall } from '../lib/pwa'

interface InstallAppCardProps {
  onToast: (message: string) => void
  compact?: boolean
}

export function InstallAppCard({ onToast, compact = false }: InstallAppCardProps) {
  const [canInstall, setCanInstall] = useState(Boolean(getDeferredInstallPrompt()))
  const [installed, setInstalled] = useState(isStandaloneMode())
  const [ios] = useState(isIosDevice())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const offPrompt = onInstallPromptChange((event) => setCanInstall(Boolean(event)))
    const offInstalled = onAppInstalled(() => {
      setInstalled(true)
      setCanInstall(false)
      onToast('تم تثبيت تطبيق نور بنجاح')
    })
    const media = window.matchMedia('(display-mode: standalone)')
    const handleMode = () => setInstalled(isStandaloneMode())
    media.addEventListener?.('change', handleMode)
    return () => {
      offPrompt()
      offInstalled()
      media.removeEventListener?.('change', handleMode)
    }
  }, [onToast])

  if (installed) {
    if (compact) return null
    return (
      <div className="install-card install-card--installed" aria-label="Application installed">
        <div className="install-card-icon"><CheckCircle2 size={20} /></div>
        <div>
          <strong>تطبيق نور مثبت</strong>
          <p>يمكنك فتح نور مباشرة من الشاشة الرئيسية بتجربة مستقلة.</p>
        </div>
      </div>
    )
  }

  if (!canInstall && !ios) return null

  const handleInstall = async () => {
    setBusy(true)
    try {
      const result = await promptInstall()
      if (result.outcome === 'accepted') onToast('جارٍ تثبيت تطبيق نور...')
      if (result.outcome === 'dismissed') onToast('تم إلغاء التثبيت')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`install-card ${compact ? 'install-card--compact' : ''}`} aria-label="Install Noor app">
      <div className="install-card-icon"><Download size={20} /></div>
      <div className="install-card-body">
        <strong>تثبيت تطبيق نور</strong>
        <p>
          ثبّت نور على جهازك للوصول السريع وتجربة أقرب للتطبيق، مع دعم للوصول إلى الموارد المحفوظة مسبقاً عند انقطاع الاتصال.
        </p>
        {ios && !canInstall && (
          <div className="install-ios-note" aria-label="iOS installation instructions">
            <span><Share size={15} /> اضغط <b>المشاركة</b></span>
            <span><PlusSquare size={15} /> ثم اختر <b>إضافة إلى الشاشة الرئيسية</b></span>
          </div>
        )}
        {canInstall && (
          <button className="install-button" onClick={handleInstall} disabled={busy}>
            <Download size={16} /> {busy ? '...' : 'تثبيت تطبيق نور'}
          </button>
        )}
      </div>
    </section>
  )
}
