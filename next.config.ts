import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + OneSignal CDN (react-onesignal dynamically injects
      // a <script src="cdn.onesignal.com/..."> at runtime — must be allowed here)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://api.onesignal.com",
      // script-src-elem must be explicit — covers all dynamic <script> injections.
      // api.onesignal.com is required for JSONP sync calls (callback=__jp0 pattern)
      "script-src-elem 'self' 'unsafe-inline' https://cdn.onesignal.com https://api.onesignal.com",
      // Styles from self and inline (Tailwind injects inline styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts from Google Fonts and same origin
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images from same origin, Supabase storage, R2, sslip.io, ydc domains, data URIs
      // onesignal.com needed for push notification icons
      "img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev https://*.cloudflare.com https://images.unsplash.com http://*.sslip.io https://*.sslip.io https://db.ydc.org.pk https://onesignal.com https://*.onesignal.com",
      // Connections to Supabase, OneSignal REST API, and sync endpoints
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com http://*.sslip.io https://*.sslip.io ws://*.sslip.io wss://*.sslip.io https://db.ydc.org.pk wss://db.ydc.org.pk https://onesignal.com https://*.onesignal.com https://api.onesignal.com https://cdn.onesignal.com",
      // Video from R2, sslip.io, ydc domains and same origin
      "media-src 'self' blob: https://*.r2.dev https://*.cloudflare.com https://www.w3schools.com http://*.sslip.io https://*.sslip.io https://db.ydc.org.pk",
      // Frames from youtube and OneSignal (for subscription permission dialog)
      "frame-src 'self' https://www.youtube.com https://youtube.com https://onesignal.com https://*.onesignal.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Service worker itself must be same-origin (/OneSignalSDKWorker.js).
      // cdn.onesignal.com is needed for importScripts() calls inside that worker.
      "worker-src 'self' https://cdn.onesignal.com",
    ].join("; "),
  },
];

// Separate, permissive headers for the OneSignal service worker file only
const serviceWorkerHeaders = [
  { key: "Service-Worker-Allowed", value: "/" },
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.7"],
  serverExternalPackages: ["@whiskeysockets/baileys", "pino"],
  experimental: {
    // Proof images can be up to 5 MB; set limit slightly above to give room for
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      }
      // Grant the service worker file maximum sco
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "*.sslip.io" },
      { protocol: "https", hostname: "*.sslip.io" },
      { protocol: "https", hostname: "db.ydc.org.pk" },
    ],
  },
};

export default nextConfig;
