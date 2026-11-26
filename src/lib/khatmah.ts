import { requireSupabase, supabase } from './supabase'
import type {
  CreateKhatmahInput,
  Khatmah,
  KhatmahJuz,
  KhatmahListItem,
  KhatmahParticipant,
  KhatmahPreview,
  KhatmahSnapshot,
  JuzStatus,
} from './khatmahTypes'

function message(error: { message?: string } | null, fallback: string) {
  return error?.message || fallback
}

/** Signs in an anonymous user only when needed; the session persists in this browser. */
export async function ensureAnonymousIdentity(): Promise<string> {
  const client = requireSupabase()
  const { data, error } = await client.auth.getUser()
  if (error) throw new Error(message(error, 'Could not check your session.'))
  if (data.user) return data.user.id

  const { data: created, error: signInError } = await client.auth.signInAnonymously()
  if (signInError || !created.user) {
    throw new Error(message(signInError, 'Anonymous sign-in is not available. Ask the site owner to enable it in Supabase.'))
  }
  return created.user.id
}

export async function getKhatmahPreview(inviteCode: string): Promise<KhatmahPreview> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_khatmah_preview', { p_invite_code: inviteCode.trim() })
  if (error || !data) {
    throw new Error('This invitation link is invalid or the Khatmah is no longer available.')
  }
  return data as KhatmahPreview
}

export async function getKhatmahSnapshot(id: string): Promise<KhatmahSnapshot> {
  const client = requireSupabase()
  const userId = await ensureAnonymousIdentity()

  const [khatmahResult, participantsResult, juzResult] = await Promise.all([
    client.from('khatmahs').select('*').eq('id', id).maybeSingle(),
    client.from('khatmah_participants').select('*').eq('khatmah_id', id).order('joined_at'),
    client.from('khatmah_juz').select('*').eq('khatmah_id', id).order('juz_number'),
  ])

  if (khatmahResult.error || !khatmahResult.data) {
    throw new Error('This Khatmah was not found, or you are not a member of it.')
  }
  if (participantsResult.error || juzResult.error) {
    throw new Error('Could not load this Khatmah. Please try again.')
  }

  const khatmah = khatmahResult.data as Khatmah
  const participants = (participantsResult.data ?? []) as KhatmahParticipant[]
  const juz = (juzResult.data ?? []) as KhatmahJuz[]
  const currentParticipant = participants.find((item) => item.user_id === userId) ?? null

  return {
    khatmah,
    participants,
    juz,
    currentUserId: userId,
    currentParticipantId: currentParticipant?.id ?? null,
    isOwner: currentParticipant?.role === 'owner' || khatmah.creator_id === userId,
  }
}

export async function createKhatmah(input: CreateKhatmahInput): Promise<{ id: string; inviteCode: string }> {
  const client = requireSupabase()
  await ensureAnonymousIdentity()
  const { data, error } = await client.rpc('create_khatmah', {
    p_title: input.title.trim(),
    p_description: input.description.trim() || null,
    p_creator_display_name: input.creatorDisplayName.trim(),
    p_started_at: input.startedAt || null,
    p_target_date: input.targetDate || null,
  })
  if (error || !data) throw new Error(message(error, 'Could not create the Khatmah. Please try again.'))
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.invite_code) throw new Error('The Khatmah was created but no invitation link was returned.')
  return { id: row.id as string, inviteCode: row.invite_code as string }
}

export async function joinKhatmah(inviteCode: string, displayName: string): Promise<void> {
  const client = requireSupabase()
  await ensureAnonymousIdentity()
  const { error } = await client.rpc('join_khatmah', {
    p_invite_code: inviteCode.trim(),
    p_display_name: displayName.trim(),
  })
  if (error) throw new Error(message(error, 'Could not join this Khatmah. Please try again.'))
}

export async function assignJuz(juzId: string, participantId: string | null): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.rpc('assign_juz', {
    p_juz_id: juzId,
    p_participant_id: participantId,
  })
  if (error) throw new Error(message(error, 'Could not update this assignment.'))
}

export async function autoAssignJuz(khatmahId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.rpc('auto_assign_juz', { p_khatmah_id: khatmahId })
  if (error) throw new Error(message(error, 'Could not distribute the available juz.'))
}

export async function selfSelectJuz(juzId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.rpc('self_select_juz', { p_juz_id: juzId })
  if (error) throw new Error(message(error, 'That juz may no longer be available.'))
}

export async function setJuzStatus(juzId: string, status: JuzStatus): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.rpc('set_juz_status', { p_juz_id: juzId, p_status: status })
  if (error) throw new Error(message(error, 'Could not update your progress.'))
}

export async function setJoiningOpen(khatmahId: string, open: boolean): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.rpc('set_joining_open', {
    p_khatmah_id: khatmahId,
    p_open: open,
  })
  if (error) throw new Error(message(error, 'Could not update joining settings.'))
}

export async function updateDisplayName(participantId: string, displayName: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client
    .from('khatmah_participants')
    .update({ display_name: displayName.trim() })
    .eq('id', participantId)
  if (error) throw new Error(message(error, 'Could not update your display name.'))
}

export async function listMyKhatmahs(): Promise<KhatmahListItem[]> {
  const client = requireSupabase()
  await ensureAnonymousIdentity()
  const { data, error } = await client.rpc('list_my_khatmahs')
  if (error) throw new Error(message(error, 'Could not load your Khatmahs. Please try again.'))
  return (data ?? []) as KhatmahListItem[]
}

export function khatmahInviteUrl(inviteCode: string): string {
  return `${window.location.origin}/khatmah/${encodeURIComponent(inviteCode)}`
}

/** Live updates for khatmah metadata, participants and juz progress. */
export function subscribeToKhatmah(
  id: string,
  onChange: () => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  const client = supabase
  if (!client) return () => undefined

  const channel = client
    .channel(`khatmah:${id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'khatmah_juz', filter: `khatmah_id=eq.${id}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'khatmah_participants', filter: `khatmah_id=eq.${id}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'khatmahs', filter: `id=eq.${id}` },
      onChange,
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onStatus?.(true)
        onChange()
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onStatus?.(false)
      }
    })

  return () => {
    void client.removeChannel(channel)
  }
}
