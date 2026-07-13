export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.ENABLE_WHATSAPP_BOT === 'true') {
    console.log('Registering WhatsApp Bot startup hook...');
    const { startWhatsAppBot } = await import('@/lib/whatsapp');
    startWhatsAppBot().catch((err) => {
      console.error('Failed to start WhatsApp Bot in instrumentation register hook:', err);
    });
  }
}
