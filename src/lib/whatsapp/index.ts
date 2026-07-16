/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
// @ts-expect-error - qrcode-terminal lacks type definitions
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import { processAgentMessage } from './agent';
import pino from 'pino';
import net from 'net';
import fs from 'fs';
import path from 'path';

export interface BotLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'error' | 'warn' | 'success';
}

export function logToBot(message: string, level: 'info' | 'error' | 'warn' | 'success' = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry: BotLogEntry = { timestamp, message, level };
  const globalAny = globalThis as any;
  if (!globalAny.whatsappLogs) {
    globalAny.whatsappLogs = [];
  }
  globalAny.whatsappLogs.push(logEntry);
  if (globalAny.whatsappLogs.length > 100) {
    globalAny.whatsappLogs.shift();
  }
  // Also log to regular server console
  console.log(`[WhatsApp Bot] [${level.toUpperCase()}] ${message}`);
}

function acquireBotLock(lockFile = '.whatsapp-bot.pid'): boolean {
  try {
    if (fs.existsSync(lockFile)) {
      const pidStr = fs.readFileSync(lockFile, 'utf8').trim();
      const pid = parseInt(pidStr, 10);
      if (!isNaN(pid) && pid !== process.pid) {
        try {
          // Check if process is still alive
          process.kill(pid, 0);
          return false; // Process is still running!
        } catch (e) {
          // Process is dead, we can take the lock
          console.log(`[WhatsApp Bot] Found stale lock file with PID ${pid} (process is dead). Overwriting...`);
        }
      }
    }
    // Write our PID to lock file
    fs.writeFileSync(lockFile, process.pid.toString(), 'utf8');

    // Setup exit handler to clean up lock file
    const cleanup = () => {
      try {
        if (fs.existsSync(lockFile)) {
          const pidStr = fs.readFileSync(lockFile, 'utf8').trim();
          if (parseInt(pidStr, 10) === process.pid) {
            fs.unlinkSync(lockFile);
          }
        }
      } catch (e) {}
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    return true;
  } catch (err) {
    console.error('[WhatsApp Bot] Error checking/acquiring PID lock:', err);
    return false;
  }
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
    logToBot('WhatsApp Bot is already running (global singleton detected).', 'info');
    return;
  }

  // PID File Lock to prevent multiple processes/workers from connecting simultaneously in development/production
  const hasLock = acquireBotLock();
  if (!hasLock) {
    logToBot(`Another Next.js process/worker is already running the WhatsApp bot. Skipping duplicate initialization.`, 'warn');
    return;
  }

  logToBot(`Initializing WhatsApp Bot (Process PID: ${process.pid})...`, 'info');
  (globalThis as any).whatsappStatus = {
    status: 'connecting',
    updatedAt: new Date().toISOString(),
  };

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
      logToBot('Scan the QR code on the admin panel/console to connect.', 'info');
      qrcode.generate(qr, { small: true });
      (globalThis as any).whatsappStatus = {
        status: 'qr',
        qr: qr,
        updatedAt: new Date().toISOString(),
      };
    }
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const errorMsg = (lastDisconnect?.error as Boom)?.message || 'Disconnected';
      console.log('[WhatsApp Bot] Disconnect error details:', lastDisconnect?.error);
      logToBot(`WhatsApp connection closed: ${errorMsg}. Status Code: ${statusCode}. Reconnecting: true`, 'warn');
      globalForWhatsApp.whatsappSocket = undefined;
      
      (globalThis as any).whatsappStatus = {
        status: 'disconnected',
        error: errorMsg,
        updatedAt: new Date().toISOString(),
      };

      if (isLoggedOut) {
        logToBot('Session logged out or credentials invalidated (401). Cleaning up auth folder to allow re-pairing...', 'warn');
        try {
          const authDir = path.join(process.cwd(), 'auth_info_baileys');
          if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
          }
          // Delete PID lock file to allow clean restart
          if (fs.existsSync('.whatsapp-bot.pid')) {
            fs.unlinkSync('.whatsapp-bot.pid');
          }
        } catch (err) {
          console.error('[WhatsApp Bot] Error cleaning up auth folder:', err);
        }
      }

      // Always restart/reconnect: if logged out, it starts fresh and prints a new QR code;
      // if temporary connection failure, it retries.
      startWhatsAppBot();
    } else if (connection === 'open') {
      const userPhone = sock.user?.id ? sock.user.id.split(':')[0] : undefined;
      logToBot(`WhatsApp Bot successfully connected and ready! Phone: ${userPhone}`, 'success');
      (globalThis as any).whatsappStatus = {
        status: 'connected',
        phoneNumber: userPhone,
        updatedAt: new Date().toISOString(),
      };
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

    logToBot(`Received message from ${senderPhone}: ${userText ? `"${userText}"` : '[Audio/Voice Message]'}`, 'info');

    try {
      // Extract the last 10 digits to handle 92 / 0 / +92 prefix inconsistencies
      const phoneSuffix = senderPhone.replace(/\D/g, '').slice(-10);
      if (phoneSuffix.length < 10) {
        logToBot(`Ignoring message from invalid phone number format: ${senderPhone}`, 'warn');
        return;
      }

      // Fetch dynamic settings from database
      const { data: dbSettings } = await supabase
        .from('system_settings')
        .select('key, value');

      const settingsMap = new Map(dbSettings?.map(s => [s.key, s.value]) || []);

      const isEnabled = settingsMap.get('whatsapp_agent_enabled') !== 'false';
      if (!isEnabled) {
        logToBot(`Ignored message from ${senderPhone} because whatsapp_agent_enabled is set to false.`, 'info');
        return;
      }

      const authorizedNumbersStr = (settingsMap.get('whatsapp_authorized_numbers') || '') as string;
      const authorizedRolesStr = (settingsMap.get('whatsapp_authorized_roles') || 'superadmin') as string;

      const authNumbers = authorizedNumbersStr
        .split(',')
        .map((n: string) => n.trim().replace(/\D/g, ''))
        .filter(Boolean);

      const authRoles = authorizedRolesStr
        .split(',')
        .map((r: string) => r.trim().toLowerCase())
        .filter(Boolean);

      // 1. Authenticate sender in profiles table (matching ending suffix on phone or whatsapp)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or(`whatsapp.like.%${phoneSuffix},phone.like.%${phoneSuffix}`);

      const ROLE_PRIVILEGE: Record<string, number> = {
        superadmin: 100,
        admin: 80,
        president: 60,
        'tier-3': 40,
        volunteer: 10,
      };

      const sortedProfiles = (profiles || []).sort((a, b) => {
        const privA = ROLE_PRIVILEGE[a.role] || 0;
        const privB = ROLE_PRIVILEGE[b.role] || 0;
        return privB - privA;
      });

      const profile = sortedProfiles[0] || null;

      let isAuthorized = false;
      const cleanSenderPhone = senderPhone.replace(/\D/g, '');
      const cleanSenderPhoneSuffix = cleanSenderPhone.slice(-10);

      // 1. Check if the sender is explicitly authorized by phone number
      if (authNumbers.some(num => num.slice(-10) === cleanSenderPhoneSuffix)) {
        isAuthorized = true;
      }

      // 2. Check if the user is authorized by role
      if (!isAuthorized && profile && authRoles.includes(profile.role.toLowerCase())) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        logToBot(`Ignored unauthorized command from ${senderPhone} (Name: ${profile?.full_name || 'Unknown'}, Role: ${profile?.role || 'None'})`, 'warn');
        return;
      }

      // Set activeProfile to profile, or mock if they are only authorized by phone number
      let activeProfile = profile;
      if (!activeProfile) {
        // Find a real admin/superadmin in the database to use their ID for foreign key checks
        const { data: realAdmins } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['superadmin', 'admin'])
          .limit(1);

        const fallbackId = (realAdmins && realAdmins[0])?.id || '00000000-0000-0000-0000-000000000000';
        activeProfile = {
          id: fallbackId,
          full_name: `Authorized User (${senderPhone})`,
          role: 'superadmin', // Give superadmin powers to authorized numbers
          unit_id: null,
          phone: senderPhone,
          whatsapp: senderPhone,
        };
      }

      logToBot(`Processing admin command for: ${activeProfile.full_name} (${activeProfile.role})`, 'info');

      // Show typing indicator
      try {
        await sock.sendPresenceUpdate('composing', senderJid);
      } catch {
        // ignore
      }

      // Download audio message if present
      let audioFile: { data: Buffer; mimeType: string } | undefined;
      if (audioMessage) {
        logToBot('Downloading WhatsApp voice message...', 'info');
        try {
          const stream = await downloadContentFromMessage(audioMessage, 'audio');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          audioFile = {
            data: buffer,
            mediaType: audioMessage.mimetype || 'audio/ogg',
          } as any;
          logToBot(`Downloaded voice message (${buffer.length} bytes)`, 'success');
        } catch (downloadErr) {
          logToBot(`Failed to download voice message: ${downloadErr instanceof Error ? downloadErr.message : downloadErr}`, 'error');
        }
      }

      // 3. Delegate message parsing to the AI agent (passing text and audio)
      const responseText = await processAgentMessage(userText, activeProfile, audioFile);

      // Stop typing indicator
      try {
        await sock.sendPresenceUpdate('paused', senderJid);
      } catch (presenceErr) {
        console.warn('Failed to stop typing indicator:', presenceErr);
      }

      // 4. Send the result back to the sender
      await sock.sendMessage(senderJid, { text: formatMarkdownToWhatsApp(responseText) });
    } catch (err) {
      logToBot(`Error processing WhatsApp message: ${err instanceof Error ? err.message : err}`, 'error');
      try {
        await sock.sendMessage(senderJid, {
          text: 'An error occurred while executing the command. Please try again later.',
        });
      } catch {
        // ignore
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
