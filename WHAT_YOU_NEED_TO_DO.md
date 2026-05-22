# What you need to do

I already implemented the code-side fixes and features.  
To make everything work in your environment, do these steps:

## 1) Pull latest branch and install deps

```bash
npm install
```

## 2) Run these SQL files in Supabase (in this order)

1. `supabase/indexes.sql`
2. `supabase/announcements_schema.sql`
3. `supabase/rewards_schema.sql`
4. `supabase/rls_multi_role_fix.sql`

## 3) Set/verify environment variables

Make sure these are set in your deployment and local `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_PUBLIC_URL` (must be a real public URL, not placeholder)

## 4) Verify app builds

```bash
npm run lint
npm run build
```

## 5) Smoke-test the new pages

- User:
  - `/leaderboard`
  - `/dashboard/announcements`
  - `/dashboard/rewards`
- Admin:
  - `/admin/announcements`
  - `/admin/rewards`

## 6) Production rollout checklist

- Confirm RLS policies were created without errors in Supabase SQL editor logs.
- Confirm admin roles (`superadmin`, `president`, `tier-3`, `admin`) can access intended admin pages.
- Confirm reward redemption writes to:
  - `reward_redemptions`
  - `coin_transactions` (negative amount)
- Confirm announcement create/delete/pin works and appears on user page.

