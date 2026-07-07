# Node Description Batch 1 of 19

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
Write every description in English (en). Do not switch languages.
No marketing language.
Respond ONLY with a JSON object mapping each node id (as a string) to its
one-sentence description — no prose, no markdown fences.

- "branch:repo:github.com/Youth-Development-Chapter/ydc-portal#main": "main" | kind=Branch | source=git | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 11b9da2 fix: make build deterministic o…, 28caec0 fix(auth): resolve PKCE verifie…]
- "supabase_schema": "schema.sql" | kind=code-symbol | source=supabase/schema.sql:L1 | neighbors=[07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 2c7d0ff Add admin LMS UI, admin actions…, 33d76b0 Refactor auth, storage, and adm…, 35fbf30 Introduce units and unit-based …, 37e3b0a Improve auth error UI, callback…]
- "admin_actions": "actions.ts" | kind=code-symbol | source=src/app/admin/actions.ts:L1 | neighbors=[adjustUserCoins(), approveDeedSubmission(), archiveEvent(), bulkCheckInAttendees(), bulkProcessLeaves(), checkInTicket()]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@35fbf30408ed7c13027027b7c65e726030033531": "35fbf30 Introduce units and unit-based admin scoping" | kind=Commit | source=git | neighbors=[actions.ts, AdminNav.tsx, ApprovalsQueue.tsx, EventsManager.tsx, QrScannerWidget.tsx, SettingsManager.tsx]
- "id_page": "page.tsx" | kind=code-symbol | source=src/app/lms/lessons/[id]/page.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 2c7d0ff Add admin LMS UI, admin actions…, 33d76b0 Refactor auth, storage, and adm…, 390bb7c perf: optimize hot queries and …, 44b9a2a Add relative class to book cove…]
- "supabase_server": "server.ts" | kind=code-symbol | source=src/utils/supabase/server.ts:L1 | neighbors=[actions.ts, layout.tsx, page.tsx, actions.ts, layout.tsx, page.tsx]
- "courses_actions": "actions.ts" | kind=code-symbol | source=src/app/lms/courses/actions.ts:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 2c7d0ff Add admin LMS UI, admin actions…, 33ae1c0 Require single lesson per modul…, 33d76b0 Refactor auth, storage, and adm…, 390bb7c perf: optimize hot queries and …, 468bb32 Add course JSON import flow and…]
- "dashboard_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/page.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 2a2d0ed feat: add leaderboard, announce…, 2c7d0ff Add admin LMS UI, admin actions…]
- "admin_userdirectory": "UserDirectory.tsx" | kind=code-symbol | source=src/components/admin/UserDirectory.tsx:L1 | neighbors=[actions.ts, adjustUserCoins(), deleteUserProfile(), getUserFullHistory(), updateUserAdminRole(), updateUserProfileAdmin()]
- "id_coursebuilder": "CourseBuilder.tsx" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 2c7d0ff Add admin LMS UI, admin actions…, 33ae1c0 Require single lesson per modul…, 8eb7aa8 Add course rewards and server-s…, actions.ts, createLesson()]
- "supabase_server_createclient": "createClient()" | kind=code-symbol | source=src/utils/supabase/server.ts:L4 | neighbors=[actions.ts, layout.tsx, page.tsx, actions.ts, layout.tsx, page.tsx]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@f5b2296c13ccfbc280622028c4f4c43ffa0fc039": "f5b2296 Add social OAuth, deed local_date checks & UI" | kind=Commit | source=git | neighbors=[d199610 Normalize and validate R2 publi…, ApprovalsQueue.tsx, EventsManager.tsx, SettingsManager.tsx, UserDirectory.tsx, actions.ts]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@03e257b237f984327ac42488c3545b1f51c98c7f": "03e257b feat: complete dashboard, auth system, and LMS native integration" | kind=Commit | source=git | neighbors=[layout.tsx, page.tsx, actions.ts, main, route.ts, 56fc596 Redirect root page to /auth/log…]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@2c7d0ffb51eb5e34e23d2e4abd81456c1cc75045": "2c7d0ff Add admin LMS UI, admin actions, and APIs" | kind=Commit | source=git | neighbors=[actions.ts, ApprovalsQueue.tsx, EventsManager.tsx, layout.tsx, page.tsx, SettingsManager.tsx]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@d73e5336b01c2600c8340e3b076000ccd6da6aa9": "d73e533 Add auth UIs, president console, event update" | kind=Commit | source=git | neighbors=[a7f8177 Add email to profiles with migr…, actions.ts, AdminNav.tsx, actions.ts, main, d600a2b Add change-language UI and YouT…]
- "lib_lms_data": "lms-data.ts" | kind=code-symbol | source=src/lib/lms-data.ts:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 390bb7c perf: optimize hot queries and …, 41b5a86 security: fix XSS, API ownershi…, 670c0c3 Add server lms-data and refacto…, 8eb7aa8 Add course rewards and server-s…, 90ef3d6 Merge pull request #3 from Yout…]
- "migrations_20260608120000_sync_updated_schema": "20260608120000_sync_updated_schema.sql" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L1 | neighbors=[9be5451 Add unit scoping and eligibilit…, already_awarded, completed_lessons, course_reward, has_deed, latest_deed_date]
- "admin_eventdetailsclient": "EventDetailsClient.tsx" | kind=code-symbol | source=src/components/admin/EventDetailsClient.tsx:L1 | neighbors=[actions.ts, archiveEvent(), bulkCheckInAttendees(), bulkProcessLeaves(), checkInTicket(), deleteEvent()]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@a4961d0b226508990a607b76915bec2b13e9c126": "a4961d0 Merge pull request #1 from Youth-Development-Chapter/copilot/review-sec…" | kind=Commit | source=git | neighbors=[11b9da2 fix: make build deterministic o…, error.tsx, layout.tsx, loading.tsx, actions.ts, error.tsx]
- "admin_eventsmanager": "EventsManager.tsx" | kind=code-symbol | source=src/components/admin/EventsManager.tsx:L1 | neighbors=[actions.ts, createEvent(), updateEventCoinReward(), EventItem, EventsManager(), extractAccentColor()]
- "dashboard_presidenteventsmanager": "PresidentEventsManager.tsx" | kind=code-symbol | source=src/components/dashboard/PresidentEventsManager.tsx:L1 | neighbors=[07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 35fbf30 Introduce units and unit-based …, 7522853 Add admin user management & tic…, 986cd4b Split President console; add ev…, 9be5451 Add unit scoping and eligibilit…]
- "events_page": "page.tsx" | kind=code-symbol | source=src/app/events/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, 07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 2c7d0ff Add admin LMS UI, admin actions…, 35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …]
- "ui_button": "Button.tsx" | kind=code-symbol | source=src/components/ui/Button.tsx:L1 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, EventsManager.tsx, page.tsx, SettingsManager.tsx, UnitsManager.tsx]
- "admin_approvalsqueue": "ApprovalsQueue.tsx" | kind=code-symbol | source=src/components/admin/ApprovalsQueue.tsx:L1 | neighbors=[actions.ts, approveDeedSubmission(), flagDeedSubmission(), overrideDeedDecision(), rejectDeedSubmission(), ApprovalsQueue()]
- "app_actions": "actions.ts" | kind=code-symbol | source=src/app/actions.ts:L1 | neighbors=[ALLOWED_MIME_TYPES, claimTicket(), getEventsFromServer(), logDeed(), criteria.ts, evaluateCriteria()]
- "lib_admin": "admin.ts" | kind=code-symbol | source=src/lib/admin.ts:L1 | neighbors=[actions.ts, layout.tsx, page.tsx, page.tsx, 2c7d0ff Add admin LMS UI, admin actions…, actions.ts]
- "auth_actions": "actions.ts" | kind=code-symbol | source=src/app/auth/actions.ts:L1 | neighbors=[ALLOWED_IMAGE_TYPES, completeProfile(), login(), logout(), resetPassword(), signup()]
- "showcase_page": "page.tsx" | kind=code-symbol | source=src/app/showcase/page.tsx:L1 | neighbors=[03e257b feat: complete dashboard, auth …, ShowcasePage(), Badge.tsx, Badge(), Button.tsx, Button]
- "ui_button_button": "Button" | kind=code-symbol | source=src/components/ui/Button.tsx:L13 | neighbors=[ApprovalsQueue.tsx, EventDetailsClient.tsx, EventsManager.tsx, page.tsx, SettingsManager.tsx, UnitsManager.tsx]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@07226c4003e7d1d70618dd85bb366f7d24bc3f07": "07226c4 Add event posters, archiving & roster features" | kind=Commit | source=git | neighbors=[actions.ts, EventDetailsClient.tsx, EventsManager.tsx, page.tsx, actions.ts, layout.tsx]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@90ef3d6905dd5181f6e80f401e8e11afb2470fc3": "90ef3d6 Merge pull request #3 from Youth-Development-Chapter/copilot/improve-si…" | kind=Commit | source=git | neighbors=[4950c5b Revamp dashboard, wallet & LMS …, 51e7e61 perf: fix tag invalidation sign…, actions.ts, actions.ts, main, 9e0c0d2 Merge branch 'main' of https://…]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@9e0c0d206353b124995a62e76596129a0f771aea": "9e0c0d2 Merge branch 'main' of https://github.com/Youth-Development-Chapter/ydc…" | kind=Commit | source=git | neighbors=[2b98c86 Replace Coolvetica with Google …, 90ef3d6 Merge pull request #3 from Yout…, actions.ts, actions.ts, main, 53cdade Implement server-side logout an…]
- "courses_page": "page.tsx" | kind=code-symbol | source=src/app/lms/courses/page.tsx:L1 | neighbors=[02a44a2 Add bilingual (Urdu) support fo…, 03e257b feat: complete dashboard, auth …, 2c7d0ff Add admin LMS UI, admin actions…, 33d76b0 Refactor auth, storage, and adm…, 390bb7c perf: optimize hot queries and …, 4950c5b Revamp dashboard, wallet & LMS …]
- "events_eventsclient": "EventsClient.tsx" | kind=code-symbol | source=src/app/events/EventsClient.tsx:L1 | neighbors=[07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …, 51e7e61 perf: fix tag invalidation sign…, 7522853 Add admin user management & tic…]
- "lib_perf_data": "perf-data.ts" | kind=code-symbol | source=src/lib/perf-data.ts:L1 | neighbors=[07226c4 Add event posters, archiving & …, 0aff7f1 add graphify, 35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …, 90ef3d6 Merge pull request #3 from Yout…, 9be5451 Add unit scoping and eligibilit…]
- "rewards_actions": "actions.ts" | kind=code-symbol | source=src/app/dashboard/rewards/actions.ts:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …, 437a50b Changes before error encountered, 51e7e61 perf: fix tag invalidation sign…, 90ef3d6 Merge pull request #3 from Yout…, 9be5451 Add unit scoping and eligibilit…]
- "admin_settingsmanager": "SettingsManager.tsx" | kind=code-symbol | source=src/components/admin/SettingsManager.tsx:L1 | neighbors=[actions.ts, updateCourseReward(), updateSystemSetting(), CourseItem, RankTier, SettingItem]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@390bb7c9770d126fc221fbc068b612a869d58203": "390bb7c perf: optimize hot queries and add cache-safe data helpers" | kind=Commit | source=git | neighbors=[actions.ts, actions.ts, main, 51e7e61 perf: fix tag invalidation sign…, actions.ts, page.tsx]
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@986cd4b53763984a8a3a4f91ca16255b1153975a": "986cd4b Split President console; add event & deed UIs" | kind=Commit | source=git | neighbors=[actions.ts, EventDetailsClient.tsx, EventsManager.tsx, SettingsManager.tsx, UserDirectory.tsx, page.tsx]
- "rewards_page": "page.tsx" | kind=code-symbol | source=src/app/dashboard/rewards/page.tsx:L1 | neighbors=[35fbf30 Introduce units and unit-based …, 390bb7c perf: optimize hot queries and …, 437a50b Changes before error encountered, 90ef3d6 Merge pull request #3 from Yout…, 9be5451 Add unit scoping and eligibilit…, 9e0c0d2 Merge branch 'main' of https://…]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-000.json

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
