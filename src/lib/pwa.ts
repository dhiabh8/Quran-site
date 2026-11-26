export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type InstallListener = (event: BeforeInstallPromptEvent | null) => void
type InstalledListener = () => void

let deferredPrompt: BeforeInstallPromptEvent | null = null
const installListeners = new Set<InstallListener>()
const installedListeners = new Set<InstalledListener>()

function notifyInstallListeners() {
  installListeners.forEach((listener) => listener(deferredPrompt))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notifyInstallListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifyInstallListeners()
    installedListeners.forEach((listener) => listener())
  })
}

export function getDeferredInstallPrompt() {
  return deferredPrompt
}

export function onInstallPromptChange(listener: InstallListener) {
  installListeners.add(listener)
  listener(deferredPrompt)
  return () => installListeners.delete(listener)
}

export function onAppInstalled(listener: InstalledListener) {
  installedListeners.add(listener)
  return () => installedListeners.delete(listener)
}

export function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: 'unavailable' as const }
  const prompt = deferredPrompt
  deferredPrompt = null
  notifyInstallListeners()
  await prompt.prompt()
  const choice = await prompt.userChoice
  if (choice.outcome !== 'accepted') {
    // Browser may not fire beforeinstallprompt again immediately; keep UX stable.
    deferredPrompt = null
  }
  return choice
}

export function registerServiceWorker(onUpdateReady?: (registration: ServiceWorkerRegistration) => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      if (registration.waiting) onUpdateReady?.(registration)

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateReady?.(registration)
          }
        })
      })
    } catch {
      // Service worker registration is optional; app should continue normally.
    }
  })

  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

export function applyServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
}
