-- Consolidated YDC Portal Migration Script (Phase 2 Updates)
-- Run this in your Supabase SQL Editor

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

-- 2. Drop old dependent policies on profiles.division
DROP POLICY IF EXISTS "Allow read access to events" ON public.events;
DROP POLICY IF EXISTS "Allow presidents and event managers to manage division events" ON public.events;
DROP POLICY IF EXISTS "Allow presidents and deed approvers to manage division deed sub" ON public.deed_submissions;
DROP POLICY IF EXISTS "Allow presidents and deed approvers to manage division deed submissions" ON public.deed_submissions;
DROP POLICY IF EXISTS "Allow presidents to manage their division admin permissions" ON public.admin_permissions;

-- 3. Update Profiles (Add unit_id)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS city;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS district;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS division;

-- 3. Update Events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_criteria JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS excluded_divisions TEXT[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS poster_color TEXT;

-- 4. Update Announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS excluded_unit_ids UUID[];
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_users UUID[];

-- 5. Update Deed Submissions
ALTER TABLE public.deed_submissions DROP CONSTRAINT IF EXISTS deed_submissions_status_check;
ALTER TABLE public.deed_submissions ADD CONSTRAINT deed_submissions_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE public.deed_submissions ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.profiles(id);

-- 6. Update Coin Transactions
ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS credited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id);

-- 7. Update Rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS inclusive_unit_ids UUID[];
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS exclusive_unit_ids UUID[];
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS custom_criteria JSONB DEFAULT '{}'::jsonb;

-- 8. Update Reward Redemptions
ALTER TABLE public.reward_redemptions ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_status_check;
ALTER TABLE public.reward_redemptions ADD CONSTRAINT reward_redemptions_status_check CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'rejected'));

-- 9. Enhance event_registrations for leaves and dynamic attendance
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'present', 'absent', 'leave_pending', 'leave_approved', 'leave_rejected'));
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS leave_note TEXT;

-- For existing registrations that were attended, update status
UPDATE public.event_registrations SET status = 'present' WHERE attended = true;

-- 10. Default Rank Tiers Settings
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'rank_tiers',
    '[{"name": "Bronze Tier", "threshold": 0}, {"name": "Silver Tier", "threshold": 500}, {"name": "Gold Tier", "threshold": 1000}, {"name": "Platinum Tier", "threshold": 2500}]',
    'JSON array configuring rank tiers based on YDC Coin thresholds.'
)
ON CONFLICT (key) DO NOTHING;

-- 11. Advanced Streak Recalculation Function
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

-- 12. Trigger function to fire on ANY change to deed_submissions
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

-- Remove old triggers & functions
DROP TRIGGER IF EXISTS on_deed_approval ON public.deed_submissions;
DROP FUNCTION IF EXISTS public.handle_deed_approval();

-- Trigger for streaks
DROP TRIGGER IF EXISTS on_deed_change_update_streak ON public.deed_submissions;
CREATE TRIGGER on_deed_change_update_streak
    AFTER INSERT OR UPDATE OF status, local_date OR DELETE ON public.deed_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_streak();

-- Trigger for Coins only
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

-- 13. Create Leaderboard RPC Function with Unit Filters
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

-- 14. Recreate unit-scoped RLS policies using unit_id instead of division

-- For public.events
CREATE POLICY "Allow read access to events"
    ON public.events FOR SELECT
    USING (
        unit_id IS NULL
        OR
        (
            auth.uid() IS NOT NULL 
            AND (
                (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
                OR
                unit_id = (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Allow presidents and event managers to manage division events" ON public.events
FOR ALL
USING (
    (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'president'
        OR
        (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'tier-3'
            AND EXISTS (
                SELECT 1 FROM public.admin_permissions 
                WHERE admin_id = auth.uid() AND can_manage_events = true
            )
        )
    )
    AND
    unit_id = (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
);

-- For public.deed_submissions
CREATE POLICY "Allow presidents and deed approvers to manage division deed submissions" ON public.deed_submissions
FOR ALL
USING (
    (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'president'
        OR
        (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'tier-3'
            AND EXISTS (
                SELECT 1 FROM public.admin_permissions 
                WHERE admin_id = auth.uid() AND can_approve_deeds = true
            )
        )
    )
    AND
    (SELECT unit_id FROM public.profiles WHERE id = user_id) = (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
);

-- For public.admin_permissions
CREATE POLICY "Allow presidents to manage their division admin permissions" ON public.admin_permissions
FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'president'
    AND
    (SELECT unit_id FROM public.profiles WHERE id = admin_id) = (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
);

-- =========================================================================
-- 15. CHECK USER PROVIDERS BY EMAIL
-- =========================================================================

CREATE OR REPLACE FUNCTION public.check_user_providers(email_param TEXT)
RETURNS TEXT[] AS $$
DECLARE
  providers TEXT[];
BEGIN
  SELECT COALESCE(ARRAY_AGG(DISTINCT provider), '{}'::text[]) INTO providers
  FROM auth.identities i
  JOIN auth.users u ON i.user_id = u.id
  WHERE u.email = email_param;
  
  RETURN providers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- =========================================================================
-- 16. STORAGE BUCKET FOR EVENT POSTERS
-- =========================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects for 'event-posters' bucket
DROP POLICY IF EXISTS "Allow public select on event-posters" ON storage.objects;
CREATE POLICY "Allow public select on event-posters" ON storage.objects FOR SELECT USING (bucket_id = 'event-posters');

DROP POLICY IF EXISTS "Allow admin write access to event-posters" ON storage.objects;
CREATE POLICY "Allow admin write access to event-posters" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'event-posters' AND (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    )
);

DROP POLICY IF EXISTS "Allow admin update access to event-posters" ON storage.objects;
CREATE POLICY "Allow admin update access to event-posters" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'event-posters' AND (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    )
);

DROP POLICY IF EXISTS "Allow admin delete access to event-posters" ON storage.objects;
CREATE POLICY "Allow admin delete access to event-posters" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'event-posters' AND (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    )
);
