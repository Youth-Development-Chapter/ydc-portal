
CREATE OR REPLACE FUNCTION public.handle_deed_approval()
RETURNS TRIGGER AS \$\$
DECLARE
    today_date DATE := CURRENT_DATE;
    user_streak_record RECORD;
    new_streak INTEGER := 0;
    max_streak INTEGER := 1;
    total_coins INTEGER;
    current_check_date DATE;
    has_valid_deed BOOLEAN;
BEGIN
    -- Run on transition to 'approved' OR 'rejected'
    IF (NEW.status = 'approved' OR NEW.status = 'rejected') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        
        SELECT * INTO user_streak_record FROM public.streaks WHERE user_id = NEW.user_id;
        
        -- Recalculate streak
        current_check_date := today_date;
        new_streak := 0;

        -- First check today
        SELECT EXISTS (
            SELECT 1 FROM public.deed_submissions 
            WHERE user_id = NEW.user_id AND local_date = current_check_date AND status IN ('approved', 'pending')
        ) INTO has_valid_deed;

        IF has_valid_deed THEN
            new_streak := 1;
        ELSE
            -- If no deed today, check yesterday. If no deed yesterday, streak is 0.
            current_check_date := today_date - INTERVAL '1 day';
            SELECT EXISTS (
                SELECT 1 FROM public.deed_submissions 
                WHERE user_id = NEW.user_id AND local_date = current_check_date AND status IN ('approved', 'pending')
            ) INTO has_valid_deed;
            
            IF NOT has_valid_deed THEN
                new_streak := 0;
            END IF;
        END IF;

        IF new_streak > 0 OR has_valid_deed THEN
            -- Count backwards as long as there's a valid deed
            LOOP
                current_check_date := current_check_date - INTERVAL '1 day';
                SELECT EXISTS (
                    SELECT 1 FROM public.deed_submissions 
                    WHERE user_id = NEW.user_id AND local_date = current_check_date AND status IN ('approved', 'pending')
                ) INTO has_valid_deed;

                IF has_valid_deed THEN
                    new_streak := new_streak + 1;
                ELSE
                    EXIT;
                END IF;
            END LOOP;
        END IF;

        IF NOT FOUND THEN
            INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_deed_date, updated_at)
            VALUES (NEW.user_id, new_streak, new_streak, NEW.local_date, now());
        ELSE
            max_streak := GREATEST(new_streak, user_streak_record.longest_streak);
            UPDATE public.streaks 
            SET current_streak = new_streak,
                longest_streak = max_streak,
                last_deed_date = NEW.local_date,
                updated_at = now()
            WHERE user_id = NEW.user_id;
        END IF;

        -- Insert coins ONLY if transitioning to 'approved'
        IF NEW.status = 'approved' THEN
            total_coins := NEW.coin_reward + NEW.bonus_coins;
            INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, credited_by)
            VALUES (NEW.user_id, total_coins, 'daily_deed', NEW.id, NEW.verified_by);
        END IF;

    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;
