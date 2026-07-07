# Node Description Batch 5 of 19

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
For an entity node (any other kind — e.g. a person, place, event, object),
describe what the entity is and its role, grounded in its type, its
relations (neighbors) and the provided citations/evidence — e.g.
"Lady Carfax, a wealthy heiress who disappears en route to Lausanne.".
Ground entity descriptions in the citations/evidence when present; do not
speculate beyond the context, so a node with no supporting context may be
left out of the reply.
LANGUAGE: each entry has a `lang=` marker giving the language of its source.
Write that entry's description in EXACTLY that language. Do not translate to
a single common language — match each node's source language individually.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@9abbc7f917d95761013b7ad7e5a8447edc90668d": "9abbc7f Add profile onboarding flow and redirects" | kind=Commit | source=git | neighbors=[actions.ts, main, 7522853 Add admin user management & tic…, page.tsx, page.tsx, a227584 Add LMS gamification rewards & …] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@a7f817779fa176616d06fed0f2dfab4fe33d3ba2": "a7f8177 Add email to profiles with migration & triggers" | kind=Commit | source=git | neighbors=[actions.ts, main, d73e533 Add auth UIs, president console…, 20260523140000_add_email_to_profiles.sql, schema.sql, fb18f2e Add division scoping, reward ed…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@d17ee1f6a4859ad32f8eb88f04b67448ed048a5b": "d17ee1f Add fluid top gradient, tweak dashboard headers" | kind=Commit | source=git | neighbors=[8cc013d Add dynamic dashboard flashcard…, main, fb18f2e Add division scoping, reward ed…, loading.tsx, page.tsx, page.tsx] | lang=en
- "leave_route": "route.ts" | kind=code-symbol | source=src/app/api/events/leave/route.ts:L1 | neighbors=[07226c4 Add event posters, archiving & …, 35fbf30 Introduce units and unit-based …, DELETE(), POST(), api.ts, createApiClient()] | lang=en
- "lib_public_supabase": "public-supabase.ts" | kind=code-symbol | source=src/lib/public-supabase.ts:L1 | neighbors=[390bb7c perf: optimize hot queries and …, 90ef3d6 Merge pull request #3 from Yout…, 9e0c0d2 Merge branch 'main' of https://…, lms-data.ts, perf-data.ts, createPublicSupabaseServerClient()] | lang=en
- "log_deed_deedhistoryclient": "DeedHistoryClient.tsx" | kind=code-symbol | source=src/app/dashboard/log-deed/DeedHistoryClient.tsx:L1 | neighbors=[986cd4b Split President console; add ev…, DeedHistoryClient(), Button.tsx, Button, LocalTime.tsx, page.tsx] | lang=en
- "migrations_202606071946_update_streak_logic_public_handle_deed_approval": "public.handle_deed_approval()" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L2 | neighbors=[202606071946_update_streak_logic.sql, has_valid_deed, public.coin_transactions, public.deed_submissions, public.streaks, user_streak_record] | lang=en
- "migrations_20260608000000_comprehensive_updates_public_update_user_streak": "public.update_user_streak()" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L62 | neighbors=[20260608000000_comprehensive_updates.sql, has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_update_user_streak": "public.update_user_streak()" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L63 | neighbors=[20260608120000_sync_updated_schema.sql, has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks] | lang=en
- "migrations_20260611100100_streak_approved_only_public_update_user_streak": "public.update_user_streak()" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L6 | neighbors=[20260611100100_streak_approved_only.sql, has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks] | lang=en
- "migrations_consolidated_migration_public_update_user_streak": "public.update_user_streak()" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L91 | neighbors=[consolidated_migration.sql, has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks] | lang=en
- "supabase_middleware": "middleware.ts" | kind=code-symbol | source=src/utils/supabase/middleware.ts:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 2c7d0ff Add admin LMS UI, admin actions…, 33d76b0 Refactor auth, storage, and adm…, 35fbf30 Introduce units and unit-based …, proxy.ts, updateSession()] | lang=en
- "supabase_schema_public_lessons": "public.lessons" | kind=code-symbol | source=supabase/schema.sql:L404 | neighbors=[schema.sql, public.handle_course_completion(), public.modules, public.mcqs, public.quiz_attempts, public.user_progress] | lang=en
- "supabase_schema_public_update_user_streak": "public.update_user_streak()" | kind=code-symbol | source=supabase/schema.sql:L684 | neighbors=[schema.sql, has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks] | lang=en
- "supabase_schema_public_user_progress": "public.user_progress" | kind=code-symbol | source=supabase/schema.sql:L457 | neighbors=[schema.sql, on_progress_completed, public.handle_course_completion(), public.courses, public.lessons, public.profiles] | lang=en
- "ui_badge": "Badge.tsx" | kind=code-symbol | source=src/components/ui/Badge.tsx:L1 | neighbors=[UserDirectory.tsx, 03e257b feat: complete dashboard, auth …, 80ff45f Add AdminNav, Sonner toasts & U…, page.tsx, Badge(), BadgeProps] | lang=en
- "ui_card_cardheader": "CardHeader()" | kind=code-symbol | source=src/components/ui/Card.tsx:L32 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, page.tsx, SettingsManager.tsx, page.tsx, Card.tsx] | lang=en
- "ui_card_cardtitle": "CardTitle()" | kind=code-symbol | source=src/components/ui/Card.tsx:L40 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, page.tsx, SettingsManager.tsx, page.tsx, Card.tsx] | lang=en
- "ui_switch": "Switch.tsx" | kind=code-symbol | source=src/components/ui/Switch.tsx:L1 | neighbors=[UserDirectory.tsx, 03e257b feat: complete dashboard, auth …, 80ff45f Add AdminNav, Sonner toasts & U…, page.tsx, Switch(), SwitchProps] | lang=en
- "ui_weeklyactivity": "WeeklyActivity.tsx" | kind=code-symbol | source=src/components/ui/WeeklyActivity.tsx:L1 | neighbors=[463284b Enforce 3-per-day deeds and add…, fc9a24e fix(gamification): correct flag…, page.tsx, DayCell, DeedSubmission, WeeklyActivity()] | lang=en
- "admin_actions_checkinticket": "checkInTicket()" | kind=code-symbol | source=src/app/admin/actions.ts:L369 | neighbors=[actions.ts, bulkCheckInAttendees(), EventDetailsClient.tsx, PresidentEventsManager.tsx, PresidentScannerClient.tsx] | lang=en
- "app_page": "page.tsx" | kind=code-symbol | source=src/app/page.tsx:L1 | neighbors=[Home(), 03e257b feat: complete dashboard, auth …, 35fbf30 Introduce units and unit-based …, 56fc596 Redirect root page to /auth/log…, 64f6af9 Initial commit from Create Next…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@11b9da28905e170ca00e61adc08417bc0dce1fb5": "11b9da2 fix: make build deterministic offline and resolve admin rewards type is…" | kind=Commit | source=git | neighbors=[layout.tsx, main, a4961d0 Merge pull request #1 from Yout…, AdminRewardsManager.tsx, 2a2d0ed feat: add leaderboard, announce…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@33ae1c06b11dd362bc363697869d8f982f02d262": "33ae1c0 Require single lesson per module; sync IDs" | kind=Commit | source=git | neighbors=[main, 80ff45f Add AdminNav, Sonner toasts & U…, actions.ts, CourseBuilder.tsx, 468bb32 Add course JSON import flow and…] | lang=it
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@53cdadeed8c11f8146f685bee6fd036fd0757d62": "53cdade Implement server-side logout and update dashboard" | kind=Commit | source=git | neighbors=[actions.ts, main, 44b9a2a Add relative class to book cove…, page.tsx, 9e0c0d2 Merge branch 'main' of https://…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@81653c4da832cecaf15e7bd95e99970a5941600e": "81653c4 remove manual login forms" | kind=Commit | source=git | neighbors=[main, 430dc36 Update OnboardingClient.tsx, LoginClient.tsx, SignupClient.tsx, e41ebed try patch #3] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@835d3b916ab108d76d96692d624bbfdc6450930d": "835d3b9 Add unit roster & event visibility rules" | kind=Commit | source=git | neighbors=[EventsManager.tsx, main, bda94d0 Add inspect scripts; simplify e…, page.tsx, 9be5451 Add unit scoping and eligibilit…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@d1d9dc29ecdd005e5b8395e5a884b6151dab160d": "d1d9dc2 Replace Link with external anchor to YDC home" | kind=Commit | source=git | neighbors=[9ddb8b2 chore: sync package-lock.json t…, main, 33d76b0 Refactor auth, storage, and adm…, page.tsx, page.tsx] | lang=en
- "dashboard_presidentnav": "PresidentNav.tsx" | kind=code-symbol | source=src/components/dashboard/PresidentNav.tsx:L1 | neighbors=[54a4d65 Replace announcements with noti…, 986cd4b Split President console; add ev…, PresidentNav(), PresidentNavProps, layout.tsx] | lang=en
- "lib_env": "env.ts" | kind=code-symbol | source=src/lib/env.ts:L1 | neighbors=[41b5a86 security: fix XSS, API ownershi…, a4961d0 Merge pull request #1 from Yout…, Env, envSchema, validateEnv()] | lang=en
- "lib_perf_data_getusercoinbalance": "getUserCoinBalance()" | kind=code-symbol | source=src/lib/perf-data.ts:L6 | neighbors=[page.tsx, perf-data.ts, actions.ts, page.tsx, page.tsx] | lang=en
- "lms_layout": "layout.tsx" | kind=code-symbol | source=src/app/lms/layout.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 4950c5b Revamp dashboard, wallet & LMS …, d73e533 Add auth UIs, president console…, LmsLayout(), PageHeader.tsx] | lang=en
- "migrations_20260523180000_performance_aggregates_and_indexes": "20260523180000_performance_aggregates_and_indexes.sql" | kind=code-symbol | source=supabase/migrations/20260523180000_performance_aggregates_and_indexes.sql:L1 | neighbors=[390bb7c perf: optimize hot queries and …, 90ef3d6 Merge pull request #3 from Yout…, 9e0c0d2 Merge branch 'main' of https://…, public.get_leaderboard(), public.get_user_coin_balance()] | lang=en
- "migrations_20260608130000_check_user_providers": "20260608130000_check_user_providers.sql" | kind=code-symbol | source=supabase/migrations/20260608130000_check_user_providers.sql:L1 | neighbors=[54a4d65 Replace announcements with noti…, auth.identities, auth.users, providers, public.check_user_providers()] | lang=en
- "migrations_consolidated_migration_public_check_user_providers": "public.check_user_providers()" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L290 | neighbors=[consolidated_migration.sql, auth.identities, auth.users, providers, storage.buckets] | lang=en
- "president_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/president/page.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 986cd4b Split President console; add ev…, 9be5451 Add unit scoping and eligibilit…, d73e533 Add auth UIs, president console…, PresidentConsolePage()] | lang=en
- "supabase_schema_auth_users": "auth.users" | kind=code-symbol | source=supabase/schema.sql:L9 | neighbors=[schema.sql, on_auth_user_email_updated, public.check_user_providers(), public.profiles, public.set_profile_email()] | lang=en
- "supabase_schema_public_courses": "public.courses" | kind=code-symbol | source=supabase/schema.sql:L354 | neighbors=[schema.sql, public.handle_course_completion(), public.modules, public.user_course_settings, public.user_progress] | lang=en
- "supabase_schema_public_deed_submissions": "public.deed_submissions" | kind=code-symbol | source=supabase/schema.sql:L228 | neighbors=[schema.sql, on_deed_change_update_streak, on_deed_status_coins, public.profiles, public.update_user_streak()] | lang=en
- "supabase_schema_public_event_registrations": "public.event_registrations" | kind=code-symbol | source=supabase/schema.sql:L144 | neighbors=[schema.sql, on_registration_enforce_capacity, public.enforce_event_capacity(), public.events, public.profiles] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-004.json

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
