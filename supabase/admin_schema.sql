-- YDC Database Schema Updates for Administration Dashboard
-- Execute this script in your Supabase SQL Editor to set up administrative roles, permissions, settings, and automation triggers.

-- 1. Update Profiles Role Check Constraint
-- Allows volunteer, superadmin, president, and tier-3 admin roles.
-- Since the existing constraint is profiles_role_check, we drop it and recreate it.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('volunteer', 'admin', 'superadmin', 'president', 'tier-3'));

-- 2. Create Admin Permissions Table
-- Defines granular access flags for 'tier-3' admins
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

-- Enable RLS on Admin Permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins/volunteers to read permissions (needed for checking auth client-side/server-side)
CREATE POLICY "Allow authenticated users to read permissions"
    ON public.admin_permissions FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only superadmins and presidents can create, edit, or delete admin permissions
CREATE POLICY "Allow superadmins and presidents full control over permissions"
    ON public.admin_permissions FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('superadmin', 'president')
        )
    );

-- 3. Upgrade Deed Submissions Table
-- Adds base reward and bonus points columns
ALTER TABLE public.deed_submissions 
    ADD COLUMN IF NOT EXISTS coin_reward INTEGER DEFAULT 10 NOT NULL,
    ADD COLUMN IF NOT EXISTS bonus_coins INTEGER DEFAULT 0 NOT NULL;

-- 4. Upgrade Courses Table
-- Adds course completion reward points
ALTER TABLE public.courses 
    ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 50 NOT NULL;

-- 5. Create System Settings Table
-- For managing base coins across actions
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to system settings"
    ON public.system_settings FOR SELECT USING (true);

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

-- 6. Update handle_deed_approval Trigger Function
-- Uses coin_reward + bonus_coins dynamically
CREATE OR REPLACE FUNCTION public.handle_deed_approval()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
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

-- 7. Add Course Completion Auto-Reward Trigger Function
-- Automatically credits reward_points when user completes all lessons in a course
CREATE OR REPLACE FUNCTION public.handle_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    course_reward INTEGER;
    already_awarded BOOLEAN;
BEGIN
    -- 1. Get total number of lessons in this course
    SELECT COUNT(*) INTO total_lessons 
    FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = NEW.course_id;

    -- 2. Get number of completed lessons for this user and course
    SELECT COUNT(*) INTO completed_lessons
    FROM public.user_progress
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND completed = true;

    -- 3. Check if the course is fully completed
    IF completed_lessons >= total_lessons AND total_lessons > 0 THEN
        -- Check if we already rewarded the user for this course completion
        SELECT EXISTS(
            SELECT 1 FROM public.coin_transactions
            WHERE user_id = NEW.user_id 
              AND reason = 'course_completion:' || NEW.course_id
        ) INTO already_awarded;

        IF NOT already_awarded THEN
            -- Get course reward points
            SELECT reward_points INTO course_reward FROM public.courses WHERE id = NEW.course_id;
            IF course_reward IS NULL THEN
                course_reward := 50; -- fallback
            END IF;

            -- Award coins
            INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
            VALUES (NEW.user_id, course_reward, 'course_completion:' || NEW.course_id, NULL);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_progress_completed ON public.user_progress;
CREATE TRIGGER on_progress_completed
    AFTER INSERT OR UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_course_completion();
