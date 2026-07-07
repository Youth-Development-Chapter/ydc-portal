# Node Description Batch 17 of 19

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

- "migrations_20260608120000_sync_updated_schema_public_get_user_coin_balance": "public.get_user_coin_balance()" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L326 | neighbors=[20260608120000_sync_updated_schema.sql]
- "migrations_20260608120000_sync_updated_schema_public_trigger_update_streak": "public.trigger_update_streak()" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L116 | neighbors=[20260608120000_sync_updated_schema.sql]
- "migrations_20260608120000_sync_updated_schema_public_units": "public.units" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L8 | neighbors=[20260608120000_sync_updated_schema.sql]
- "migrations_20260608140000_add_event_posters": "20260608140000_add_event_posters.sql" | kind=code-symbol | source=supabase/migrations/20260608140000_add_event_posters.sql:L1 | neighbors=[07226c4 Add event posters, archiving & …]
- "migrations_20260608150500_add_event_archiving": "20260608150500_add_event_archiving.sql" | kind=code-symbol | source=supabase/migrations/20260608150500_add_event_archiving.sql:L1 | neighbors=[07226c4 Add event posters, archiving & …]
- "migrations_20260707221500_split_event_time": "20260707221500_split_event_time.sql" | kind=code-symbol | source=supabase/migrations/20260707221500_split_event_time.sql:L1 | neighbors=[0aff7f1 add graphify]
- "migrations_consolidated_migration_public_get_leaderboard": "public.get_leaderboard()" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L191 | neighbors=[consolidated_migration.sql]
- "migrations_consolidated_migration_public_trigger_update_streak": "public.trigger_update_streak()" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L143 | neighbors=[consolidated_migration.sql]
- "migrations_consolidated_migration_public_units": "public.units" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L5 | neighbors=[consolidated_migration.sql]
- "next_config_nextconfig": "nextConfig" | kind=code-symbol | source=next.config.ts:L47 | neighbors=[next.config.ts]
- "next_config_securityheaders": "securityHeaders" | kind=code-symbol | source=next.config.ts:L3 | neighbors=[next.config.ts]
- "next_config_serviceworkerheaders": "serviceWorkerHeaders" | kind=code-symbol | source=next.config.ts:L42 | neighbors=[next.config.ts]
- "notifications_notificationsmanager_announcement": "Announcement" | kind=code-symbol | source=src/app/admin/notifications/NotificationsManager.tsx:L11 | neighbors=[NotificationsManager.tsx]
- "notifications_notificationsmanager_notificationsmanager": "NotificationsManager()" | kind=code-symbol | source=src/app/admin/notifications/NotificationsManager.tsx:L19 | neighbors=[NotificationsManager.tsx]
- "notifications_page_activealert": "ActiveAlert" | kind=code-symbol | source=src/app/dashboard/notifications/page.tsx:L25 | neighbors=[page.tsx]
- "notifications_page_adminnotificationspage": "AdminNotificationsPage()" | kind=code-symbol | source=src/app/admin/notifications/page.tsx:L9 | neighbors=[page.tsx]
- "notifications_page_notificationitem": "NotificationItem" | kind=code-symbol | source=src/app/dashboard/notifications/page.tsx:L14 | neighbors=[page.tsx]
- "notifications_page_notificationspage": "NotificationsPage()" | kind=code-symbol | source=src/app/dashboard/notifications/page.tsx:L35 | neighbors=[page.tsx]
- "notifications_page_presidentnotificationspage": "PresidentNotificationsPage()" | kind=code-symbol | source=src/app/dashboard/president/notifications/page.tsx:L9 | neighbors=[page.tsx]
- "onboarding_onboardingclient_formcontent": "FormContent()" | kind=code-symbol | source=src/app/onboarding/OnboardingClient.tsx:L21 | neighbors=[OnboardingClient.tsx]
- "onboarding_onboardingclient_onboardingclient": "OnboardingClient()" | kind=code-symbol | source=src/app/onboarding/OnboardingClient.tsx:L219 | neighbors=[OnboardingClient.tsx]
- "onboarding_onboardingclient_unit": "Unit" | kind=code-symbol | source=src/app/onboarding/OnboardingClient.tsx:L15 | neighbors=[OnboardingClient.tsx]
- "onboarding_page_onboardingpage": "OnboardingPage()" | kind=code-symbol | source=src/app/onboarding/page.tsx:L8 | neighbors=[page.tsx]
- "postcss_config_config": "config" | kind=code-symbol | source=postcss.config.mjs:L1 | neighbors=[postcss.config.mjs]
- "president_layout_presidentlayout": "PresidentLayout()" | kind=code-symbol | source=src/app/dashboard/president/layout.tsx:L11 | neighbors=[layout.tsx]
- "president_page_presidentconsolepage": "PresidentConsolePage()" | kind=code-symbol | source=src/app/dashboard/president/page.tsx:L5 | neighbors=[page.tsx]
- "progress_route_post": "POST()" | kind=code-symbol | source=src/app/api/progress/route.ts:L6 | neighbors=[route.ts]
- "redeem_route_post": "POST()" | kind=code-symbol | source=src/app/api/rewards/redeem/route.ts:L7 | neighbors=[route.ts]
- "reset_password_page_resetpasswordpage": "ResetPasswordPage()" | kind=code-symbol | source=src/app/auth/reset-password/page.tsx:L9 | neighbors=[page.tsx]
- "rewards_adminrewardsmanager_adminrewardsmanager": "AdminRewardsManager()" | kind=code-symbol | source=src/app/admin/rewards/AdminRewardsManager.tsx:L31 | neighbors=[AdminRewardsManager.tsx]
- "rewards_adminrewardsmanager_pendingredemption": "PendingRedemption" | kind=code-symbol | source=src/app/admin/rewards/AdminRewardsManager.tsx:L21 | neighbors=[AdminRewardsManager.tsx]
- "rewards_adminrewardsmanager_reward": "Reward" | kind=code-symbol | source=src/app/admin/rewards/AdminRewardsManager.tsx:L8 | neighbors=[AdminRewardsManager.tsx]
- "rewards_page_adminrewardspage": "AdminRewardsPage()" | kind=code-symbol | source=src/app/admin/rewards/page.tsx:L9 | neighbors=[page.tsx]
- "rewards_page_rewardspage": "RewardsPage()" | kind=code-symbol | source=src/app/dashboard/rewards/page.tsx:L13 | neighbors=[page.tsx]
- "rewards_rewardsclient_reward": "Reward" | kind=code-symbol | source=src/app/dashboard/rewards/RewardsClient.tsx:L7 | neighbors=[RewardsClient.tsx]
- "rewards_rewardsclient_rewardsclient": "RewardsClient()" | kind=code-symbol | source=src/app/dashboard/rewards/RewardsClient.tsx:L16 | neighbors=[RewardsClient.tsx]
- "scanner_page_presidentscannerpage": "PresidentScannerPage()" | kind=code-symbol | source=src/app/dashboard/president/scanner/page.tsx:L9 | neighbors=[page.tsx]
- "seed_route_get": "GET()" | kind=code-symbol | source=src/app/api/lms/seed/route.ts:L7 | neighbors=[route.ts]
- "settings_actions_allowed_image_types": "ALLOWED_IMAGE_TYPES" | kind=code-symbol | source=src/app/dashboard/settings/actions.ts:L8 | neighbors=[actions.ts]
- "settings_actions_updateprofileresult": "UpdateProfileResult" | kind=code-symbol | source=src/app/dashboard/settings/actions.ts:L17 | neighbors=[actions.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-016.json

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
