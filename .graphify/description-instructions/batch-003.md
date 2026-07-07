# Node Description Batch 4 of 19

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

- "migrations_20260611100200_event_capacity_trigger": "20260611100200_event_capacity_trigger.sql" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L1 | neighbors=[fc9a24e fix(gamification): correct flag…, current_count, event_capacity, is_staff, on_registration_enforce_capacity, public.enforce_event_capacity()] | lang=en
- "reset_password_page": "page.tsx" | kind=code-symbol | source=src/app/auth/reset-password/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 60d2f3f Use local state for auth forms;…, actions.ts, updatePassword(), ResetPasswordPage(), Button.tsx] | lang=en
- "claim_route": "route.ts" | kind=code-symbol | source=src/app/api/events/ticket/claim/route.ts:L1 | neighbors=[POST(), criteria.ts, evaluateCriteria(), api.ts, createApiClient(), 3f188c3 Add mobile API routes and supab…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@2a2d0eda7ba049cd497cc4b3ca9f8cb414041740": "2a2d0ed feat: add leaderboard, announcements, rewards, sql scripts, and next16 …" | kind=Commit | source=git | neighbors=[layout.tsx, error.tsx, main, 11b9da2 fix: make build deterministic o…, page.tsx, actions.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@463284beca95655c95e8cfb527c5c6ef823a0282": "463284b Enforce 3-per-day deeds and add UI components" | kind=Commit | source=git | neighbors=[actions.ts, main, c0dc632 Add Urdu localization to lesson…, LogDeedForm.tsx, page.tsx, LocalTime.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@468bb320d6a4e10397fb89bbe038879ee4840166": "468bb32 Add course JSON import flow and auth error page" | kind=Commit | source=git | neighbors=[page.tsx, main, 33ae1c0 Require single lesson per modul…, actions.ts, CoursesAdminClient.tsx, InteractiveLesson.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@f9b6a15abfd47fc47dc8c6c0053d052092d7fe01": "f9b6a15 Improve CSP, error handling, and nav icon type" | kind=Commit | source=git | neighbors=[60d2f3f Use local state for auth forms;…, AdminNav.tsx, page.tsx, main, c68f0b0 Allow db.ydc.org.pk in CSP and …, page.tsx] | lang=en
- "courseid_route": "route.ts" | kind=code-symbol | source=src/app/api/progress/[userId]/[courseId]/route.ts:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 3f188c3 Add mobile API routes and supab…, 41b5a86 security: fix XSS, API ownershi…, a4961d0 Merge pull request #1 from Yout…, f5b2296 Add social OAuth, deed local_da…, GET()] | lang=en
- "courses_coursesclient": "CoursesClient.tsx" | kind=code-symbol | source=src/app/lms/courses/CoursesClient.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 8cc013d Add dynamic dashboard flashcard…, e714bb0 Improve QR scanner, realtime ch…, f5b2296 Add social OAuth, deed local_da…, Course, CoursesClient()] | lang=en
- "id_route": "route.ts" | kind=code-symbol | source=src/app/api/lessons/[id]/route.ts:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 3f188c3 Add mobile API routes and supab…, 670c0c3 Add server lms-data and refacto…, 8eb7aa8 Add course rewards and server-s…, f5b2296 Add social OAuth, deed local_da…, GET()] | lang=en
- "lib_criteria_evaluatecriteria": "evaluateCriteria()" | kind=code-symbol | source=src/lib/criteria.ts:L17 | neighbors=[actions.ts, actions.ts, route.ts, route.ts, criteria.ts, route.ts] | lang=en
- "migrations_20260523140000_add_email_to_profiles": "20260523140000_add_email_to_profiles.sql" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L1 | neighbors=[a7f8177 Add email to profiles with migr…, auth.users, NEW.email, on_auth_user_email_updated, on_profile_created, public.profiles] | lang=en
- "notifications_notificationsmanager": "NotificationsManager.tsx" | kind=code-symbol | source=src/app/admin/notifications/NotificationsManager.tsx:L1 | neighbors=[54a4d65 Replace announcements with noti…, actions.ts, createAnnouncement(), deleteAnnouncement(), togglePinAnnouncement(), Announcement] | lang=en
- "president_layout": "layout.tsx" | kind=code-symbol | source=src/app/dashboard/president/layout.tsx:L1 | neighbors=[986cd4b Split President console; add ev…, PresidentNav.tsx, admin.ts, getAdminContext(), PresidentLayout(), server.ts] | lang=en
- "progress_route": "route.ts" | kind=code-symbol | source=src/app/api/progress/route.ts:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 3f188c3 Add mobile API routes and supab…, 41b5a86 security: fix XSS, API ownershi…, a4961d0 Merge pull request #1 from Yout…, f5b2296 Add social OAuth, deed local_da…, POST()] | lang=en
- "settings_actions": "actions.ts" | kind=code-symbol | source=src/app/dashboard/settings/actions.ts:L1 | neighbors=[35fbf30 Introduce units and unit-based …, f5b2296 Add social OAuth, deed local_da…, ALLOWED_IMAGE_TYPES, updateProfile(), UpdateProfileResult, server.ts] | lang=en
- "src_proxy": "proxy.ts" | kind=code-symbol | source=src/proxy.ts:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 390bb7c perf: optimize hot queries and …, 90ef3d6 Merge pull request #3 from Yout…, 9e0c0d2 Merge branch 'main' of https://…, config, proxy()] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@37e3b0af010cd4a661e170d63154cc65ba69053a": "37e3b0a Improve auth error UI, callback origin, policies" | kind=Commit | source=git | neighbors=[33d76b0 Refactor auth, storage, and adm…, page.tsx, main, route.ts, 60d2f3f Use local state for auth forms;…, schema.sql] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@437a50b323f49a149704114a682734fe8cdb0028": "437a50b Changes before error encountered" | kind=Commit | source=git | neighbors=[main, 2a2d0ed feat: add leaderboard, announce…, page.tsx, actions.ts, page.tsx, RewardsClient.tsx] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@64f6af94b14c8c7066fe1baedc139c74875cc29a": "64f6af9 Initial commit from Create Next App" | kind=Commit | source=git | neighbors=[layout.tsx, page.tsx, main, 03e257b feat: complete dashboard, auth …, eslint.config.mjs, next.config.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@d600a2b93b9b5a69c00356130ca8a6b4d8c05564": "d600a2b Add change-language UI and YouTube frame-src" | kind=Commit | source=git | neighbors=[main, a227584 Add LMS gamification rewards & …, page.tsx, ChangeLanguageButton.tsx, LanguageSelectModal.tsx, next.config.ts] | lang=en
- "components_checkinlistener": "CheckInListener.tsx" | kind=code-symbol | source=src/components/CheckInListener.tsx:L1 | neighbors=[layout.tsx, 0aff7f1 add graphify, c06ef93 fixed check in logic, CheckInListener(), CheckInPayload, client.ts] | lang=en
- "courses_route": "route.ts" | kind=code-symbol | source=src/app/api/courses/route.ts:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 3f188c3 Add mobile API routes and supab…, 670c0c3 Add server lms-data and refacto…, f5b2296 Add social OAuth, deed local_da…, GET(), api.ts] | lang=en
- "dashboard_presidentnotificationsclient": "PresidentNotificationsClient.tsx" | kind=code-symbol | source=src/components/dashboard/PresidentNotificationsClient.tsx:L1 | neighbors=[54a4d65 Replace announcements with noti…, PresidentNotificationsClient(), actions.ts, createAnnouncement(), deleteAnnouncement(), togglePinAnnouncement()] | lang=en
- "dashboard_qrscannermodal": "QRScannerModal.tsx" | kind=code-symbol | source=src/components/dashboard/QRScannerModal.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 4950c5b Revamp dashboard, wallet & LMS …, a227584 Add LMS gamification rewards & …, d73e533 Add auth UIs, president console…, PresidentEventsManager.tsx, QRScannerModal()] | lang=en
- "lib_admin_hasadminpermission": "hasAdminPermission()" | kind=code-symbol | source=src/lib/admin.ts:L27 | neighbors=[actions.ts, actions.ts, page.tsx, admin.ts, actions.ts, actions.ts] | lang=en
- "lms_changelanguagebutton": "ChangeLanguageButton.tsx" | kind=code-symbol | source=src/components/lms/ChangeLanguageButton.tsx:L1 | neighbors=[a227584 Add LMS gamification rewards & …, d600a2b Add change-language UI and YouT…, e714bb0 Improve QR scanner, realtime ch…, page.tsx, ChangeLanguageButton(), ChangeLanguageButtonProps] | lang=en
- "migrations_202606071946_update_streak_logic": "202606071946_update_streak_logic.sql" | kind=code-symbol | source=supabase/migrations/202606071946_update_streak_logic.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …, has_valid_deed, public.coin_transactions, public.deed_submissions, public.handle_deed_approval(), public.streaks] | lang=en
- "migrations_20260611100100_streak_approved_only": "20260611100100_streak_approved_only.sql" | kind=code-symbol | source=supabase/migrations/20260611100100_streak_approved_only.sql:L1 | neighbors=[fc9a24e fix(gamification): correct flag…, has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks] | lang=en
- "migrations_20260611100200_event_capacity_trigger_public_enforce_event_capacity": "public.enforce_event_capacity()" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L7 | neighbors=[20260611100200_event_capacity_trigger.s…, current_count, event_capacity, is_staff, public.event_registrations, public.events] | lang=en
- "onboarding_page": "page.tsx" | kind=code-symbol | source=src/app/onboarding/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 35fbf30 Introduce units and unit-based …, 9abbc7f Add profile onboarding flow and…, OnboardingClient.tsx, OnboardingPage(), server.ts] | lang=en
- "redeem_route": "route.ts" | kind=code-symbol | source=src/app/api/rewards/redeem/route.ts:L1 | neighbors=[3f188c3 Add mobile API routes and supab…, 9be5451 Add unit scoping and eligibilit…, criteria.ts, evaluateCriteria(), POST(), api.ts] | lang=en
- "rewards_rewardsclient": "RewardsClient.tsx" | kind=code-symbol | source=src/app/dashboard/rewards/RewardsClient.tsx:L1 | neighbors=[437a50b Changes before error encountered, a4961d0 Merge pull request #1 from Yout…, page.tsx, actions.ts, redeemReward(), Reward] | lang=en
- "seed_route": "route.ts" | kind=code-symbol | source=src/app/api/lms/seed/route.ts:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, f5b2296 Add social OAuth, deed local_da…, admin.ts, hasAdminPermission(), GET(), server.ts] | lang=en
- "supabase_schema_public_enforce_event_capacity": "public.enforce_event_capacity()" | kind=code-symbol | source=supabase/schema.sql:L180 | neighbors=[schema.sql, current_count, event_capacity, is_staff, public.event_registrations, public.events] | lang=en
- "ui_select": "Select.tsx" | kind=code-symbol | source=src/components/ui/Select.tsx:L1 | neighbors=[UserDirectory.tsx, 03e257b feat: complete dashboard, auth …, 35fbf30 Introduce units and unit-based …, OnboardingClient.tsx, page.tsx, Select] | lang=en
- "units_page": "page.tsx" | kind=code-symbol | source=src/app/admin/units/page.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, UnitsManager.tsx, admin.ts, getAdminContext(), server.ts, createClient()] | lang=en
- "admin_qrscannerwidget": "QrScannerWidget.tsx" | kind=code-symbol | source=src/components/admin/QrScannerWidget.tsx:L1 | neighbors=[BarcodeDetector, QrScannerWidget(), QrScannerWidgetProps, 35fbf30 Introduce units and unit-based …, e714bb0 Improve QR scanner, realtime ch…, PresidentScannerClient.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@28caec0993a982de63355fe88223d3f890c694d7": "28caec0 fix(auth): resolve PKCE verifier loss on OAuth and hydration mismatch o…" | kind=Commit | source=git | neighbors=[page.tsx, main, fc9a24e fix(gamification): correct flag…, LogDeedForm.tsx, LoginClient.tsx, fc280be Update next.config.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@60d2f3fe1cea9d550cb9d8dee65334473bc09534": "60d2f3f Use local state for auth forms; require 8-char pwd" | kind=Commit | source=git | neighbors=[37e3b0a Improve auth error UI, callback…, main, f9b6a15 Improve CSP, error handling, an…, page.tsx, page.tsx, page.tsx] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-003.json

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
