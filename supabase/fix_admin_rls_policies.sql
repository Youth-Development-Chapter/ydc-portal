-- Fix Admin RLS Policies
-- The original schema.sql policies only check for role IN ('admin', 'superadmin', 'president', 'tier-3'), but admin_schema.sql
-- expanded the role check to include 'superadmin', 'president', and 'tier-3'.
-- Users with those new roles are silently filtered out by RLS — e.g. the admin
-- dashboard sees zero pending deeds even though they exist.
--
-- This migration replaces every "admin only" policy with one that accepts any
-- admin-tier role. Run in Supabase SQL Editor.

-- 1. events
DROP POLICY IF EXISTS "Allow administrators write access to events" ON public.events;
CREATE POLICY "Allow administrators write access to events"
    ON public.events FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- 2. event_registrations
DROP POLICY IF EXISTS "Allow administrators full control over registrations" ON public.event_registrations;
CREATE POLICY "Allow administrators full control over registrations"
    ON public.event_registrations FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- 3. deed_submissions  (the one causing the dashboard bug)
DROP POLICY IF EXISTS "Allow administrators full control over deed submissions" ON public.deed_submissions;
CREATE POLICY "Allow administrators full control over deed submissions"
    ON public.deed_submissions FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- 4. streaks
DROP POLICY IF EXISTS "Allow administrators write access to streaks" ON public.streaks;
CREATE POLICY "Allow administrators write access to streaks"
    ON public.streaks FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- 5. coin_transactions
DROP POLICY IF EXISTS "Allow administrators write access to transactions" ON public.coin_transactions;
CREATE POLICY "Allow administrators write access to transactions"
    ON public.coin_transactions FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));
