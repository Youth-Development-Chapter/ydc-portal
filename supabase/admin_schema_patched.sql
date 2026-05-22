-- YDC Admin Schema (Patched)
-- Same as admin_schema.sql but skips LMS tables (courses, user_progress) which
-- don't exist in this DB — the LMS lives in Wellms, not Supabase.
-- 1. Update Profiles Table
-- Ensure profiles table has updated_at column and role check constraint for access control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('volunteer', 'admin', 'superadmin', 'president', 'tier-3'));

-- 2. Create Admin Permissions Table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    admin_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_scan_tickets BOOLEAN DEFAULT false NOT NULL,
    can_approve_deeds BOOLEAN DEFAULT false NOT NULL,
    can_manage_events BOOLEAN DEFAULT false NOT NULL,
    can_manage_courses BOOLEAN DEFAULT false NOT NULL,
    can_manage_settings BOOLEAN DEFAULT false NOT NULL,
    can_manage_admins BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read permissions" ON public.admin_permissions;
CREATE POLICY "Allow authenticated users to read permissions"
    ON public.admin_permissions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow superadmins and presidents full control over permissions" ON public.admin_permissions;
CREATE POLICY "Allow superadmins and presidents full control over permissions"
    ON public.admin_permissions FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('superadmin', 'president')
        )
    );

-- 3. Upgrade Deed Submissions Table
ALTER TABLE public.deed_submissions
    ADD COLUMN IF NOT EXISTS coin_reward INTEGER DEFAULT 10 NOT NULL,
    ADD COLUMN IF NOT EXISTS bonus_coins INTEGER DEFAULT 0 NOT NULL;

-- 4. (skipped: courses table doesn't exist in this DB)

-- 5. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to system settings" ON public.system_settings;
CREATE POLICY "Allow public read access to system settings"
    ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow superadmins and presidents to manage system settings" ON public.system_settings;
CREATE POLICY "Allow superadmins and presidents to manage system settings"
    ON public.system_settings FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('superadmin', 'president')
        )
    );

INSERT INTO public.system_settings (key, value, description)
VALUES
    ('daily_deed_reward', '10', 'Base coins awarded for an approved daily deed'),
    ('event_attendance_reward', '50', 'Base coins awarded for attending an event')
ON CONFLICT (key) DO NOTHING;

-- 6. Update handle_deed_approval Trigger Function (uses coin_reward + bonus_coins)
CREATE OR REPLACE FUNCTION public.handle_deed_approval()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    user_streak_record RECORD;
    new_streak INTEGER := 1;
    total_coins INTEGER;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

        SELECT * INTO user_streak_record FROM public.streaks WHERE user_id = NEW.user_id;

        IF NOT FOUND THEN
            INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_deed_date, updated_at)
            VALUES (NEW.user_id, 1, 1, today_date, now());
        ELSE
            IF user_streak_record.last_deed_date = today_date THEN
                new_streak := user_streak_record.current_streak;
            ELSIF user_streak_record.last_deed_date = today_date - INTERVAL '1 day' THEN
                new_streak := user_streak_record.current_streak + 1;
            ELSE
                new_streak := 1;
            END IF;

            UPDATE public.streaks
            SET current_streak = new_streak,
                longest_streak = GREATEST(new_streak, longest_streak),
                last_deed_date = today_date,
                updated_at = now()
            WHERE user_id = NEW.user_id;
        END IF;

        total_coins := NEW.coin_reward + NEW.bonus_coins;

        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
        VALUES (NEW.user_id, total_coins, 'daily_deed', NEW.id);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. (skipped: course completion trigger requires LMS tables that don't exist)
