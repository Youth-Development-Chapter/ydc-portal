# Node Description Batch 11 of 19

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

- "migrations_20260608120000_sync_updated_schema_public_profiles": "public.profiles" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L183 | neighbors=[20260608120000_sync_updated_schema.sql, public.user_course_settings]
- "migrations_20260608120000_sync_updated_schema_public_streaks": "public.streaks" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L77 | neighbors=[20260608120000_sync_updated_schema.sql, public.update_user_streak()]
- "migrations_20260608120000_sync_updated_schema_total_lessons": "total_lessons" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L273 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608120000_sync_updated_schema_total_modules": "total_modules" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L225 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion()]
- "migrations_20260608130000_check_user_providers_auth_identities": "auth.identities" | kind=code-symbol | source=supabase/migrations/20260608130000_check_user_providers.sql:L8 | neighbors=[20260608130000_check_user_providers.sql, public.check_user_providers()]
- "migrations_20260608130000_check_user_providers_auth_users": "auth.users" | kind=code-symbol | source=supabase/migrations/20260608130000_check_user_providers.sql:L9 | neighbors=[20260608130000_check_user_providers.sql, public.check_user_providers()]
- "migrations_20260608130000_check_user_providers_providers": "providers" | kind=code-symbol | source=supabase/migrations/20260608130000_check_user_providers.sql:L7 | neighbors=[20260608130000_check_user_providers.sql, public.check_user_providers()]
- "migrations_20260611100000_fix_flag_double_deduction_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/20260611100000_fix_flag_double_deduction.sql:L10 | neighbors=[20260611100000_fix_flag_double_deductio…, public.handle_deed_coins()]
- "migrations_20260611100000_fix_flag_double_deduction_public_handle_deed_coins": "public.handle_deed_coins()" | kind=code-symbol | source=supabase/migrations/20260611100000_fix_flag_double_deduction.sql:L6 | neighbors=[20260611100000_fix_flag_double_deductio…, public.coin_transactions]
- "migrations_20260611100100_streak_approved_only_has_deed": "has_deed" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L34 | neighbors=[20260611100100_streak_approved_only.sql, public.update_user_streak()]
- "migrations_20260611100100_streak_approved_only_latest_deed_date": "latest_deed_date" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L15 | neighbors=[20260611100100_streak_approved_only.sql, public.update_user_streak()]
- "migrations_20260611100100_streak_approved_only_longest": "longest" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L44 | neighbors=[20260611100100_streak_approved_only.sql, public.update_user_streak()]
- "migrations_20260611100100_streak_approved_only_public_deed_submissions": "public.deed_submissions" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L16 | neighbors=[20260611100100_streak_approved_only.sql, public.update_user_streak()]
- "migrations_20260611100100_streak_approved_only_public_streaks": "public.streaks" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L20 | neighbors=[20260611100100_streak_approved_only.sql, public.update_user_streak()]
- "migrations_20260611100200_event_capacity_trigger_current_count": "current_count" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L33 | neighbors=[20260611100200_event_capacity_trigger.s…, public.enforce_event_capacity()]
- "migrations_20260611100200_event_capacity_trigger_event_capacity": "event_capacity" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L14 | neighbors=[20260611100200_event_capacity_trigger.s…, public.enforce_event_capacity()]
- "migrations_20260611100200_event_capacity_trigger_is_staff": "is_staff" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L27 | neighbors=[20260611100200_event_capacity_trigger.s…, public.enforce_event_capacity()]
- "migrations_20260611100200_event_capacity_trigger_on_registration_enforce_capacity": "on_registration_enforce_capacity" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L46 | neighbors=[20260611100200_event_capacity_trigger.s…, public.event_registrations]
- "migrations_20260611100200_event_capacity_trigger_public_events": "public.events" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L15 | neighbors=[20260611100200_event_capacity_trigger.s…, public.enforce_event_capacity()]
- "migrations_20260611100200_event_capacity_trigger_public_profiles": "public.profiles" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L24 | neighbors=[20260611100200_event_capacity_trigger.s…, public.enforce_event_capacity()]
- "migrations_consolidated_migration_auth_identities": "auth.identities" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L296 | neighbors=[consolidated_migration.sql, public.check_user_providers()]
- "migrations_consolidated_migration_auth_users": "auth.users" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L297 | neighbors=[consolidated_migration.sql, public.check_user_providers()]
- "migrations_consolidated_migration_has_deed": "has_deed" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L119 | neighbors=[consolidated_migration.sql, public.update_user_streak()]
- "migrations_consolidated_migration_latest_deed_date": "latest_deed_date" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L100 | neighbors=[consolidated_migration.sql, public.update_user_streak()]
- "migrations_consolidated_migration_longest": "longest" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L129 | neighbors=[consolidated_migration.sql, public.update_user_streak()]
- "migrations_consolidated_migration_on_deed_change_update_streak": "on_deed_change_update_streak" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L162 | neighbors=[consolidated_migration.sql, public.deed_submissions]
- "migrations_consolidated_migration_on_deed_status_coins": "on_deed_status_coins" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L185 | neighbors=[consolidated_migration.sql, public.deed_submissions]
- "migrations_consolidated_migration_providers": "providers" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L295 | neighbors=[consolidated_migration.sql, public.check_user_providers()]
- "migrations_consolidated_migration_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L172 | neighbors=[consolidated_migration.sql, public.handle_deed_coins()]
- "migrations_consolidated_migration_public_handle_deed_coins": "public.handle_deed_coins()" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L168 | neighbors=[consolidated_migration.sql, public.coin_transactions]
- "migrations_consolidated_migration_public_streaks": "public.streaks" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L105 | neighbors=[consolidated_migration.sql, public.update_user_streak()]
- "migrations_consolidated_migration_storage_buckets": "storage.buckets" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L308 | neighbors=[consolidated_migration.sql, public.check_user_providers()]
- "postcss_config": "postcss.config.mjs" | kind=code-symbol | source=postcss.config.mjs:L1 | neighbors=[64f6af9 Initial commit from Create Next…, config]
- "rewards_actions_createreward": "createReward()" | kind=code-symbol | source=src/app/dashboard/rewards/actions.ts:L98 | neighbors=[actions.ts, AdminRewardsManager.tsx]
- "rewards_actions_fulfilredemption": "fulfilRedemption()" | kind=code-symbol | source=src/app/dashboard/rewards/actions.ts:L159 | neighbors=[actions.ts, AdminRewardsManager.tsx]
- "rewards_actions_redeemreward": "redeemReward()" | kind=code-symbol | source=src/app/dashboard/rewards/actions.ts:L9 | neighbors=[actions.ts, RewardsClient.tsx]
- "rewards_actions_rejectredemption": "rejectRedemption()" | kind=code-symbol | source=src/app/dashboard/rewards/actions.ts:L179 | neighbors=[actions.ts, AdminRewardsManager.tsx]
- "rewards_actions_togglerewardactive": "toggleRewardActive()" | kind=code-symbol | source=src/app/dashboard/rewards/actions.ts:L138 | neighbors=[actions.ts, AdminRewardsManager.tsx]
- "settings_actions_updateprofile": "updateProfile()" | kind=code-symbol | source=src/app/dashboard/settings/actions.ts:L22 | neighbors=[actions.ts, SettingsForm.tsx]
- "supabase_middleware_updatesession": "updateSession()" | kind=code-symbol | source=src/utils/supabase/middleware.ts:L4 | neighbors=[proxy.ts, middleware.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-010.json

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
