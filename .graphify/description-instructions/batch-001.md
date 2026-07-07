# Node Description Batch 2 of 19

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

- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@9be5451d3c6179c39e0793e5b4dd48807ce1c906": "9be5451 Add unit scoping and eligibility checks" | kind=Commit | source=git | neighbors=[5eaef27 Replace html5-qrcode with jsqr …, actions.ts, UserDirectory.tsx, actions.ts, main, route.ts] | lang=en
- "lms_interactivelesson": "InteractiveLesson.tsx" | kind=code-symbol | source=src/components/lms/InteractiveLesson.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 468bb32 Add course JSON import flow and…, 8cc013d Add dynamic dashboard flashcard…, 8eb7aa8 Add course rewards and server-s…, a227584 Add LMS gamification rewards & …] | lang=en
- "migrations_consolidated_migration": "consolidated_migration.sql" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L1 | neighbors=[07226c4 Add event posters, archiving & …, 35fbf30 Introduce units and unit-based …, auth.identities, auth.users, has_deed, latest_deed_date] | lang=en
- "rewards_adminrewardsmanager": "AdminRewardsManager.tsx" | kind=code-symbol | source=src/app/admin/rewards/AdminRewardsManager.tsx:L1 | neighbors=[11b9da2 fix: make build deterministic o…, 2a2d0ed feat: add leaderboard, announce…, 35fbf30 Introduce units and unit-based …, 9be5451 Add unit scoping and eligibilit…, a4961d0 Merge pull request #1 from Yout…, actions.ts] | lang=en
- "ui_card": "Card.tsx" | kind=code-symbol | source=src/components/ui/Card.tsx:L1 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, EventsManager.tsx, page.tsx, SettingsManager.tsx, UnitsManager.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@54a4d65857ec127ddb68f4ab6502b666ce83fe66": "54a4d65 Replace announcements with notifications" | kind=Commit | source=git | neighbors=[AdminNav.tsx, actions.ts, main, a42476a Add lifetime-based rank tiers a…, page.tsx, PresidentNav.tsx] | lang=en
- "lib_wellms": "wellms.ts" | kind=code-symbol | source=src/lib/wellms.ts:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 2c7d0ff Add admin LMS UI, admin actions…, 670c0c3 Add server lms-data and refacto…, 8eb7aa8 Add course rewards and server-s…, a227584 Add LMS gamification rewards & …] | lang=en
- "lms_coursemoduleslist": "CourseModulesList.tsx" | kind=code-symbol | source=src/components/lms/CourseModulesList.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 390bb7c perf: optimize hot queries and …, 8cc013d Add dynamic dashboard flashcard…, 90ef3d6 Merge pull request #3 from Yout…, 9e0c0d2 Merge branch 'main' of https://…] | lang=en
- "admin_page": "page.tsx" | kind=code-symbol | source=src/app/admin/page.tsx:L1 | neighbors=[AdminDashboardOverview(), admin.ts, getAdminContext(), server.ts, createClient(), Button.tsx] | lang=en
- "notifications_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/president/notifications/page.tsx:L1 | neighbors=[54a4d65 Replace announcements with noti…, PresidentNotificationsClient.tsx, admin.ts, getAdminContext(), lms-data.ts, getCourses()] | lang=en
- "ui_input": "Input.tsx" | kind=code-symbol | source=src/components/ui/Input.tsx:L1 | neighbors=[EventDetailsClient.tsx, EventsManager.tsx, SettingsManager.tsx, UnitsManager.tsx, UserDirectory.tsx, 03e257b feat: complete dashboard, auth …] | lang=en
- "admin_unitsmanager": "UnitsManager.tsx" | kind=code-symbol | source=src/components/admin/UnitsManager.tsx:L1 | neighbors=[actions.ts, createUnit(), deleteUnit(), updateUnit(), Unit, UnitsManager()] | lang=en
- "app_layout": "layout.tsx" | kind=code-symbol | source=src/app/layout.tsx:L1 | neighbors=[metadata, notoNastaliqUrdu, poppins, RootLayout(), CheckInListener.tsx, server.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@02a44a283cc5c6eee28d8f90f5edfc9225cafee6": "02a44a2 Add bilingual (Urdu) support for courses" | kind=Commit | source=git | neighbors=[main, 8cc013d Add dynamic dashboard flashcard…, actions.ts, CoursesClient.tsx, page.tsx, page.tsx] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@a2275846100a27fb03d283cab1e39225fa9e3b71": "a227584 Add LMS gamification rewards & UI updates" | kind=Commit | source=git | neighbors=[actions.ts, main, 9abbc7f Add profile onboarding flow and…, QRScannerModal.tsx, page.tsx, actions.ts] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@fb18f2e6c6859e20c91d02634d551fb244f6f0d1": "fb18f2e Add division scoping, reward edits, admin UI" | kind=Commit | source=git | neighbors=[d17ee1f Add fluid top gradient, tweak d…, actions.ts, EventsManager.tsx, page.tsx, UserDirectory.tsx, page.tsx] | lang=en
- "courses_coursesadminclient": "CoursesAdminClient.tsx" | kind=code-symbol | source=src/app/admin/courses/CoursesAdminClient.tsx:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 468bb32 Add course JSON import flow and…, 8eb7aa8 Add course rewards and server-s…, fb18f2e Add division scoping, reward ed…, actions.ts, updateCourseReward()] | lang=en
- "ui_tabs": "Tabs.tsx" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L1 | neighbors=[ApprovalsQueue.tsx, UserDirectory.tsx, 03e257b feat: complete dashboard, auth …, 80ff45f Add AdminNav, Sonner toasts & U…, AdminRewardsManager.tsx, page.tsx] | lang=en
- "admin_adminnav": "AdminNav.tsx" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L1 | neighbors=[AdminNav(), AdminNavProps, AdminPermissions, NavItem, NavSection, ROOT_ITEMS] | lang=en
- "courses_actions_requirecourseadmin": "requireCourseAdmin()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L8 | neighbors=[actions.ts, createCourse(), createLesson(), createMcq(), createModule(), deleteCourse()] | lang=en
- "login_loginclient": "LoginClient.tsx" | kind=code-symbol | source=src/app/auth/login/LoginClient.tsx:L1 | neighbors=[28caec0 fix(auth): resolve PKCE verifie…, 54a4d65 Replace announcements with noti…, 81653c4 remove manual login forms, a227584 Add LMS gamification rewards & …, d73e533 Add auth UIs, president console…, actions.ts] | lang=en
- "supabase_schema_public_profiles": "public.profiles" | kind=code-symbol | source=supabase/schema.sql:L8 | neighbors=[schema.sql, on_profile_created, public.admin_permissions, public.announcements, public.coin_transactions, public.deed_submissions] | lang=en
- "users_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/president/users/page.tsx:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 35fbf30 Introduce units and unit-based …, 986cd4b Split President console; add ev…, a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…, fb18f2e Add division scoping, reward ed…] | lang=en
- "wallet_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/wallet/page.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …, 4950c5b Revamp dashboard, wallet & LMS …, 51e7e61 perf: fix tag invalidation sign…, 54a4d65 Replace announcements with noti…, 90ef3d6 Merge pull request #3 from Yout…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@80ff45ff9ee361e4241ba7fa01b3c0ea87b74c1d": "80ff45f Add AdminNav, Sonner toasts & UI refresh" | kind=Commit | source=git | neighbors=[33ae1c0 Require single lesson per modul…, AdminNav.tsx, ApprovalsQueue.tsx, EventsManager.tsx, layout.tsx, page.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@e714bb0720a59cc276334b850171579f9525752d": "e714bb0 Improve QR scanner, realtime check-ins & UI" | kind=Commit | source=git | neighbors=[a42476a Add lifetime-based rank tiers a…, actions.ts, QrScannerWidget.tsx, page.tsx, main, 07226c4 Add event posters, archiving & …] | lang=en
- "courses_actions_revalidatecourse": "revalidateCourse()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L24 | neighbors=[actions.ts, createCourse(), createLesson(), createMcq(), createModule(), deleteCourse()] | lang=en
- "dashboard_presidentapprovalsmanager": "PresidentApprovalsManager.tsx" | kind=code-symbol | source=src/components/dashboard/PresidentApprovalsManager.tsx:L1 | neighbors=[page.tsx, 35fbf30 Introduce units and unit-based …, 986cd4b Split President console; add ev…, d73e533 Add auth UIs, president console…, actions.ts, approveDeedSubmission()] | lang=en
- "leaderboard_page": "page.tsx" | kind=code-symbol | source=src/app/leaderboard/page.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …, 437a50b Changes before error encountered, 51e7e61 perf: fix tag invalidation sign…, 90ef3d6 Merge pull request #3 from Yout…, 9e0c0d2 Merge branch 'main' of https://…] | lang=en
- "lib_admin_getadmincontext": "getAdminContext()" | kind=code-symbol | source=src/lib/admin.ts:L78 | neighbors=[actions.ts, layout.tsx, page.tsx, page.tsx, page.tsx, page.tsx] | lang=en
- "log_deed_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/log-deed/page.tsx:L1 | neighbors=[2c7d0ff Add admin LMS UI, admin actions…, 463284b Enforce 3-per-day deeds and add…, 986cd4b Split President console; add ev…, d17ee1f Add fluid top gradient, tweak d…, d73e533 Add auth UIs, president console…, f5b2296 Add social OAuth, deed local_da…] | lang=en
- "migrations_20260523170000_lms_gamification_rewards": "20260523170000_lms_gamification_rewards.sql" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L1 | neighbors=[a227584 Add LMS gamification rewards & …, already_awarded, completed_lessons, course_reward, max_earned_coins, module_idx] | lang=en
- "migrations_20260608000000_comprehensive_updates": "20260608000000_comprehensive_updates.sql" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …, handle_deed_approval, has_deed, latest_deed_date, longest, on_deed_change_update_streak] | lang=en
- "onboarding_onboardingclient": "OnboardingClient.tsx" | kind=code-symbol | source=src/app/onboarding/OnboardingClient.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 430dc36 Update OnboardingClient.tsx, actions.ts, completeProfile(), FormContent(), OnboardingClient()] | lang=en
- "ui_input_input": "Input" | kind=code-symbol | source=src/components/ui/Input.tsx:L13 | neighbors=[EventDetailsClient.tsx, EventsManager.tsx, SettingsManager.tsx, UnitsManager.tsx, UserDirectory.tsx, PresidentEventsManager.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@33d76b01e93db12ed1cf0f6b92e9a49511b85a1d": "33d76b0 Refactor auth, storage, and admin permissions" | kind=Commit | source=git | neighbors=[AdminNav.tsx, actions.ts, actions.ts, main, 37e3b0a Improve auth error UI, callback…, actions.ts] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@4950c5b99233e381b162019056af5924689028ce": "4950c5b Revamp dashboard, wallet & LMS UI/UX" | kind=Commit | source=git | neighbors=[main, 2b98c86 Replace Coolvetica with Google …, 50d072a chore: start performance optimi…, 90ef3d6 Merge pull request #3 from Yout…, page.tsx, DashboardFlashcards.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@8eb7aa8ff963262f9ea8102d804ed98ad2849b3e": "8eb7aa8 Add course rewards and server-side quiz grading" | kind=Commit | source=git | neighbors=[670c0c3 Add server lms-data and refacto…, main, d199610 Normalize and validate R2 publi…, actions.ts, CoursesAdminClient.tsx, page.tsx] | lang=en
- "lessons_actions": "actions.ts" | kind=code-symbol | source=src/app/lms/lessons/actions.ts:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 2a2d0ed feat: add leaderboard, announce…, 8eb7aa8 Add course rewards and server-s…, a227584 Add LMS gamification rewards & …, a4961d0 Merge pull request #1 from Yout…, c993599 perf: fix N+1 queries, parallel…] | lang=en
- "log_deed_logdeedform": "LogDeedForm.tsx" | kind=code-symbol | source=src/app/dashboard/log-deed/LogDeedForm.tsx:L1 | neighbors=[28caec0 fix(auth): resolve PKCE verifie…, 2c7d0ff Add admin LMS UI, admin actions…, 463284b Enforce 3-per-day deeds and add…, d73e533 Add auth UIs, president console…, f5b2296 Add social OAuth, deed local_da…, actions.ts] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-001.json

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
