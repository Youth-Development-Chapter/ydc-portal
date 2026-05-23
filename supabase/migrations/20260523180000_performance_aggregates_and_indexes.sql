-- Performance: server-side aggregations and query-aligned indexes

-- ---------------------------------------------------------------------------
-- 1) Aggregation RPC: user coin balance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_coin_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(ct.amount), 0)::INTEGER
  FROM public.coin_transactions ct
  WHERE ct.user_id = p_user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_user_coin_balance(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) Aggregation RPC: leaderboard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  division TEXT,
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
    COALESCE(p.division, 'Unknown') AS division,
    SUM(ct.amount)::BIGINT AS coins
  FROM public.coin_transactions ct
  INNER JOIN public.profiles p ON p.id = ct.user_id
  GROUP BY p.id, p.full_name, p.division
  HAVING SUM(ct.amount) > 0
  ORDER BY SUM(ct.amount) DESC
  LIMIT GREATEST(COALESCE(p_limit, 50), 1)
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Additional indexes for hot filters
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created_at
  ON public.coin_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_division_date
  ON public.events (division, date);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_attended_created
  ON public.event_registrations (user_id, attended, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deed_submissions_user_status_verified
  ON public.deed_submissions (user_id, status, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_lang_completed
  ON public.user_progress (user_id, course_id, language, completed);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_lang_diff_completed
  ON public.user_progress (user_id, course_id, language, difficulty, completed);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON public.announcements (created_at DESC);
