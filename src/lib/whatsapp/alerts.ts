import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Send a generic text message to a user JID on WhatsApp if the socket connection is active.
 */
export async function sendWhatsAppAlert(phone: string, text: string): Promise<boolean> {
  const socket = (globalThis as any).whatsappSocket;
  if (!socket) {
    console.warn('[WhatsApp Alert] Socket not active. Notification skipped:', text);
    return false;
  }

  try {
    let cleaned = phone.replace('+', '').trim();
    if (!cleaned) return false;
    // Format JID correctly
    const jid = cleaned.includes('@') ? cleaned : `${cleaned}@s.whatsapp.net`;
    await socket.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error('[WhatsApp Alert] Error sending message:', err);
    return false;
  }
}

/**
 * Notify a user that their deed submission has been approved or rejected.
 */
export async function notifyDeedStatus(
  userId: string,
  status: 'approved' | 'rejected',
  coinsEarned: number,
  notes?: string
) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, whatsapp, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;
    const phone = profile.whatsapp || profile.phone;
    if (!phone) return;

    let message = '';
    if (status === 'approved') {
      message = `🌟 *Deed Approved!* \n\nSalam *${profile.full_name}*, your submitted daily deed has been approved by an admin! \n\n🪙 *Coins Awarded:* +${coinsEarned} YDC Coins\n📝 *Notes:* ${notes || 'Keep up the excellent work!'}`;
    } else {
      message = `⚠️ *Deed Rejected* \n\nSalam *${profile.full_name}*, your submitted daily deed was reviewed and rejected.\n\n📝 *Reason:* ${notes || 'Please ensure you submit a clear proof image of your deed.'}`;
    }

    await sendWhatsAppAlert(phone, message);
  } catch (err) {
    console.error('[WhatsApp Alert] notifyDeedStatus error:', err);
  }
}

/**
 * Notify a user about manual coin adjustment.
 */
export async function notifyCoinAdjustment(
  userId: string,
  amount: number,
  reason: string
) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, whatsapp, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;
    const phone = profile.whatsapp || profile.phone;
    if (!phone) return;

    const changeText = amount > 0 ? `+${amount} YDC Coins added` : `${amount} YDC Coins deducted`;
    const message = `🪙 *YDC Coin Wallet Update* \n\nSalam *${profile.full_name}*, an administrator has adjusted your coin balance.\n\n💼 *Adjustment:* ${changeText}\n📝 *Reason:* ${reason}`;

    await sendWhatsAppAlert(phone, message);
  } catch (err) {
    console.error('[WhatsApp Alert] notifyCoinAdjustment error:', err);
  }
}

/**
 * Notify a user about successful event check-in and attendance reward.
 */
export async function notifyEventCheckIn(
  userId: string,
  eventTitle: string,
  coinReward: number
) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, whatsapp, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;
    const phone = profile.whatsapp || profile.phone;
    if (!phone) return;

    const message = `✅ *Checked In!* \n\nSalam *${profile.full_name}*, thank you for attending *${eventTitle}*! You have been checked in.\n\n🪙 *Attendance Reward:* +${coinReward} YDC Coins`;

    await sendWhatsAppAlert(phone, message);
  } catch (err) {
    console.error('[WhatsApp Alert] notifyEventCheckIn error:', err);
  }
}
