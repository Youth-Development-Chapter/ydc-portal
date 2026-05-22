-- YDC Portal Database Schema Initialization
-- Execute this script in your Supabase SQL Editor to set up the necessary tables, policies, triggers, indexes, and storage buckets.

-- =========================================================================
-- 1. PROFILES & ROLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
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
    updated_at TIMESTAMPTZ DEFAULT now()
);

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
    time TEXT NOT NULL, -- e.g., "9:00 AM - 5:00 PM"
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to events"
    ON public.events FOR SELECT USING (true);

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

-- =========================================================================
-- 3. DEED SUBMISSIONS & STREAKS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.deed_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    proof_url TEXT NOT NULL, -- Path in Supabase Storage bucket 'deeds'
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
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
    author TEXT NOT NULL,
    description TEXT,
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
    video_url TEXT,
    text_content TEXT NOT NULL,
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
    options JSONB NOT NULL, -- JSON array of strings
    correct_answer_index INTEGER NOT NULL,
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
    completed BOOLEAN DEFAULT true NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, course_id, lesson_id)
);

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
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
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

-- Trigger to update Streaks & Credit Coins upon Deed Approval
CREATE OR REPLACE FUNCTION public.handle_deed_approval()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := NEW.local_date;
    user_streak_record RECORD;
    new_streak INTEGER := 1;
    total_coins INTEGER;
BEGIN
    -- Only run on transition to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Check if user has a streak record, insert if not
        SELECT * INTO user_streak_record FROM public.streaks WHERE user_id = NEW.user_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_deed_date, updated_at)
            VALUES (NEW.user_id, 1, 1, today_date, now());
        ELSE
            -- Streak calculation
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

        -- Sum base reward and bonus coins
        total_coins := NEW.coin_reward + NEW.bonus_coins;

        -- Insert coin transaction
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
        VALUES (NEW.user_id, total_coins, 'daily_deed', NEW.id);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deed_approval ON public.deed_submissions;
CREATE TRIGGER on_deed_approval
    AFTER UPDATE OF status ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deed_approval();

-- Trigger to Automatically Reward Coins on Course Completion
CREATE OR REPLACE FUNCTION public.handle_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    course_reward INTEGER;
    already_awarded BOOLEAN;
BEGIN
    -- Get total number of lessons in this course
    SELECT COUNT(*) INTO total_lessons 
    FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = NEW.course_id;

    -- Get number of completed lessons for this user and course
    SELECT COUNT(*) INTO completed_lessons
    FROM public.user_progress
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND completed = true;

    -- Check if course is fully completed
    IF completed_lessons >= total_lessons AND total_lessons > 0 THEN
        -- Check if we already rewarded the user for this course completion
        SELECT EXISTS(
            SELECT 1 FROM public.coin_transactions
            WHERE user_id = NEW.user_id 
              AND reason = 'course_completion:' || NEW.course_id
        ) INTO already_awarded;

        IF NOT already_awarded THEN
            -- Get course reward points
            SELECT COALESCE(reward_points, 50) INTO course_reward 
            FROM public.courses 
            WHERE id = NEW.course_id;

            -- Award coins
            INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
            VALUES (NEW.user_id, course_reward, 'course_completion:' || NEW.course_id, NULL);
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
