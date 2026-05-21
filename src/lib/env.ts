import { z } from 'zod'

const envSchema = z.object({
  // Supabase (public, required at runtime)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Site URL (used for auth redirects)
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Cloudflare R2 (server-only)
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().min(1, 'CLOUDFLARE_R2_ACCOUNT_ID is required'),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1, 'CLOUDFLARE_R2_ACCESS_KEY_ID is required'),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY is required'),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1, 'CLOUDFLARE_R2_BUCKET_NAME is required').default('ydc'),
  CLOUDFLARE_R2_PUBLIC_URL: z
    .string()
    .url('CLOUDFLARE_R2_PUBLIC_URL must be a valid URL')
    .refine((v) => !v.includes('your-r2-public-url'), {
      message: 'CLOUDFLARE_R2_PUBLIC_URL must be set to a real R2 public URL',
    }),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n')
    // In production throw hard; in development/test warn so the server still
    // starts for pages that don't need every variable.
    const message = `\n❌ Missing or invalid environment variables:\n${missing}\n`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message)
    }
    console.warn(message)
    // Return a partial object so non-affected paths still work
    return process.env as unknown as Env
  }
  return result.data
}

export const env = validateEnv()
