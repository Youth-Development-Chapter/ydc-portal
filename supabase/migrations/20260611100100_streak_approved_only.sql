-- Streaks should reflect approved work only.
-- Previously update_user_streak() counted deeds with status IN ('approved','pending'),
-- so a streak inflated the moment a deed was submitted and collapsed if it was later
-- rejected. Now only 'approved' deeds count; the on_deed_change_update_streak trigger
-- already fires on status changes, so approval recomputes the streak correctly.
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
