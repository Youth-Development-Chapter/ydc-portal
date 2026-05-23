-- Migration: Implement Role-Based Access Controls (RBAC)
-- Focuses on division-scoping for presidents and event managers

-- 1. Add division column to events table if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS division TEXT;

-- 2. Update events RLS policies
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
DROP POLICY IF EXISTS "Allow read access to events" ON public.events;
CREATE POLICY "Allow read access to events"
    ON public.events FOR SELECT
    USING (
        division IS NULL
        OR
        (
            auth.uid() IS NOT NULL 
            AND (
                (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
                OR
                division = (SELECT division FROM public.profiles WHERE id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Allow administrators write access to events" ON public.events;
DROP POLICY IF EXISTS "Allow administrators full control over events" ON public.events;
CREATE POLICY "Allow administrators full control over events" ON public.events
FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Allow presidents and event managers to manage division events" ON public.events;
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
    division = (SELECT division FROM public.profiles WHERE id = auth.uid())
);

-- 3. Update deed submissions RLS policies
DROP POLICY IF EXISTS "Allow administrators full control over deed submissions" ON public.deed_submissions;
DROP POLICY IF EXISTS "Allow superadmins and admins full control over deed submissions" ON public.deed_submissions;
CREATE POLICY "Allow superadmins and admins full control over deed submissions" ON public.deed_submissions
FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Allow presidents and deed approvers to manage division deed submissions" ON public.deed_submissions;
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
    (SELECT division FROM public.profiles WHERE id = user_id) = (SELECT division FROM public.profiles WHERE id = auth.uid())
);

-- 4. Update admin permissions RLS policies
DROP POLICY IF EXISTS "Allow superadmins and presidents full control over permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "Allow superadmins and admins full control over permissions" ON public.admin_permissions;
CREATE POLICY "Allow superadmins and admins full control over permissions" ON public.admin_permissions
FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Allow presidents to manage their division admin permissions" ON public.admin_permissions;
CREATE POLICY "Allow presidents to manage their division admin permissions" ON public.admin_permissions
FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'president'
    AND
    (SELECT division FROM public.profiles WHERE id = admin_id) = (SELECT division FROM public.profiles WHERE id = auth.uid())
);
