-- Allow all authenticated users to read coin_transactions for the public leaderboard.
-- Coin amounts are not sensitive in the context of a community leaderboard.
-- Each user's own transactions are already visible to them via user-scoped policies.

-- Drop any conflicting select policy on coin_transactions first
DROP POLICY IF EXISTS "Users can read own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Allow authenticated read all coin_transactions" ON coin_transactions;

-- Re-create user's own read policy (keep it scoped for write/security clarity)
CREATE POLICY "Users can read own coin transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow all authenticated users to read all transactions (needed for leaderboard aggregation)
CREATE POLICY "Allow authenticated read all coin_transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (true);
