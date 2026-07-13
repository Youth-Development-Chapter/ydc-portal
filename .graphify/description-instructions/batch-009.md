# Node Description Batch 10 of 19

Graphify is running in assistant/skill mode (no API key). You are the host
assistant (Claude Code / Codex / Gemini CLI). Read the prompt below and write
your JSON answer to the answer file.

## Prompt

You are documenting nodes in a knowledge graph.
For each entry below, write ONE concise factual plain-language sentence
describing what it is or does. Use only the provided context.
For a code symbol (kind=code-symbol — a function, class, or constant),
describe what the function/symbol does based on its name, source location
and neighbors — e.g. "Resolves the configured ontology profile from graphify.yaml.".
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "migrations_20260523170000_lms_gamification_rewards_max_earned_coins": "max_earned_coins" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L70 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_module_idx": "module_idx" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L34 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L71 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_public_courses": "public.courses" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L27 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_public_lessons": "public.lessons" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L41 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_public_modules": "public.modules" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L31 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_public_user_progress": "public.user_progress" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L95 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_total_lessons": "total_lessons" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L89 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_total_modules": "total_modules" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L30 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_202606071946_update_streak_logic_has_valid_deed": "has_valid_deed" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L26 | neighbors=[202606071946_update_streak_logic.sql, public.handle_deed_approval()]
- "migrations_202606071946_update_streak_logic_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L76 | neighbors=[202606071946_update_streak_logic.sql, public.handle_deed_approval()]
- "migrations_202606071946_update_streak_logic_public_deed_submissions": "public.deed_submissions" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L24 | neighbors=[202606071946_update_streak_logic.sql, public.handle_deed_approval()]
- "migrations_202606071946_update_streak_logic_public_streaks": "public.streaks" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L16 | neighbors=[202606071946_update_streak_logic.sql, public.handle_deed_approval()]
- "migrations_202606071946_update_streak_logic_user_streak_record": "user_streak_record" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L16 | neighbors=[202606071946_update_streak_logic.sql, public.handle_deed_approval()]
- "migrations_20260608000000_comprehensive_updates_handle_deed_approval": "handle_deed_approval" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L132 | neighbors=[20260608000000_comprehensive_updates.sql, public.trigger_update_streak()]
- "migrations_20260608000000_comprehensive_updates_has_deed": "has_deed" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L93 | neighbors=[20260608000000_comprehensive_updates.sql, public.update_user_streak()]
- "migrations_20260608000000_comprehensive_updates_latest_deed_date": "latest_deed_date" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L72 | neighbors=[20260608000000_comprehensive_updates.sql, public.update_user_streak()]
- "migrations_20260608000000_comprehensive_updates_longest": "longest" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L104 | neighbors=[20260608000000_comprehensive_updates.sql, public.update_user_streak()]
- "migrations_20260608000000_comprehensive_updates_on_deed_change_update_streak": "on_deed_change_update_streak" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L140 | neighbors=[20260608000000_comprehensive_updates.sql, public.deed_submissions]
- "migrations_20260608000000_comprehensive_updates_on_deed_status_coins": "on_deed_status_coins" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L168 | neighbors=[20260608000000_comprehensive_updates.sql, public.deed_submissions]
- "migrations_20260608000000_comprehensive_updates_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L151 | neighbors=[20260608000000_comprehensive_updates.sql, public.handle_deed_coins()]
- "migrations_20260608000000_comprehensive_updates_public_handle_deed_coins": "public.handle_deed_coins()" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L146 | neighbors=[20260608000000_comprehensive_updates.sql, public.coin_transactions]
- "migrations_20260608000000_comprehensive_updates_public_streaks": "public.streaks" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L78 | neighbors=[20260608000000_comprehensive_updates.sql, public.update_user_streak()]
- "migrations_20260608000000_comprehensive_updates_public_trigger_update_streak": "public.trigger_update_streak()" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L119 | neighbors=[20260608000000_comprehensive_updates.sql, handle_deed_approval]
- "migrations_20260608000001_update_leaderboard_rpc": "20260608000001_update_leaderboard_rpc.sql" | kind=code-symbol | source=supabase/migrations/20260608000001_update_leaderboard_rpc.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …, public.get_leaderboard()]
- "migrations_20260608000002_update_leaderboard_rpc_unit_filter": "20260608000002_update_leaderboard_rpc_unit_filter.sql" | kind=code-symbol | source=supabase/migrations/20260608000002_update_leaderboard_rpc_unit_filter.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …, public.get_leaderboard()]
- "migrations_20260608120000_sync_updated_schema_already_awarded": "already_awarded" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L292 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_completed_lessons": "completed_lessons" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L278 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_course_reward": "course_reward" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L221 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_has_deed": "has_deed" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L91 | neighbors=[20260608120000_sync_updated_schema.sql, public.update_user_streak()]
- "migrations_20260608120000_sync_updated_schema_latest_deed_date": "latest_deed_date" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L72 | neighbors=[20260608120000_sync_updated_schema.sql, public.update_user_streak()]
- "migrations_20260608120000_sync_updated_schema_longest": "longest" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L101 | neighbors=[20260608120000_sync_updated_schema.sql, public.update_user_streak()]
- "migrations_20260608120000_sync_updated_schema_max_earned_coins": "max_earned_coins" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L261 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_module_idx": "module_idx" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L229 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_on_deed_change_update_streak": "on_deed_change_update_streak" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L132 | neighbors=[20260608120000_sync_updated_schema.sql, public.deed_submissions]
- "migrations_20260608120000_sync_updated_schema_on_deed_status_coins": "on_deed_status_coins" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L153 | neighbors=[20260608120000_sync_updated_schema.sql, public.deed_submissions]
- "migrations_20260608120000_sync_updated_schema_on_progress_completed": "on_progress_completed" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L306 | neighbors=[20260608120000_sync_updated_schema.sql, public.user_progress]
- "migrations_20260608120000_sync_updated_schema_public_handle_deed_coins": "public.handle_deed_coins()" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L137 | neighbors=[20260608120000_sync_updated_schema.sql, public.coin_transactions]
- "migrations_20260608120000_sync_updated_schema_public_lessons": "public.lessons" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L236 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_public_modules": "public.modules" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L226 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-009.json

Keep each description factual and concise (one sentence). No markdown, no prose
outside the JSON object. It is acceptable to omit a node if context is
insufficient — but include every node you can ground confidently.

Example answer format:
```json
{
  "node_id_1": "Resolves the configured ontology profile from graphify.yaml.",
  "node_id_2": "Colonel James Barclay, an antagonist in The Crooked Man."
}
```
