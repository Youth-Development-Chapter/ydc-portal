-- ==========================================
-- 20260608000000_comprehensive_updates.sql
-- ==========================================

-- 1. Create Units Table
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

-- 2. Update Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS city;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS district;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS division;

-- 3. Update Events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
-- If unit_id is NULL, it's a provincial event. If unit_id is set, it's a city event.

-- 4. Update Announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_users UUID[];

-- 5. Update Deed Submissions
-- Allow 'flagged' status
ALTER TABLE public.deed_submissions DROP CONSTRAINT IF EXISTS deed_submissions_status_check;
ALTER TABLE public.deed_submissions ADD CONSTRAINT deed_submissions_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'));

ALTER TABLE public.deed_submissions ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.profiles(id);

-- 6. Update Coin Transactions
ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id);

-- 7. Update Rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS inclusive_unit_ids UUID[];
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS exclusive_unit_ids UUID[];

-- ==========================================
-- 8. Advanced Streak Logic
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_user_streak(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
    has_deed BOOLEAN;
    latest_deed_date DATE;
    longest INTEGER := 0;
BEGIN
    -- Find the most recent date with a valid deed (approved or pending)
    SELECT MAX(local_date) INTO latest_deed_date
    FROM public.deed_submissions
    WHERE user_id = target_user_id AND status IN ('approved', 'pending');

    IF latest_deed_date IS NULL THEN
        -- No valid deeds ever
        UPDATE public.streaks 
        SET current_streak = 0, last_deed_date = NULL, updated_at = now() 
        WHERE user_id = target_user_id;
        RETURN;
    END IF;

    -- Calculate continuous streak going backwards from latest_deed_date
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
            EXIT; -- Gap found, streak broken
        END IF;
    END LOOP;

    -- Get current longest to preserve it
    SELECT longest_streak INTO longest FROM public.streaks WHERE user_id = target_user_id;
    IF longest IS NULL THEN longest := 0; END IF;

    -- Upsert streak
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_deed_date, updated_at)
    VALUES (target_user_id, streak_count, GREATEST(streak_count, longest), latest_deed_date, now())
    ON CONFLICT (user_id) DO UPDATE 
    SET current_streak = EXCLUDED.current_streak,
        longest_streak = GREATEST(public.streaks.longest_streak, EXCLUDED.longest_streak),
        last_deed_date = EXCLUDED.last_deed_date,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function that fires on ANY change to deed_submissions
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

-- Remove old streak logic from handle_deed_approval
-- We will replace handle_deed_approval with handle_deed_coins

DROP TRIGGER IF EXISTS on_deed_approval ON public.deed_submissions;
DROP FUNCTION IF EXISTS public.handle_deed_approval();

-- Trigger for streaks
DROP TRIGGER IF EXISTS on_deed_change_update_streak ON public.deed_submissions;
CREATE TRIGGER on_deed_change_update_streak
    AFTER INSERT OR UPDATE OF status, local_date OR DELETE ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_streak();

-- Separate Trigger for Coins only
CREATE OR REPLACE FUNCTION public.handle_deed_coins()
RETURNS TRIGGER AS $$
BEGIN
    -- Award coins on approval
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, processed_by)
        VALUES (NEW.user_id, NEW.coin_reward + NEW.bonus_coins, 'daily_deed', NEW.id, NEW.status_updated_by);
        
    -- Deduct coins on flagged
    ELSIF NEW.status = 'flagged' AND (OLD.status IS NULL OR OLD.status != 'flagged') THEN
        -- Check if it was previously approved to deduct the reward they got?
        -- The instruction says "deduct 10 (or if more serious then some extra coins)".
        -- For simplicity, deduct 10 as a flat penalty for being flagged.
        -- If they were already approved, they might have gotten 10, so they lose 10. 
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, processed_by)
        VALUES (NEW.user_id, -10, 'deed_flagged', NEW.id, NEW.status_updated_by);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_deed_status_coins
    AFTER UPDATE OF status ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deed_coins();

-- 9. Update Reward Redemptions
ALTER TABLE public.reward_redemptions ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_status_check;
ALTER TABLE public.reward_redemptions ADD CONSTRAINT reward_redemptions_status_check CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'rejected'));
