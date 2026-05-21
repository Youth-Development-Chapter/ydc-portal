-- YDC Database Schema Initialization
-- Execute this script in your Supabase SQL Editor to set up the necessary tables, policies, and triggers.

-- Ensure Profiles table has Role column for Access Control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'volunteer' NOT NULL CHECK (role IN ('volunteer', 'admin'));

-- 1. Events Table
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

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to events" 
    ON public.events FOR SELECT USING (true);

CREATE POLICY "Allow administrators write access to events" 
    ON public.events FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 2. Event Registrations Table
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

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow users to read their own registrations" 
    ON public.event_registrations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to register themselves for events" 
    ON public.event_registrations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow administrators full control over registrations" 
    ON public.event_registrations FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 3. Deed Submissions Table
CREATE TABLE IF NOT EXISTS public.deed_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    proof_url TEXT NOT NULL, -- Path in Supabase Storage bucket 'deeds'
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.deed_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow users to read their own deed submissions" 
    ON public.deed_submissions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to submit their own deeds" 
    ON public.deed_submissions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow administrators full control over deed submissions" 
    ON public.deed_submissions FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 4. User Streaks Table
CREATE TABLE IF NOT EXISTS public.streaks (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_deed_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow anyone to read user streaks (for leaderboards)" 
    ON public.streaks FOR SELECT USING (true);

CREATE POLICY "Allow administrators write access to streaks" 
    ON public.streaks FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 5. Coin Transactions Table (Append-Only Ledger)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- positive for earnings, negative for purchases
    reason TEXT NOT NULL, -- e.g. 'course_completion', 'event_attendance', 'daily_deed', 'reward_redeem'
    reference_id UUID, -- reference to event_registration, deed_submission, etc.
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow users to read their own transaction history" 
    ON public.coin_transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow administrators write access to transactions" 
    ON public.coin_transactions FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 6. Trigger Function to Automatically Update Streaks and Credit Coins on Deed Approval
CREATE OR REPLACE FUNCTION public.handle_deed_approval()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    user_streak_record RECORD;
    new_streak INTEGER := 1;
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
                -- Already did a deed today, streak count stays the same
                new_streak := user_streak_record.current_streak;
            ELSIF user_streak_record.last_deed_date = today_date - INTERVAL '1 day' THEN
                -- Consecutive day, increment streak
                new_streak := user_streak_record.current_streak + 1;
            ELSE
                -- Streak broke, reset to 1
                new_streak := 1;
            END IF;
            
            UPDATE public.streaks 
            SET current_streak = new_streak,
                longest_streak = GREATEST(new_streak, longest_streak),
                last_deed_date = today_date,
                updated_at = now()
            WHERE user_id = NEW.user_id;
        END IF;

        -- Insert coin transaction (+10 Coins for approved deed)
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
        VALUES (NEW.user_id, 10, 'daily_deed', NEW.id);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on Deed Submissions Table
CREATE OR REPLACE TRIGGER on_deed_approval
    AFTER UPDATE OF status ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deed_approval();

-- =========================================================================
-- LMS TABLES SECTION
-- =========================================================================

-- 7. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY, -- e.g. 'deenyat', 'seerat'
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies for courses
CREATE POLICY "Allow public read access to courses" 
    ON public.courses FOR SELECT USING (true);

CREATE POLICY "Allow administrators full control over courses" 
    ON public.courses FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 8. Modules Table
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY, -- e.g. 'd_m1', 'd_m2'
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    duration TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Policies for modules
CREATE POLICY "Allow public read access to modules" 
    ON public.modules FOR SELECT USING (true);

CREATE POLICY "Allow administrators full control over modules" 
    ON public.modules FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 9. Lessons Table
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY, -- e.g. 'd_m1', 'd_m2' (can map to module_id for convenience)
    module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    text_content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policies for lessons
CREATE POLICY "Allow public read access to lessons" 
    ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Allow administrators full control over lessons" 
    ON public.lessons FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 10. MCQs Table
CREATE TABLE IF NOT EXISTS public.mcqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- JSON array of strings: ["Option 1", "Option 2"]
    correct_answer_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.mcqs ENABLE ROW LEVEL SECURITY;

-- Policies for MCQs
CREATE POLICY "Allow public read access to mcqs" 
    ON public.mcqs FOR SELECT USING (true);

CREATE POLICY "Allow administrators full control over mcqs" 
    ON public.mcqs FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));


-- 11. User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT true NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for User Progress
CREATE POLICY "Allow users to read their own progress" 
    ON public.user_progress FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to record their own progress" 
    ON public.user_progress FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow administrators full control over progress" 
    ON public.user_progress FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));

