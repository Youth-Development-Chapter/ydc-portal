-- Migration to implement granular gamification rewards for LMS courses.
-- 60% of course reward points are split among chapters.
-- Difficulty modifiers are applied: Beginner (-30%), Standard (0%), Expert (+30%).
-- 40% of course reward points are awarded as completion bonus.

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
    -- 1. Get total modules (chapters) and the course reward points (T)
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

    -- Fallback safety
    IF total_modules IS NULL OR total_modules = 0 THEN
        total_modules := 1;
    END IF;
    IF module_idx IS NULL OR module_idx = 0 THEN
        module_idx := 1;
    END IF;

    -- 2. Calculate base chapter coins using the fractional distribution formula
    base_chapter_coins := FLOOR((0.6 * course_reward * module_idx) / total_modules) - 
                          FLOOR((0.6 * course_reward * (module_idx - 1)) / total_modules);

    -- 3. Determine difficulty level and multiplier
    IF NEW.difficulty = 'beginner' THEN
        difficulty_multiplier := 0.7;
    ELSIF NEW.difficulty = 'expert' THEN
        difficulty_multiplier := 1.3;
    ELSE
        difficulty_multiplier := 1.0; -- 'advanced' (Standard)
    END IF;

    calculated_chapter_coins := ROUND(base_chapter_coins * difficulty_multiplier);

    -- 4. Check previously awarded coins for this specific user, course, and lesson
    chapter_reason := 'chapter_completion:' || NEW.course_id || ':' || NEW.lesson_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO max_earned_coins
    FROM public.coin_transactions
    WHERE user_id = NEW.user_id 
      AND reason LIKE (chapter_reason || '%');

    -- Calculate upgrade difference
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

    -- 5. Handle Course Completion
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

    -- Check if course is fully completed in this language track
    IF completed_lessons >= total_lessons AND total_lessons > 0 THEN
        completion_reason := 'course_completion:' || NEW.course_id || ':' || NEW.language;
        
        SELECT EXISTS(
            SELECT 1 FROM public.coin_transactions
            WHERE user_id = NEW.user_id 
              AND reason = completion_reason
        ) INTO already_awarded;

        IF NOT already_awarded THEN
            completion_bonus := course_reward - FLOOR(0.6 * course_reward);
            
            -- Award completion bonus coins, linking it to progress ID for frontend lookup
            INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id)
            VALUES (NEW.user_id, completion_bonus, completion_reason, NEW.id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
