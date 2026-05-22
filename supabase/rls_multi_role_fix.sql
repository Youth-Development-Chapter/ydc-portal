-- Multi-role RLS compatibility patch
-- Purpose: allow all administrative roles (superadmin, president, tier-3, admin)
-- to pass admin-gated policies where old policies were hard-coded to role='admin'.
-- Run in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- NOTE:
-- Existing projects may already have these policies with different names.
-- This script drops only the known legacy names and then creates normalized ones.
-- ---------------------------------------------------------------------------

-- Courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses"
  ON public.courses
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  );

-- Modules
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules"
  ON public.modules
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  );

-- Lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons"
  ON public.lessons
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  );

-- MCQs
DROP POLICY IF EXISTS "Admins can manage mcqs" ON public.mcqs;
CREATE POLICY "Admins can manage mcqs"
  ON public.mcqs
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  );

-- Events
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events"
  ON public.events
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  );

-- Deed moderation
DROP POLICY IF EXISTS "Admins can update deed submissions" ON public.deed_submissions;
CREATE POLICY "Admins can update deed submissions"
  ON public.deed_submissions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('superadmin', 'president', 'tier-3', 'admin')
    )
  );

