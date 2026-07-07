# Node Description Batch 3 of 19

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

- "migrations_20260523000000_bilingual_and_levels": "20260523000000_bilingual_and_levels.sql" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, already_awarded, completed_lessons, course_reward, public.coin_transactions, public.courses] | lang=en
- "migrations_20260523170000_lms_gamification_rewards_public_handle_course_completion": "public.handle_course_completion()" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L6 | neighbors=[20260523170000_lms_gamification_rewards…, already_awarded, completed_lessons, course_reward, max_earned_coins, module_idx] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_handle_course_completion": "public.handle_course_completion()" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L203 | neighbors=[20260608120000_sync_updated_schema.sql, already_awarded, completed_lessons, course_reward, max_earned_coins, module_idx] | lang=en
- "signup_signupclient": "SignupClient.tsx" | kind=code-symbol | source=src/app/auth/signup/SignupClient.tsx:L1 | neighbors=[54a4d65 Replace announcements with noti…, 81653c4 remove manual login forms, d73e533 Add auth UIs, president console…, page.tsx, actions.ts, signup()] | lang=en
- "supabase_api": "api.ts" | kind=code-symbol | source=src/utils/supabase/api.ts:L1 | neighbors=[route.ts, route.ts, 3f188c3 Add mobile API routes and supab…, route.ts, route.ts, route.ts] | lang=en
- "supabase_schema_public_handle_course_completion": "public.handle_course_completion()" | kind=code-symbol | source=supabase/schema.sql:L778 | neighbors=[schema.sql, already_awarded, completed_lessons, course_reward, max_earned_coins, module_idx] | lang=en
- "ui_pageheader": "PageHeader.tsx" | kind=code-symbol | source=src/components/ui/PageHeader.tsx:L1 | neighbors=[d73e533 Add auth UIs, president console…, page.tsx, EventsClient.tsx, page.tsx, page.tsx, layout.tsx] | lang=en
- "approvals_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/president/approvals/page.tsx:L1 | neighbors=[ApprovalsQueue.tsx, AdminApprovalsPage(), PresidentApprovalsPage(), PresidentApprovalsManager.tsx, admin.ts, getAdminContext()] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@3f188c380616acc17fa6918a6405283b1db1fb9a": "3f188c3 Add mobile API routes and supabase api client" | kind=Commit | source=git | neighbors=[main, route.ts, route.ts, 35fbf30 Introduce units and unit-based …, route.ts, route.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@51e7e614993f587215d21d76a138dfdb8ae36b03": "51e7e61 perf: fix tag invalidation signatures and type-safe event mappings" | kind=Commit | source=git | neighbors=[390bb7c perf: optimize hot queries and …, actions.ts, actions.ts, main, 90ef3d6 Merge pull request #3 from Yout…, actions.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@c99359942a7ae235eebe1242a2154eefdc6df3a0": "c993599 perf: fix N+1 queries, parallelize submitQuiz, add error boundaries and…" | kind=Commit | source=git | neighbors=[41b5a86 security: fix XSS, API ownershi…, error.tsx, loading.tsx, global-error.tsx, main, 437a50b Changes before error encountered] | lang=en
- "lib_criteria": "criteria.ts" | kind=code-symbol | source=src/lib/criteria.ts:L1 | neighbors=[actions.ts, actions.ts, route.ts, route.ts, 07226c4 Add event posters, archiving & …, 35fbf30 Introduce units and unit-based …] | lang=en
- "lms_languageselectmodal": "LanguageSelectModal.tsx" | kind=code-symbol | source=src/components/lms/LanguageSelectModal.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 4950c5b Revamp dashboard, wallet & LMS …, 8cc013d Add dynamic dashboard flashcard…, a227584 Add LMS gamification rewards & …, d600a2b Add change-language UI and YouT…, e714bb0 Improve QR scanner, realtime ch…] | lang=en
- "settings_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/settings/page.tsx:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 35fbf30 Introduce units and unit-based …, d73e533 Add auth UIs, president console…, f5b2296 Add social OAuth, deed local_da…, SettingsManager.tsx, admin.ts] | lang=en
- "settings_settingsform": "SettingsForm.tsx" | kind=code-symbol | source=src/app/dashboard/settings/SettingsForm.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, d73e533 Add auth UIs, president console…, f5b2296 Add social OAuth, deed local_da…, page.tsx, actions.ts, updateProfile()] | lang=en
- "admin_layout": "layout.tsx" | kind=code-symbol | source=src/app/admin/layout.tsx:L1 | neighbors=[AdminNav.tsx, AdminLayout(), admin.ts, getAdminContext(), server.ts, createClient()] | lang=en
- "dashboard_presidentscannerclient": "PresidentScannerClient.tsx" | kind=code-symbol | source=src/components/dashboard/PresidentScannerClient.tsx:L1 | neighbors=[986cd4b Split President console; add ev…, e714bb0 Improve QR scanner, realtime ch…, actions.ts, checkInTicket(), QrScannerWidget.tsx, PresidentScannerClient()] | lang=en
- "login_page": "page.tsx" | kind=code-symbol | source=src/app/auth/login/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 35fbf30 Introduce units and unit-based …, a227584 Add LMS gamification rewards & …, d1d9dc2 Replace Link with external anch…, d73e533 Add auth UIs, president console…, f5b2296 Add social OAuth, deed local_da…] | lang=en
- "next_config": "next.config.ts" | kind=code-symbol | source=next.config.ts:L1 | neighbors=[41b5a86 security: fix XSS, API ownershi…, 64f6af9 Initial commit from Create Next…, a4961d0 Merge pull request #1 from Yout…, c68f0b0 Allow db.ydc.org.pk in CSP and …, d600a2b Add change-language UI and YouT…, e714bb0 Improve QR scanner, realtime ch…] | lang=en
- "supabase_client": "client.ts" | kind=code-symbol | source=src/utils/supabase/client.ts:L1 | neighbors=[EventDetailsClient.tsx, EventsManager.tsx, 03e257b feat: complete dashboard, auth …, CheckInListener.tsx, PresidentEventsManager.tsx, wellms.ts] | lang=en
- "ui_card_card": "Card()" | kind=code-symbol | source=src/components/ui/Card.tsx:L10 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, EventsManager.tsx, page.tsx, SettingsManager.tsx, UnitsManager.tsx] | lang=en
- "ui_card_cardcontent": "CardContent()" | kind=code-symbol | source=src/components/ui/Card.tsx:L56 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, EventsManager.tsx, page.tsx, SettingsManager.tsx, UnitsManager.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@41b5a86e5469b75f4234718143a33b420a419c36": "41b5a86 security: fix XSS, API ownership, crypto random, file upload, password,…" | kind=Commit | source=git | neighbors=[actions.ts, actions.ts, main, c993599 perf: fix N+1 queries, parallel…, route.ts, env.ts] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@670c0c3b283d78153ad8d5b8f9969c674ecfa83c": "670c0c3 Add server lms-data and refactor wellms" | kind=Commit | source=git | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, main, 8eb7aa8 Add course rewards and server-s…, page.tsx, route.ts, page.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@8cc013df87483a678442f04131b7e7cf40969efb": "8cc013d Add dynamic dashboard flashcards and UI refinements" | kind=Commit | source=git | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, main, d17ee1f Add fluid top gradient, tweak d…, CoursesClient.tsx, DashboardFlashcards.tsx, page.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@fc9a24e4ffcac3bf38ee261f5af3ba2bd36208c0": "fc9a24e fix(gamification): correct flag double-deduction, streak basis, and eve…" | kind=Commit | source=git | neighbors=[28caec0 fix(auth): resolve PKCE verifie…, actions.ts, main, route.ts, c06ef93 fixed check in logic, 20260611100000_fix_flag_double_deductio…] | lang=en
- "dashboard_dashboardflashcards": "DashboardFlashcards.tsx" | kind=code-symbol | source=src/components/dashboard/DashboardFlashcards.tsx:L1 | neighbors=[390bb7c perf: optimize hot queries and …, 4950c5b Revamp dashboard, wallet & LMS …, 8cc013d Add dynamic dashboard flashcard…, 90ef3d6 Merge pull request #3 from Yout…, 9e0c0d2 Merge branch 'main' of https://…, d73e533 Add auth UIs, president console…] | lang=en
- "forgot_password_page": "page.tsx" | kind=code-symbol | source=src/app/auth/forgot-password/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 60d2f3f Use local state for auth forms;…, f9b6a15 Improve CSP, error handling, an…, actions.ts, resetPassword(), ForgotPasswordPage()] | lang=en
- "migrations_20260523000000_bilingual_and_levels_public_handle_course_completion": "public.handle_course_completion()" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L98 | neighbors=[20260523000000_bilingual_and_levels.sql, already_awarded, completed_lessons, course_reward, public.coin_transactions, public.courses] | lang=en
- "notifications_actions": "actions.ts" | kind=code-symbol | source=src/app/admin/notifications/actions.ts:L1 | neighbors=[54a4d65 Replace announcements with noti…, PresidentNotificationsClient.tsx, admin.ts, hasAdminPermission(), createAnnouncement(), deleteAnnouncement()] | lang=en
- "scanner_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/president/scanner/page.tsx:L1 | neighbors=[07226c4 Add event posters, archiving & …, 54a4d65 Replace announcements with noti…, 986cd4b Split President console; add ev…, c06ef93 fixed check in logic, PresidentScannerClient.tsx, admin.ts] | lang=en
- "signup_page": "page.tsx" | kind=code-symbol | source=src/app/auth/signup/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 60d2f3f Use local state for auth forms;…, d1d9dc2 Replace Link with external anch…, d73e533 Add auth UIs, president console…, f5b2296 Add social OAuth, deed local_da…, f9b6a15 Improve CSP, error handling, an…] | lang=en
- "supabase_api_createapiclient": "createApiClient()" | kind=code-symbol | source=src/utils/supabase/api.ts:L11 | neighbors=[route.ts, route.ts, route.ts, route.ts, route.ts, route.ts] | lang=en
- "supabase_client_createclient": "createClient()" | kind=code-symbol | source=src/utils/supabase/client.ts:L3 | neighbors=[EventDetailsClient.tsx, EventsManager.tsx, CheckInListener.tsx, PresidentEventsManager.tsx, wellms.ts, CourseModulesList.tsx] | lang=en
- "auth_code_error_page": "page.tsx" | kind=code-symbol | source=src/app/auth/auth-code-error/page.tsx:L1 | neighbors=[AuthCodeErrorPage(), ErrorDetails, Button.tsx, Button, 28caec0 fix(auth): resolve PKCE verifie…, 37e3b0a Improve auth error UI, callback…] | lang=en
- "check_in_route": "route.ts" | kind=code-symbol | source=src/app/api/events/ticket/check-in/route.ts:L1 | neighbors=[POST(), criteria.ts, evaluateCriteria(), api.ts, createApiClient(), 07226c4 Add event posters, archiving & …] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@7522853ed5069a8de53d8892228e2ed38a18391c": "7522853 Add admin user management & ticket scanning updates" | kind=Commit | source=git | neighbors=[actions.ts, EventsManager.tsx, UserDirectory.tsx, main, e8e1c1d Add coin total to user profile, page.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@c0dc63298b2cbfed50acb535615981a84fba89f1": "c0dc632 Add Urdu localization to lessons and UI" | kind=Commit | source=git | neighbors=[463284b Enforce 3-per-day deeds and add…, layout.tsx, main, 02a44a2 Add bilingual (Urdu) support fo…, lms-data.ts, wellms.ts] | lang=en
- "migrations_20260611100200_event_capacity_trigger": "20260611100200_event_capacity_trigger.sql" | kind=code-symbol | source=supabase/migrations/20260611100200_event_capacity_trigger.sql:L1 | neighbors=[fc9a24e fix(gamification): correct flag…, current_count, event_capacity, is_staff, on_registration_enforce_capacity, public.enforce_event_capacity()] | lang=en
- "reset_password_page": "page.tsx" | kind=code-symbol | source=src/app/auth/reset-password/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 60d2f3f Use local state for auth forms;…, actions.ts, updatePassword(), ResetPasswordPage(), Button.tsx] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-002.json

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
