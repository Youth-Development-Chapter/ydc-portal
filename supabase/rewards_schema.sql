-- YDC Reward Shop Schema
-- Run this script in your Supabase SQL Editor.

-- 1. Rewards (items available in the shop)
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
    quantity_available INTEGER,   -- NULL = unlimited
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active rewards
CREATE POLICY "Allow authenticated users to read active rewards"
    ON public.rewards FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Admins can manage all rewards
CREATE POLICY "Allow admins to manage rewards"
    ON public.rewards FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    );

-- 2. Reward Redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    coin_cost INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    redeemed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own redemptions
CREATE POLICY "Allow users to read their own redemptions"
    ON public.reward_redemptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own redemptions (coin deduction handled by app server action)
CREATE POLICY "Allow users to create their own redemptions"
    ON public.reward_redemptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins full control
CREATE POLICY "Allow admins to manage redemptions"
    ON public.reward_redemptions FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    );

-- Index for user redemption history
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user
    ON public.reward_redemptions (user_id, redeemed_at DESC);

-- Index for rewards availability
CREATE INDEX IF NOT EXISTS idx_rewards_active
    ON public.rewards (is_active, coin_cost);
