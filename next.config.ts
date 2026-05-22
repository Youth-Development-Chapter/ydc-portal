import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Allow Next.js inline scripts and scripts from same origin
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Allow styles from self and inline (Tailwind injects inline styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Allow fonts from Google Fonts and same origin
      "font-src 'self' https://fonts.gstatic.com data:",
      // Allow images from same origin, Supabase storage, R2, sslip.io, and data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev https://*.cloudflare.com https://images.unsplash.com http://*.sslip.io https://*.sslip.io",
      // Allow connections to Supabase for auth/data
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com http://*.sslip.io https://*.sslip.io ws://*.sslip.io wss://*.sslip.io",
      // Allow video from R2, sslip.io and same origin
      "media-src 'self' blob: https://*.r2.dev https://*.cloudflare.com https://www.w3schools.com http://*.sslip.io https://*.sslip.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "*.sslip.io" },
      { protocol: "https", hostname: "*.sslip.io" },
    ],
  },
};

export default nextConfig;
