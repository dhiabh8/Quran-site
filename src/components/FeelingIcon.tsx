import {
  CloudRain,
  Compass,
  Heart,
  Mountain,
  RotateCcw,
  Shield,
  Sun,
  Sunrise,
  Waves,
  Wind,
} from 'lucide-react'
import type { FeelingId } from '../lib/types'

const ICONS = {
  sad: CloudRain,
  anxious: Wind,
  grateful: Sun,
  lost: Compass,
  hopeful: Sunrise,
  peace: Waves,
  afraid: Shield,
  lonely: Heart,
  overwhelmed: Mountain,
  repentant: RotateCcw,
} as const

export function FeelingIcon({ id, size = 24 }: { id: FeelingId; size?: number }) {
  const Icon = ICONS[id]
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />
}
