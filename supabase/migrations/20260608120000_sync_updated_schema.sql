-- Sync migration for the current YDC Portal schema.
-- Apply this to bring an existing database up to the same shape as the checked-in schema.sql.

-- ---------------------------------------------------------------------------
-- Core unit-scoped data model
-- ---------------------------------------------------------------------------

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

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS custom_criteria JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS target_users UUID[];

-- ---------------------------------------------------------------------------
-- Deed approvals, streaks, and coin ledger
-- ---------------------------------------------------------------------------

ALTER TABLE public.deed_submissions
    DROP CONSTRAINT IF EXISTS deed_submissions_status_check;
ALTER TABLE public.deed_submissions
    ADD CONSTRAINT deed_submissions_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE public.deed_submissions
    ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.coin_transactions
    ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id);

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
    WHERE user_id = target_user_id AND status IN ('approved', 'pending');

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
              AND status IN ('approved', 'pending')
        ) INTO has_deed;

        IF has_deed THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;

    SELECT longest_streak INTO longest FROM public.streaks WHERE user_id = target_user_id;
    IF longest IS NULL THEN
        longest := 0;
    END IF;

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
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, processed_by)
        VALUES (NEW.user_id, NEW.coin_reward + NEW.bonus_coins, 'daily_deed', NEW.id, NEW.status_updated_by);
    ELSIF NEW.status = 'flagged' AND (OLD.status IS NULL OR OLD.status != 'flagged') THEN
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, processed_by)
        VALUES (NEW.user_id, -10, 'deed_flagged', NEW.id, NEW.status_updated_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deed_status_coins ON public.deed_submissions;
CREATE TRIGGER on_deed_status_coins
    AFTER UPDATE OF status ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deed_coins();

-- ---------------------------------------------------------------------------
-- LMS bilingual and difficulty tracking
-- ---------------------------------------------------------------------------

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title_ur TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description_ur TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS title_ur TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS title_ur TEXT;
ALTER TABLE public.mcqs ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner' NOT NULL CHECK (difficulty IN ('beginner', 'advanced', 'expert'));
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' NOT NULL CHECK (language IN ('en', 'ur'));
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner' NOT NULL CHECK (difficulty IN ('beginner', 'advanced', 'expert'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_progress_user_course_lesson_language_difficulty_key'
    ) THEN
        ALTER TABLE public.user_progress
            ADD CONSTRAINT user_progress_user_course_lesson_language_difficulty_key
            UNIQUE (user_id, course_id, lesson_id, language, difficulty);
    END IF;
END $$;

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
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC) AS order_index_pos
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
        VALUES (NEW.user_id, coins_to_award, chapter_reason || ':' || NEW.difficulty, NEW.id);
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

-- ---------------------------------------------------------------------------
-- Rewards and redemptions
-- ---------------------------------------------------------------------------

ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS inclusive_unit_ids UUID[];
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS exclusive_unit_ids UUID[];

ALTER TABLE public.reward_redemptions ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_status_check;
ALTER TABLE public.reward_redemptions ADD CONSTRAINT reward_redemptions_status_check CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'rejected'));

-- ---------------------------------------------------------------------------
-- Aggregation RPCs
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