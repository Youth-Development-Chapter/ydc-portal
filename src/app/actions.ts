'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2'

export async function claimTicket(eventId: string) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to claim a ticket.' }
  }

  // Generate a random unique ticket code
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
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

  const hasDuplicate = existingDeeds && existingDeeds.some(d => d.status === 'approved' || d.status === 'pending')
  if (hasDuplicate) {
    return { error: 'You have already submitted a deed for today.' }
  }

  let proofUrl = ''

  // Resolve the public-read URL for R2 BEFORE the upload, so a missing
  // env var fails loudly instead of silently writing a broken URL into
  // the database. The R2 API endpoint (`*.r2.cloudflarestorage.com`)
  // is not browser-readable — `CLOUDFLARE_R2_PUBLIC_URL` must point at
  // an r2.dev subdomain or a custom domain that serves the bucket
  // publicly.
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL
  if (!publicBaseUrl || publicBaseUrl.includes('your-r2-public-url')) {
    return {
      error:
        'Server misconfiguration: CLOUDFLARE_R2_PUBLIC_URL is not set to a real R2 public URL. Contact an admin.',
    }
  }
  const cleanBaseUrl = publicBaseUrl.endsWith('/')
    ? publicBaseUrl.slice(0, -1)
    : publicBaseUrl

  // Upload proof picture to Cloudflare R2
  const fileExt = proofPic.name.split('.').pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`

  try {
    const arrayBuffer = await proofPic.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: proofPic.type,
      })
    )
  } catch (uploadError: unknown) {
    return { error: `Failed to upload proof image to R2: ${uploadError instanceof Error ? uploadError.message : 'Unknown upload error'}` }
  }

  proofUrl = `${cleanBaseUrl}/${fileName}`

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
  redirect('/dashboard')
}

