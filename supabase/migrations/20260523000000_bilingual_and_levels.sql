-- 1. Add Urdu columns to courses, modules, lessons
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title_ur TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description_ur TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS title_ur TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS title_ur TEXT;

-- 2. Add difficulty to mcqs
ALTER TABLE public.mcqs ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'advanced', 'expert')) NOT NULL;

-- 3. Update user_progress table
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ur')) NOT NULL;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'advanced', 'expert')) NOT NULL;

-- Drop old unique constraint and add new one
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_course_id_lesson_id_key;
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_course_id_lesson_id_uniq;

-- Add the new unique constraint
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_course_lesson_lang_diff_key UNIQUE (user_id, course_id, lesson_id, language, difficulty);

-- 4. Create user_course_settings table
CREATE TABLE IF NOT EXISTS public.user_course_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    language TEXT CHECK (language IN ('en', 'ur')) NOT NULL,
    PRIMARY KEY (user_id, course_id)
);

-- Enable RLS for user_course_settings
ALTER TABLE public.user_course_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_course_settings
DROP POLICY IF EXISTS "Allow users to read their own settings" ON public.user_course_settings;
CREATE POLICY "Allow users to read their own settings"
    ON public.user_course_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own settings" ON public.user_course_settings;
CREATE POLICY "Allow users to insert their own settings"
    ON public.user_course_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own settings" ON public.user_course_settings;
CREATE POLICY "Allow users to update their own settings"
    ON public.user_course_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow administrators full control over settings" ON public.user_course_settings;
CREATE POLICY "Allow administrators full control over settings"
    ON public.user_course_settings FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles
        WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
    ));

-- 5. Storage bucket configuration
INSERT INTO storage.buckets (id, name, public) 
VALUES ('courses', 'courses', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects for 'courses' bucket
DROP POLICY IF EXISTS "Allow public select on courses" ON storage.objects;
CREATE POLICY "Allow public select on courses" ON storage.objects FOR SELECT USING (bucket_id = 'courses');

DROP POLICY IF EXISTS "Allow admin write access to courses" ON storage.objects;
CREATE POLICY "Allow admin write access to courses" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'courses' AND (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    )
);

DROP POLICY IF EXISTS "Allow admin update access to courses" ON storage.objects;
CREATE POLICY "Allow admin update access to courses" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'courses' AND (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    )
);

DROP POLICY IF EXISTS "Allow admin delete access to courses" ON storage.objects;
CREATE POLICY "Allow admin delete access to courses" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'courses' AND (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    )
);

-- 6. Trigger modifications
-- Update handle_course_completion function to evaluate progress per language track
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

    -- Get number of completed lessons for this user, course, and specific language track
    -- We check if they passed at least one difficulty for each lesson in this language
    SELECT COUNT(DISTINCT lesson_id) INTO completed_lessons
    FROM public.user_progress
    WHERE user_id = NEW.user_id 
      AND course_id = NEW.course_id 
      AND language = NEW.language 
      AND completed = true;

    -- Check if course is fully completed in this language track
    IF completed_lessons >= total_lessons AND total_lessons > 0 THEN
        -- Check if we already rewarded the user for this specific course + language completion
        SELECT EXISTS(
            SELECT 1 FROM public.coin_transactions
            WHERE user_id = NEW.user_id 
              AND reason = 'course_completion:' || NEW.course_id || ':' || NEW.language
        ) INTO already_awarded;

        IF NOT already_awarded THEN
            -- Get course reward points
            SELECT COALESCE(reward_points, 50) INTO course_reward 
            FROM public.courses 
            WHERE id = NEW.course_id;

            -- Award coins
            INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
            VALUES (NEW.user_id, course_reward, 'course_completion:' || NEW.course_id || ':' || NEW.language, NULL);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
