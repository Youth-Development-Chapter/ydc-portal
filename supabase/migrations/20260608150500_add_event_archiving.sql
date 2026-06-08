-- Add is_archived column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;

-- Recreate RLS Select policy for events to restrict archived events to administrators
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to events"
    ON public.events FOR SELECT USING (
        is_archived = false OR 
        (auth.uid() IS NOT NULL AND auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin', 'president', 'tier-3')
        ))
    );
