-- Migration: Add Event Posters & Accent Colors
-- Adds columns to events table and sets up the event-posters storage bucket.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS poster_color TEXT;

-- Create storage bucket for event posters
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
