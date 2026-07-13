import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import { processAgentMessage } from './agent';
import pino from 'pino';
import net from 'net';

function acquireBotLock(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.on('error', () => {
      resolve(false);
    });
    server.listen(port, '127.0.0.1', () => {
      // Keep the server listening to lock the port
      (globalThis as any).whatsappLockServer = server;
      resolve(true);
    });
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase env variables are missing for the WhatsApp bot handler.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Avoid multiple connections during Next.js Hot Module Replacement (HMR)
const globalForWhatsApp = globalThis as unknown as {
  whatsappSocket?: WASocket;
};

export async function startWhatsAppBot() {
  if (globalForWhatsApp.whatsappSocket) {
    console.log('WhatsApp Bot is already running (global singleton detected).');
    return;
  }

  // TCP Port Lock to prevent multiple processes from connecting simultaneously in production
  const lockPort = parseInt(process.env.WHATSAPP_BOT_LOCK_PORT || '3099', 10);
  const hasLock = await acquireBotLock(lockPort);
  if (!hasLock) {
    console.log(`[WhatsApp] Another Next.js process/worker is already running the WhatsApp bot on port ${lockPort}. Skipping duplicate initialization.`);
    return;
  }

  console.log(`Initializing WhatsApp Bot (Process PID: ${process.pid}, Lock Port: ${lockPort})...`);
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
  });

  // Save the socket instance globally to survive HMR
  globalForWhatsApp.whatsappSocket = sock;

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('Scan the QR code below to connect WhatsApp Bot:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('WhatsApp connection closed. Reconnecting...', shouldReconnect);
      globalForWhatsApp.whatsappSocket = undefined;
      if (shouldReconnect) {
        startWhatsAppBot();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp Bot successfully connected and ready!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    console.log('Received raw messages.upsert event:', JSON.stringify(m, null, 2));
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid;
    const remoteJidAlt = (msg.key as any).remoteJidAlt;

    let senderJid = '';
    if (remoteJid && remoteJid.endsWith('@s.whatsapp.net')) {
      senderJid = remoteJid;
    } else if (remoteJidAlt && remoteJidAlt.endsWith('@s.whatsapp.net')) {
      senderJid = remoteJidAlt;
    }

    if (!senderJid) return;

    // Standardize phone number format: e.g. +923001234567
    const rawPhone = senderJid.split('@')[0];
    const senderPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;

    const audioMessage = msg.message?.audioMessage || msg.message?.documentWithCaptionMessage?.message?.audioMessage;
    const userText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    if (!userText && !audioMessage) return;

    console.log(`WhatsApp message from ${senderPhone}: ${userText ? `"${userText}"` : '[Audio/Voice Message]'}`);

    try {
      // Extract the last 10 digits to handle 92 / 0 / +92 prefix inconsistencies
      const phoneSuffix = senderPhone.replace(/\D/g, '').slice(-10);
      if (phoneSuffix.length < 10) {
        console.log(`Ignoring message from invalid phone number format: ${senderPhone}`);
        return;
      }

      // 1. Authenticate sender in profiles table (matching ending suffix on phone or whatsapp)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .or(`whatsapp.like.%${phoneSuffix},phone.like.%${phoneSuffix}`)
        .maybeSingle();

      // Only accept messages from authenticated superadmins
      if (!profile || profile.role !== 'superadmin') {
        console.log(`Ignored unauthorized command from: ${senderPhone} (Name: ${profile?.full_name || 'Unknown'}, Role: ${profile?.role || 'None'})`);
        return;
      }

      console.log(`Processing admin command on behalf of: ${profile.full_name} (${profile.role})`);

      // Show typing indicator
      try {
        await sock.sendPresenceUpdate('composing', senderJid);
      } catch (presenceErr) {
        console.warn('Failed to send typing indicator:', presenceErr);
      }

      // Download audio message if present
      let audioFile: { data: Buffer; mimeType: string } | undefined;
      if (audioMessage) {
        console.log('Downloading WhatsApp voice/audio message content...');
        try {
          const stream = await downloadContentFromMessage(audioMessage, 'audio');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          audioFile = {
            data: buffer,
            mimeType: audioMessage.mimetype || 'audio/ogg',
          };
          console.log(`Successfully downloaded audio media (${audioFile.data.length} bytes)`);
        } catch (downloadErr) {
          console.error('Failed to download audio message from WhatsApp:', downloadErr);
        }
      }

      // 3. Delegate message parsing to the AI agent (passing text and audio)
      const responseText = await processAgentMessage(userText, profile, audioFile);

      // Stop typing indicator
      try {
        await sock.sendPresenceUpdate('paused', senderJid);
      } catch (presenceErr) {
        console.warn('Failed to stop typing indicator:', presenceErr);
      }

      // 4. Send the result back to the sender
      await sock.sendMessage(senderJid, { text: formatMarkdownToWhatsApp(responseText) });
    } catch (err) {
      console.error('Error processing WhatsApp message event:', err);
      try {
        await sock.sendMessage(senderJid, {
          text: 'An error occurred while executing the command. Please try again later.',
        });
      } catch (sendErr) {
        console.error('Failed to send error message back to user:', sendErr);
      }
    }
  });
}

function formatMarkdownToWhatsApp(text: string): string {
  if (!text) return '';
  let formatted = text;

  // 1. Convert headers (e.g. # Header) to bold lines
  formatted = formatted.replace(/^\s*#{1,6}\s+(.+)$/gm, '*$1*');

  // 2. Convert standard markdown bold (**text**) to WhatsApp bold (*text*)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // 3. Convert standard markdown bold variant (__text__) to WhatsApp bold (*text*)
  formatted = formatted.replace(/__(.*?)__/g, '*$1*');

  // 4. Convert markdown bullet lists (lines starting with *, -, +) to WhatsApp clean bullet point (•)
  formatted = formatted.replace(/^\s*[\*\-\+]\s+/gm, '• ');

  return formatted;
}
