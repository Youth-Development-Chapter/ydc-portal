-- Performance indexes for common YDC Portal query patterns
-- Run in Supabase SQL Editor.

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id
  ON public.coin_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_reason
  ON public.coin_transactions(user_id, reason);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_completed
  ON public.user_progress(user_id, course_id, completed);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_lesson
  ON public.user_progress(user_id, course_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_deed_submissions_user_local_date
  ON public.deed_submissions(user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_deed_submissions_status_created
  ON public.deed_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id
  ON public.event_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON public.event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_events_date
  ON public.events(date);

CREATE INDEX IF NOT EXISTS idx_streaks_user_id
  ON public.streaks(user_id);

