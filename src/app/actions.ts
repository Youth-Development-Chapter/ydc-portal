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

export async function logDeed(prevState: any, formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to submit a deed.' }
  }

  const description = formData.get('description') as string
  const proofPic = formData.get('proof_pic') as File | null

  if (!description) {
    return { error: 'Description is required.' }
  }
  if (!proofPic || proofPic.size === 0) {
    return { error: 'Proof picture is required.' }
  }

  let proofUrl = ''
  const userId = user.id

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
  } catch (uploadError: any) {
    return { error: `Failed to upload proof image to R2: ${uploadError.message}` }
  }

  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''
  const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl
  proofUrl = `${cleanBaseUrl}/${fileName}`

  // Insert deed submission record
  const { error: insertError } = await supabase
    .from('deed_submissions')
    .insert({
      user_id: userId,
      description,
      proof_url: proofUrl,
      status: 'pending'
    })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

