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
