-- YDC Portal Database Schema Initialization
-- Execute this script in your Supabase SQL Editor to set up the necessary tables, policies, triggers, indexes, and storage buckets.

-- =========================================================================
-- 1. PROFILES & ROLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    father_name TEXT,
    dob DATE,
    whatsapp TEXT,
    phone TEXT,
    city TEXT,
    district TEXT,
    division TEXT,
    qualification TEXT,
    address TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'volunteer' NOT NULL CHECK (role IN ('volunteer', 'admin', 'superadmin', 'president', 'tier-3')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    province TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to units" ON public.units;
CREATE POLICY "Allow public read access to units"
    ON public.units FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow superadmins to manage units" ON public.units;
CREATE POLICY "Allow superadmins to manage units"
    ON public.units FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'superadmin'
        )
    );

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to insert profiles" ON public.profiles;
CREATE POLICY "Allow admins to insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

DROP POLICY IF EXISTS "Allow admins to update profiles" ON public.profiles;
CREATE POLICY "Allow admins to update profiles"
    ON public.profiles FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

DROP POLICY IF EXISTS "Allow admins to delete profiles" ON public.profiles;
CREATE POLICY "Allow admins to delete profiles"
    ON public.profiles FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- =========================================================================
-- 2. EVENTS & REGISTRATIONS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    coin_reward INTEGER NOT NULL DEFAULT 50,
    custom_criteria JSONB DEFAULT '{}'::jsonb,
    is_compulsory BOOLEAN DEFAULT false NOT NULL,
    division TEXT,
    excluded_divisions TEXT[] DEFAULT '{}',
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_criteria JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to events"
    ON public.events FOR SELECT USING (
        is_archived = false OR 
        (auth.uid() IS NOT NULL AND auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        ))
    );

DROP POLICY IF EXISTS "Allow administrators write access to events" ON public.events;
CREATE POLICY "Allow administrators write access to events"
    ON public.events FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    ticket_code TEXT UNIQUE NOT NULL, -- e.g., "TKT-PION-XXXXXXXX"
    attended BOOLEAN DEFAULT false NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'present', 'absent', 'leave_pending', 'leave_approved', 'leave_rejected')),
    leave_note TEXT,
    attended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, event_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own registrations" ON public.event_registrations;
CREATE POLICY "Allow users to read their own registrations"
    ON public.event_registrations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to register themselves for events" ON public.event_registrations;
CREATE POLICY "Allow users to register themselves for events"
    ON public.event_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow administrators full control over registrations" ON public.event_registrations;
CREATE POLICY "Allow administrators full control over registrations"
    ON public.event_registrations FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- Enforce event capacity at the database level so all registration paths are covered
-- atomically (no per-route TOCTOU race). Staff (admin/superadmin/president/tier-3) may
-- override a full event, e.g. checking in a walk-in. Volunteers are blocked when full.
CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
    event_capacity INTEGER;
    current_count INTEGER;
    is_staff BOOLEAN;
BEGIN
    SELECT capacity INTO event_capacity
    FROM public.events
    WHERE id = NEW.event_id;

    -- No capacity configured (null) means unlimited.
    IF event_capacity IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin', 'president', 'tier-3')
    ) INTO is_staff;

    IF is_staff THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO current_count
    FROM public.event_registrations
    WHERE event_id = NEW.event_id;

    IF current_count >= event_capacity THEN
        RAISE EXCEPTION 'EVENT_FULL' USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_enforce_capacity ON public.event_registrations;
CREATE TRIGGER on_registration_enforce_capacity
    BEFORE INSERT ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_event_capacity();

-- =========================================================================
-- 3. DEED SUBMISSIONS & STREAKS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.deed_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    proof_url TEXT NOT NULL, -- Path in Supabase Storage bucket 'deeds'
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    status_updated_by UUID REFERENCES public.profiles(id),
    coin_reward INTEGER DEFAULT 10 NOT NULL,
    bonus_coins INTEGER DEFAULT 0 NOT NULL,
    local_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.deed_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own deed submissions" ON public.deed_submissions;
CREATE POLICY "Allow users to read their own deed submissions"
    ON public.deed_submissions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to submit their own deeds" ON public.deed_submissions;
CREATE POLICY "Allow users to submit their own deeds"
    ON public.deed_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow administrators full control over deed submissions" ON public.deed_submissions;
CREATE POLICY "Allow administrators full control over deed submissions"
    ON public.deed_submissions FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

CREATE TABLE IF NOT EXISTS public.streaks (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_deed_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read user streaks (for leaderboards)" ON public.streaks;
CREATE POLICY "Allow anyone to read user streaks (for leaderboards)"
    ON public.streaks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow administrators write access to streaks" ON public.streaks;
CREATE POLICY "Allow administrators write access to streaks"
    ON public.streaks FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- =========================================================================
-- 4. COIN TRANSACTIONS (Append-Only Ledger)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- positive for earnings, negative for purchases
    reason TEXT NOT NULL, -- e.g. 'course_completion', 'event_attendance', 'daily_deed', 'reward_redeem'
    reference_id UUID, -- reference to event_registration, deed_submission, etc.
    credited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own transaction history" ON public.coin_transactions;
CREATE POLICY "Allow users to read their own transaction history"
    ON public.coin_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow administrators write access to transactions" ON public.coin_transactions;
CREATE POLICY "Allow administrators write access to transactions"
    ON public.coin_transactions FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- =========================================================================
-- 5. SYSTEM SETTINGS
-- =========================================================================

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

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description)
VALUES
    ('daily_deed_reward', '10', 'Base coins awarded for an approved daily deed'),
    ('event_attendance_reward', '50', 'Base coins awarded for attending an event')
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- 6. COURSES & LMS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY, -- e.g. 'deenyat', 'seerat'
    title TEXT NOT NULL,
    title_ur TEXT,
    author TEXT NOT NULL,
    description TEXT,
    description_ur TEXT,
    image_url TEXT,
    reward_points INTEGER DEFAULT 50 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
CREATE POLICY "Allow public read access to courses"
    ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow administrators full control over courses" ON public.courses;
CREATE POLICY "Allow administrators full control over courses"
    ON public.courses FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY, -- e.g. 'd_m1', 'd_m2'
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    title_ur TEXT,
    duration TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to modules" ON public.modules;
CREATE POLICY "Allow public read access to modules"
    ON public.modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow administrators full control over modules" ON public.modules;
CREATE POLICY "Allow administrators full control over modules"
    ON public.modules FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    title_ur TEXT,
    video_url TEXT,
    video_url_ur TEXT,
    text_content TEXT NOT NULL,
    text_content_ur TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to lessons" ON public.lessons;
CREATE POLICY "Allow public read access to lessons"
    ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow administrators full control over lessons" ON public.lessons;
CREATE POLICY "Allow administrators full control over lessons"
    ON public.lessons FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

CREATE TABLE IF NOT EXISTS public.mcqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    question_ur TEXT,
    options JSONB NOT NULL, -- JSON array of strings
    options_ur JSONB, -- JSON array of strings in Urdu
    correct_answer_index INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'beginner' NOT NULL CHECK (difficulty IN ('beginner', 'advanced', 'expert')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.mcqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to mcqs" ON public.mcqs;
CREATE POLICY "Allow public read access to mcqs"
    ON public.mcqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow administrators full control over mcqs" ON public.mcqs;
CREATE POLICY "Allow administrators full control over mcqs"
    ON public.mcqs FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    language TEXT DEFAULT 'en' NOT NULL CHECK (language IN ('en', 'ur')),
    difficulty TEXT DEFAULT 'beginner' NOT NULL CHECK (difficulty IN ('beginner', 'advanced', 'expert')),
    completed BOOLEAN DEFAULT true NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, course_id, lesson_id, language, difficulty)
);

CREATE TABLE IF NOT EXISTS public.user_course_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'ur')),
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, course_id)
);

ALTER TABLE public.user_course_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own course settings" ON public.user_course_settings;
CREATE POLICY "Allow users to read their own course settings"
    ON public.user_course_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage their own course settings" ON public.user_course_settings;
CREATE POLICY "Allow users to manage their own course settings"
    ON public.user_course_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own progress" ON public.user_progress;
CREATE POLICY "Allow users to read their own progress"
    ON public.user_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to record their own progress" ON public.user_progress;
CREATE POLICY "Allow users to record their own progress"
    ON public.user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow administrators full control over progress" ON public.user_progress;
CREATE POLICY "Allow administrators full control over progress"
    ON public.user_progress FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- =========================================================================
-- 7. ADMIN PERMISSIONS
-- =========================================================================

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

-- =========================================================================
-- 8. ANNOUNCEMENTS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    excluded_unit_ids UUID[],
    target_users UUID[],
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read announcements" ON public.announcements;
CREATE POLICY "Allow authenticated users to read announcements"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admins to manage announcements" ON public.announcements;
CREATE POLICY "Allow admins to manage announcements"
    ON public.announcements FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    );

-- =========================================================================
-- 9. QUIZ ATTEMPTS (LMS Quiz limiting)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    last_attempt_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to read their own quiz attempts"
    ON public.quiz_attempts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to record their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to record their own quiz attempts"
    ON public.quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to update their own quiz attempts"
    ON public.quiz_attempts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow administrators full control over quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow administrators full control over quiz attempts"
    ON public.quiz_attempts FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- =========================================================================
-- 10. REWARDS & REDEMPTIONS (Shop)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
    quantity_available INTEGER,   -- NULL = unlimited
    is_active BOOLEAN DEFAULT true NOT NULL,
    inclusive_unit_ids UUID[],
    exclusive_unit_ids UUID[],
    custom_criteria JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read active rewards" ON public.rewards;
CREATE POLICY "Allow authenticated users to read active rewards"
    ON public.rewards FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Allow admins to manage rewards" ON public.rewards;
CREATE POLICY "Allow admins to manage rewards"
    ON public.rewards FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    );

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    coin_cost INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'rejected')),
    processed_by UUID REFERENCES public.profiles(id),
    redeemed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own redemptions" ON public.reward_redemptions;
CREATE POLICY "Allow users to read their own redemptions"
    ON public.reward_redemptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to create their own redemptions" ON public.reward_redemptions;
CREATE POLICY "Allow users to create their own redemptions"
    ON public.reward_redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins to manage redemptions" ON public.reward_redemptions;
CREATE POLICY "Allow admins to manage redemptions"
    ON public.reward_redemptions FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    );

-- =========================================================================
-- 11. DATABASE AUTOMATIONS & TRIGGERS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_user_streak(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
    has_deed BOOLEAN;
    latest_deed_date DATE;
    longest INTEGER := 0;
BEGIN
    SELECT MAX(local_date) INTO latest_deed_date
    FROM public.deed_submissions
    WHERE user_id = target_user_id AND status = 'approved';

    IF latest_deed_date IS NULL THEN
        UPDATE public.streaks
        SET current_streak = 0, last_deed_date = NULL, updated_at = now()
        WHERE user_id = target_user_id;
        RETURN;
    END IF;

    check_date := latest_deed_date;

    LOOP
        SELECT EXISTS (
            SELECT 1 FROM public.deed_submissions
            WHERE user_id = target_user_id
              AND local_date = check_date
              AND status = 'approved'
        ) INTO has_deed;

        IF has_deed THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;

    SELECT longest_streak INTO longest FROM public.streaks WHERE user_id = target_user_id;
    IF longest IS NULL THEN longest := 0; END IF;

    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_deed_date, updated_at)
    VALUES (target_user_id, streak_count, GREATEST(streak_count, longest), latest_deed_date, now())
    ON CONFLICT (user_id) DO UPDATE
    SET current_streak = EXCLUDED.current_streak,
        longest_streak = GREATEST(public.streaks.longest_streak, EXCLUDED.longest_streak),
        last_deed_date = EXCLUDED.last_deed_date,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_update_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_user_streak(OLD.user_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_user_streak(NEW.user_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deed_approval ON public.deed_submissions;
DROP FUNCTION IF EXISTS public.handle_deed_approval();

DROP TRIGGER IF EXISTS on_deed_change_update_streak ON public.deed_submissions;
CREATE TRIGGER on_deed_change_update_streak
    AFTER INSERT OR UPDATE OF status, local_date OR DELETE ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_streak();

CREATE OR REPLACE FUNCTION public.handle_deed_coins()
RETURNS TRIGGER AS $$
BEGIN
    -- Award coins on approval. Flag deductions are handled entirely in app code
    -- (flagDeedSubmission / overrideDeedDecision) so the admin-chosen amount is the
    -- single source of truth; the trigger must NOT deduct here or coins double-count.
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, processed_by)
        VALUES (NEW.user_id, NEW.coin_reward + NEW.bonus_coins, 'daily_deed', NEW.id, NEW.status_updated_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deed_status_coins ON public.deed_submissions;
CREATE TRIGGER on_deed_status_coins
    AFTER UPDATE OF status ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deed_coins();

CREATE OR REPLACE FUNCTION public.handle_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_modules INTEGER;
    module_idx INTEGER;
    course_reward INTEGER;
    base_chapter_coins INTEGER;
    difficulty_multiplier NUMERIC;
    calculated_chapter_coins INTEGER;
    max_earned_coins INTEGER := 0;
    coins_to_award INTEGER;
    chapter_reason TEXT;

    total_lessons INTEGER;
    completed_lessons INTEGER;
    already_awarded BOOLEAN;
    completion_bonus INTEGER;
    completion_reason TEXT;
BEGIN
    SELECT COALESCE(reward_points, 50) INTO course_reward
    FROM public.courses
    WHERE id = NEW.course_id;

    SELECT COUNT(*) INTO total_modules
    FROM public.modules
    WHERE course_id = NEW.course_id;

    SELECT order_index_pos INTO module_idx
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC) as order_index_pos
        FROM public.modules
        WHERE course_id = NEW.course_id
    ) t
    WHERE id = (
        SELECT module_id FROM public.lessons WHERE id = NEW.lesson_id
    );

    IF total_modules IS NULL OR total_modules = 0 THEN
        total_modules := 1;
    END IF;
    IF module_idx IS NULL OR module_idx = 0 THEN
        module_idx := 1;
    END IF;

    base_chapter_coins := FLOOR((0.6 * course_reward * module_idx) / total_modules) -
                          FLOOR((0.6 * course_reward * (module_idx - 1)) / total_modules);

    IF NEW.difficulty = 'beginner' THEN
        difficulty_multiplier := 0.7;
    ELSIF NEW.difficulty = 'expert' THEN
        difficulty_multiplier := 1.3;
    ELSE
        difficulty_multiplier := 1.0;
    END IF;

    calculated_chapter_coins := ROUND(base_chapter_coins * difficulty_multiplier);

    chapter_reason := 'chapter_completion:' || NEW.course_id || ':' || NEW.lesson_id;

        SELECT COALESCE(SUM(amount), 0) INTO max_earned_coins
        FROM public.coin_transactions
        WHERE user_id = NEW.user_id
            AND reason LIKE (chapter_reason || '%');

    coins_to_award := calculated_chapter_coins - max_earned_coins;

    IF coins_to_award > 0 THEN
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
        VALUES (
            NEW.user_id,
            coins_to_award,
            chapter_reason || ':' || NEW.difficulty,
            NEW.id
        );
    END IF;

    SELECT COUNT(*) INTO total_lessons
    FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = NEW.course_id;

    SELECT COUNT(DISTINCT lesson_id) INTO completed_lessons
    FROM public.user_progress
    WHERE user_id = NEW.user_id
      AND course_id = NEW.course_id
      AND language = NEW.language
      AND completed = true;

    IF completed_lessons >= total_lessons AND total_lessons > 0 THEN
        completion_reason := 'course_completion:' || NEW.course_id || ':' || NEW.language;

        SELECT EXISTS(
            SELECT 1 FROM public.coin_transactions
            WHERE user_id = NEW.user_id
              AND reason = completion_reason
        ) INTO already_awarded;

        IF NOT already_awarded THEN
            completion_bonus := course_reward - FLOOR(0.6 * course_reward);

            INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
            VALUES (NEW.user_id, completion_bonus, completion_reason, NEW.id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_progress_completed ON public.user_progress;
CREATE TRIGGER on_progress_completed
    AFTER INSERT OR UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_course_completion();

-- =========================================================================
-- 12. STORAGE BUCKETS & POLICIES (Supabase local storage)
-- =========================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deeds', 'deeds', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage buckets
-- Allow public select/download
DROP POLICY IF EXISTS "Allow public select on deeds" ON storage.objects;
CREATE POLICY "Allow public select on deeds" ON storage.objects FOR SELECT USING (bucket_id = 'deeds');

DROP POLICY IF EXISTS "Allow public select on avatars" ON storage.objects;
CREATE POLICY "Allow public select on avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated upload/insert
DROP POLICY IF EXISTS "Allow authenticated inserts to deeds" ON storage.objects;
CREATE POLICY "Allow authenticated inserts to deeds" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deeds');

DROP POLICY IF EXISTS "Allow authenticated inserts to avatars" ON storage.objects;
CREATE POLICY "Allow authenticated inserts to avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated delete
DROP POLICY IF EXISTS "Allow authenticated deletes from deeds" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from deeds" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deeds');

DROP POLICY IF EXISTS "Allow authenticated deletes from avatars" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- =========================================================================
-- 13. PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id
  ON public.coin_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_reason
  ON public.coin_transactions(user_id, reason);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_completed
  ON public.user_progress(user_id, course_id, completed);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_lesson
  ON public.user_progress(user_id, course_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_deed_submissions_user_local_date
  ON public.deed_submissions(user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_deed_submissions_status_created
  ON public.deed_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id
  ON public.event_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON public.event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_events_date
  ON public.events(date);

CREATE INDEX IF NOT EXISTS idx_streaks_user_id
  ON public.streaks(user_id);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created
  ON public.announcements (is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user
  ON public.reward_redemptions (user_id, redeemed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_active
  ON public.rewards (is_active, coin_cost);

-- ---------------------------------------------------------------------------
-- 14. SERVER-SIDE AGGREGATION RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_coin_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(ct.amount), 0)::INTEGER
    FROM public.coin_transactions ct
    WHERE ct.user_id = p_user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_user_coin_balance(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit INTEGER DEFAULT 50, p_unit_id UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    unit_name TEXT,
    avatar_url TEXT,
    coins BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        p.id AS user_id,
        COALESCE(p.full_name, 'Anonymous Member') AS full_name,
        COALESCE(u.name, 'Unknown') AS unit_name,
        p.avatar_url AS avatar_url,
        SUM(ct.amount)::BIGINT AS coins
    FROM public.coin_transactions ct
    INNER JOIN public.profiles p ON p.id = ct.user_id
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE (p_unit_id IS NULL OR p.unit_id = p_unit_id)
    GROUP BY p.id, p.full_name, u.name, p.avatar_url
    HAVING SUM(ct.amount) > 0
    ORDER BY SUM(ct.amount) DESC
    LIMIT GREATEST(COALESCE(p_limit, 50), 1)
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(INTEGER, UUID) TO authenticated;

-- Trigger to set email on profile insert if null
CREATE OR REPLACE FUNCTION public.set_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_email();

-- Trigger to sync email from auth.users to public.profiles on email update
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Function to check auth providers linked to an email address
CREATE OR REPLACE FUNCTION public.check_user_providers(email_param TEXT)
RETURNS TEXT[] AS $$
DECLARE
  providers TEXT[];
BEGIN
  SELECT COALESCE(ARRAY_AGG(DISTINCT provider), '{}'::text[]) INTO providers
  FROM auth.identities i
  JOIN auth.users u ON i.user_id = u.id
  WHERE u.email = email_param;
  
  RETURN providers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

