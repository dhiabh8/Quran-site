export type KhatmahStatus = 'active' | 'completed'
export type KhatmahRole = 'owner' | 'participant'
export type JuzStatus = 'available' | 'assigned' | 'in_progress' | 'completed'

export interface Khatmah {
  id: string
  title: string
  description: string | null
  creator_id: string
  invite_code: string
  status: KhatmahStatus
  started_at: string | null
  target_date: string | null
  joining_open: boolean
  created_at: string
}

export interface KhatmahParticipant {
  id: string
  khatmah_id: string
  user_id: string
  display_name: string
  role: KhatmahRole
  joined_at: string
}

export interface KhatmahJuz {
  id: string
  khatmah_id: string
  juz_number: number
  assigned_to: string | null
  status: JuzStatus
  completed_at: string | null
  updated_by: string | null
  updated_at: string
}

export interface KhatmahPreview {
  id: string
  title: string
  description: string | null
  creator_display_name: string
  status: KhatmahStatus
  joining_open: boolean
  participant_count: number
  completed_count: number
  started_at: string | null
  target_date: string | null
  created_at: string
  viewer_is_member: boolean
  viewer_participant_id: string | null
}

export interface KhatmahSnapshot {
  khatmah: Khatmah
  participants: KhatmahParticipant[]
  juz: KhatmahJuz[]
  currentUserId: string
  currentParticipantId: string | null
  isOwner: boolean
}

export interface KhatmahListItem {
  id: string
  title: string
  status: KhatmahStatus
  invite_code: string
  participant_count: number
  completed_count: number
  viewer_role: KhatmahRole
  joined_at: string
}

export interface CreateKhatmahInput {
  title: string
  description: string
  creatorDisplayName: string
  startedAt: string | null
  targetDate: string | null
}
