-- Quiz attempts tracking — failed-attempt counter per (user, lesson).
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    last_attempt_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can read their own attempts (for showing attempt count if we ever do).
DROP POLICY IF EXISTS "Allow users to read their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to read their own quiz attempts"
    ON public.quiz_attempts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own attempts.
DROP POLICY IF EXISTS "Allow users to record their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to record their own quiz attempts"
    ON public.quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempt rows (to increment failed_attempts).
DROP POLICY IF EXISTS "Allow users to update their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow users to update their own quiz attempts"
    ON public.quiz_attempts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins have full control.
DROP POLICY IF EXISTS "Allow administrators full control over quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow administrators full control over quiz attempts"
    ON public.quiz_attempts FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')));
