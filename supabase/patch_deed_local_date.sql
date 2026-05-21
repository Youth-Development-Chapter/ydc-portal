-- 1. Add local_date column if it doesn't exist
ALTER TABLE public.deed_submissions ADD COLUMN IF NOT EXISTS local_date DATE;

-- 2. Backfill existing submissions
-- Cast UTC created_at to Asia/Karachi (PKT, UTC+5) for local calendar dates
UPDATE public.deed_submissions 
SET local_date = COALESCE(
  (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi')::DATE, 
  created_at::DATE
) 
WHERE local_date IS NULL;

-- 3. Set the column to NOT NULL after backfilling
ALTER TABLE public.deed_submissions ALTER COLUMN local_date SET NOT NULL;

-- 4. Update the trigger function to use NEW.local_date instead of CURRENT_DATE
CREATE OR REPLACE FUNCTION public.handle_deed_approval()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := NEW.local_date;
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
            -- Streak calculation based on local_date
            IF user_streak_record.last_deed_date = today_date THEN
                -- Already did a deed on this local day, streak count stays the same
                new_streak := user_streak_record.current_streak;
            ELSIF user_streak_record.last_deed_date = today_date - INTERVAL '1 day' THEN
                -- Consecutive day, increment streak
                new_streak := user_streak_record.current_streak + 1;
            ELSE
                -- Streak broke (more than 1 day since last deed), reset to 1
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

-- 5. Re-create trigger safely
DROP TRIGGER IF EXISTS on_deed_approval ON public.deed_submissions;
CREATE TRIGGER on_deed_approval
    AFTER UPDATE OF status ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deed_approval();
