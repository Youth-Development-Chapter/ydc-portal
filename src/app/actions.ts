'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { randomBytes } from 'crypto'
import { evaluateCriteria } from '@/lib/criteria'


/** 5 MB upload limit for proof images */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/** Accepted image MIME types */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

export async function claimTicket(eventId: string) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to claim a ticket.' }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, unit_id, custom_criteria, is_compulsory')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { error: 'Event not found.' }
  }
  if (event.is_compulsory) {
    return { error: 'This compulsory event is already assigned to eligible members.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('unit_id')
    .eq('id', user.id)
    .single()

  if (event.unit_id && event.unit_id !== profile?.unit_id) {
    return { error: 'This event is not available for your unit.' }
  }
  if (event.custom_criteria && Object.keys(event.custom_criteria).length > 0) {
    const criteria = await evaluateCriteria(supabase, user.id, event.custom_criteria)
    if (!criteria.eligible) {
      return { error: criteria.reason || 'You are not eligible for this event yet.' }
    }
  }

  // Generate a cryptographically random unique ticket code
  const randomHex = randomBytes(3).toString('hex').toUpperCase()
  const ticketCode = `TKT-${eventId.substring(0, 4).toUpperCase()}-${randomHex}`

  const { error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: user.id,
      ticket_code: ticketCode,
      attended: false
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')
  revalidateTag('events', 'max')
  return { success: true }
}

export async function logDeed(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to submit a deed.' }
  }

  const description = formData.get('description') as string
  const proofPic = formData.get('proof_pic') as File | null
  const localDate = formData.get('local_date') as string

  if (!description) {
    return { error: 'Description is required.' }
  }
  if (!proofPic || proofPic.size === 0) {
    return { error: 'Proof picture is required.' }
  }
  if (!localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    return { error: 'Invalid or missing local date.' }
  }

  // Server-side file validation
  if (proofPic.size > MAX_FILE_SIZE) {
    return { error: 'Proof image must be smaller than 5 MB.' }
  }
  if (!ALLOWED_MIME_TYPES.has(proofPic.type)) {
    return { error: 'Proof image must be a JPEG, PNG, WEBP, GIF, or HEIC file.' }
  }

  const userId = user.id

  // Enforce one submission per day (approved or pending status only)
  const { data: existingDeeds, error: queryError } = await supabase
    .from('deed_submissions')
    .select('id, status')
    .eq('user_id', userId)
    .eq('local_date', localDate)

  if (queryError) {
    return { error: `Database error checking existing deeds: ${queryError.message}` }
  }

  const validDeeds = existingDeeds ? existingDeeds.filter(d => d.status === 'approved' || d.status === 'pending') : []
  if (validDeeds.length >= 3) {
    return { error: 'Daily limit reached: You can only submit up to 3 deeds per day.' }
  }

  let proofUrl = ''

  // Upload proof picture to local Supabase Storage (deeds bucket)
  const fileExt = proofPic.name.split('.').pop()?.toLowerCase() || 'jpg'
  // Use a cryptographically random UUID for the file name to prevent
  // enumeration of uploaded files.
  const { randomUUID } = await import('crypto')
  const fileName = `${userId}/${randomUUID()}.${fileExt}`

  try {
    const arrayBuffer = await proofPic.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('deeds')
      .upload(fileName, buffer, {
        contentType: proofPic.type,
        upsert: true,
      })

    if (uploadError) {
      return { error: `Failed to upload proof image to Supabase Storage: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage
      .from('deeds')
      .getPublicUrl(fileName)

    proofUrl = publicUrlData.publicUrl
  } catch (uploadError: unknown) {
    return { error: `Failed to upload proof image: ${uploadError instanceof Error ? uploadError.message : 'Unknown upload error'}` }
  }

  // Insert deed submission record
  const { error: insertError } = await supabase
    .from('deed_submissions')
    .insert({
      user_id: userId,
      description,
      proof_url: proofUrl,
      status: 'pending',
      local_date: localDate
    })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/log-deed')
  revalidateTag('events', 'max')
  return { success: true }
}
