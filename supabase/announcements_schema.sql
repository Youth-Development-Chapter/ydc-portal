-- YDC Announcements & Notice Board
-- Run this script in your Supabase SQL Editor.

-- 1. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read announcements
CREATE POLICY "Allow authenticated users to read announcements"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only admins can create / update / delete
CREATE POLICY "Allow admins to manage announcements"
    ON public.announcements FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        )
    );

-- Index for ordering (pinned first, then newest)
CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created
    ON public.announcements (is_pinned DESC, created_at DESC);
