# Node Description Batch 7 of 19

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

- "submit_route": "route.ts" | kind=code-symbol | source=src/app/api/lms/quiz/submit/route.ts:L1 | neighbors=[3f188c3 Add mobile API routes and supab…, POST(), api.ts, createApiClient()] | lang=en
- "supabase_schema_public_check_user_providers": "public.check_user_providers()" | kind=code-symbol | source=supabase/schema.sql:L1055 | neighbors=[schema.sql, auth.identities, auth.users, providers] | lang=en
- "supabase_schema_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/schema.sql:L290 | neighbors=[schema.sql, public.profiles, public.handle_course_completion(), public.handle_deed_coins()] | lang=en
- "supabase_schema_public_modules": "public.modules" | kind=code-symbol | source=supabase/schema.sql:L380 | neighbors=[schema.sql, public.handle_course_completion(), public.lessons, public.courses] | lang=en
- "ui_select_select": "Select" | kind=code-symbol | source=src/components/ui/Select.tsx:L13 | neighbors=[UserDirectory.tsx, OnboardingClient.tsx, page.tsx, Select.tsx] | lang=en
- "admin_actions_approvedeedsubmission": "approveDeedSubmission()" | kind=code-symbol | source=src/app/admin/actions.ts:L13 | neighbors=[actions.ts, ApprovalsQueue.tsx, PresidentApprovalsManager.tsx] | lang=en
- "admin_actions_bulkcheckinattendees": "bulkCheckInAttendees()" | kind=code-symbol | source=src/app/admin/actions.ts:L1877 | neighbors=[actions.ts, checkInTicket(), EventDetailsClient.tsx] | lang=en
- "admin_actions_createevent": "createEvent()" | kind=code-symbol | source=src/app/admin/actions.ts:L573 | neighbors=[actions.ts, EventsManager.tsx, PresidentEventsManager.tsx] | lang=en
- "admin_actions_rejectdeedsubmission": "rejectDeedSubmission()" | kind=code-symbol | source=src/app/admin/actions.ts:L83 | neighbors=[actions.ts, ApprovalsQueue.tsx, PresidentApprovalsManager.tsx] | lang=en
- "admin_actions_updatecoursereward": "updateCourseReward()" | kind=code-symbol | source=src/app/admin/actions.ts:L168 | neighbors=[actions.ts, SettingsManager.tsx, CoursesAdminClient.tsx] | lang=en
- "admin_actions_updateevent": "updateEvent()" | kind=code-symbol | source=src/app/admin/actions.ts:L799 | neighbors=[actions.ts, EventDetailsClient.tsx, PresidentEventsManager.tsx] | lang=en
- "admin_error": "error.tsx" | kind=code-symbol | source=src/app/admin/error.tsx:L1 | neighbors=[AdminError(), a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…] | lang=en
- "admin_loading": "loading.tsx" | kind=code-symbol | source=src/app/admin/loading.tsx:L1 | neighbors=[AdminLoading(), a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…] | lang=en
- "agents_md": "Developer & Agent Guide" | kind=entity | source=AGENTS.md | neighbors=[Claude Configuration Reference, Course JSON Import Schema Guide, Mobile App Integration Guide] | lang=en
- "app_actions_claimticket": "claimTicket()" | kind=code-symbol | source=src/app/actions.ts:L22 | neighbors=[actions.ts, DashboardFlashcards.tsx, EventsClient.tsx] | lang=en
- "app_error": "error.tsx" | kind=code-symbol | source=src/app/error.tsx:L1 | neighbors=[RootError(), 2a2d0ed feat: add leaderboard, announce…, a4961d0 Merge pull request #1 from Yout…] | lang=en
- "app_global_error": "global-error.tsx" | kind=code-symbol | source=src/app/global-error.tsx:L1 | neighbors=[GlobalError(), a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@50d072a7e5ad1639e25b0c40244129c4a29526fa": "50d072a chore: start performance optimization plan" | kind=Commit | source=git | neighbors=[4950c5b Revamp dashboard, wallet & LMS …, main, 390bb7c perf: optimize hot queries and …] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@5eaef275e2e6d3b0b8f0fb6477d46d887bfd5e88": "5eaef27 Replace html5-qrcode with jsqr in lockfile" | kind=Commit | source=git | neighbors=[35fbf30 Introduce units and unit-based …, main, 9be5451 Add unit scoping and eligibilit…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@9ddb8b2c1d59eac94b296a9f076fb3d28698663b": "9ddb8b2 chore: sync package-lock.json to include sonner" | kind=Commit | source=git | neighbors=[44216ba Rename admin nav item to 'Strea…, main, d1d9dc2 Replace Link with external anch…] | lang=en
- "courses_actions_uploadcoursecover": "uploadCourseCover()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L392 | neighbors=[actions.ts, requireCourseAdmin(), CourseBuilder.tsx] | lang=en
- "courses_loading": "loading.tsx" | kind=code-symbol | source=src/app/lms/courses/loading.tsx:L1 | neighbors=[a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…, LmsCoursesLoading()] | lang=en
- "dashboard_error": "error.tsx" | kind=code-symbol | source=src/app/dashboard/error.tsx:L1 | neighbors=[a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…, DashboardError()] | lang=en
- "dashboard_loading": "loading.tsx" | kind=code-symbol | source=src/app/dashboard/loading.tsx:L1 | neighbors=[d17ee1f Add fluid top gradient, tweak d…, f5b2296 Add social OAuth, deed local_da…, DashboardLoading()] | lang=en
- "lib_lms_data_getlessonforlearner": "getLessonForLearner()" | kind=code-symbol | source=src/lib/lms-data.ts:L180 | neighbors=[page.tsx, lms-data.ts, getLessonById()] | lang=en
- "lib_perf_data_getrecentannouncements": "getRecentAnnouncements()" | kind=code-symbol | source=src/lib/perf-data.ts:L45 | neighbors=[page.tsx, perf-data.ts, page.tsx] | lang=en
- "lib_perf_data_getupcomingeventsforunitcached": "getUpcomingEventsForUnitCached()" | kind=code-symbol | source=src/lib/perf-data.ts:L117 | neighbors=[page.tsx, perf-data.ts, page.tsx] | lang=en
- "lib_public_supabase_createpublicsupabaseserverclient": "createPublicSupabaseServerClient()" | kind=code-symbol | source=src/lib/public-supabase.ts:L3 | neighbors=[lms-data.ts, perf-data.ts, public-supabase.ts] | lang=en
- "lms_error": "error.tsx" | kind=code-symbol | source=src/app/lms/error.tsx:L1 | neighbors=[a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…, LmsError()] | lang=en
- "migrations_20260523000000_bilingual_and_levels_public_courses": "public.courses" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L24 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion(), public.user_course_settings] | lang=en
- "migrations_20260523000000_bilingual_and_levels_public_user_course_settings": "public.user_course_settings" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L22 | neighbors=[20260523000000_bilingual_and_levels.sql, public.courses, public.profiles] | lang=en
- "migrations_20260523140000_add_email_to_profiles_auth_users": "auth.users" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L42 | neighbors=[20260523140000_add_email_to_profiles.sql, on_auth_user_email_updated, public.set_profile_email()] | lang=en
- "migrations_20260523140000_add_email_to_profiles_public_profiles": "public.profiles" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L25 | neighbors=[20260523140000_add_email_to_profiles.sql, on_profile_created, public.sync_profile_email()] | lang=en
- "migrations_20260523140000_add_email_to_profiles_public_set_profile_email": "public.set_profile_email()" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L13 | neighbors=[20260523140000_add_email_to_profiles.sql, auth.users, NEW.email] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L141 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion(), public.handle_deed_coins()] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_courses": "public.courses" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L184 | neighbors=[20260608120000_sync_updated_schema.sql, public.handle_course_completion(), public.user_course_settings] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_user_course_settings": "public.user_course_settings" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L182 | neighbors=[20260608120000_sync_updated_schema.sql, public.courses, public.profiles] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_user_progress": "public.user_progress" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L307 | neighbors=[20260608120000_sync_updated_schema.sql, on_progress_completed, public.handle_course_completion()] | lang=en
- "migrations_20260611100000_fix_flag_double_deduction": "20260611100000_fix_flag_double_deduction.sql" | kind=code-symbol | source=supabase/migrations/20260611100000_fix_flag_double_deduction.sql:L1 | neighbors=[fc9a24e fix(gamification): correct flag…, public.coin_transactions, public.handle_deed_coins()] | lang=en
- "migrations_20260611100200_event_capacity_trigger_public_event_registrations": "public.event_registrations" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L47 | neighbors=[20260611100200_event_capacity_trigger.s…, on_registration_enforce_capacity, public.enforce_event_capacity()] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-006.json

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
