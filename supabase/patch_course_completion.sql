-- 1. Ensure public.courses has the reward_points column
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 50 NOT NULL;

-- 2. Create the Course Completion Auto-Reward Trigger Function
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

-- 3. Re-create trigger safely on user_progress table
DROP TRIGGER IF EXISTS on_progress_completed ON public.user_progress;
CREATE TRIGGER on_progress_completed
    AFTER INSERT OR UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_course_completion();

-- 4. Proactive Backfill: Award coins to users who already completed courses but weren't rewarded
DO $$
DECLARE
    rec RECORD;
    total_l INTEGER;
    comp_l INTEGER;
    reward_pts INTEGER;
    already_rew BOOLEAN;
BEGIN
    -- Loop through all unique user + course completions
    FOR rec IN 
        SELECT DISTINCT user_id, course_id 
        FROM public.user_progress 
        WHERE completed = true
    LOOP
        -- Count total lessons in course
        SELECT COUNT(*) INTO total_l 
        FROM public.lessons l
        JOIN public.modules m ON l.module_id = m.id
        WHERE m.course_id = rec.course_id;

        -- Count user's completed lessons
        SELECT COUNT(*) INTO comp_l 
        FROM public.user_progress
        WHERE user_id = rec.user_id AND course_id = rec.course_id AND completed = true;

        -- Check if completed and not already awarded
        IF comp_l >= total_l AND total_l > 0 THEN
            SELECT EXISTS(
                SELECT 1 FROM public.coin_transactions
                WHERE user_id = rec.user_id AND reason = 'course_completion:' || rec.course_id
            ) INTO already_rew;

            IF NOT already_rew THEN
                -- Fetch course reward points
                SELECT COALESCE(reward_points, 50) INTO reward_pts 
                FROM public.courses 
                WHERE id = rec.course_id;

                -- Insert missing coins
                INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
                VALUES (rec.user_id, reward_pts, 'course_completion:' || rec.course_id, NULL);
            END IF;
        END IF;
    END LOOP;
END $$;
