# Node Description Batch 6 of 19

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

- "ui_localtime": "LocalTime.tsx" | kind=code-symbol | source=src/components/ui/LocalTime.tsx:L1 | neighbors=[463284b Enforce 3-per-day deeds and add…, DeedHistoryClient.tsx, page.tsx, LocalTime(), LocalTimeProps] | lang=en
- "ui_tabs_tabs": "Tabs()" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L18 | neighbors=[ApprovalsQueue.tsx, UserDirectory.tsx, AdminRewardsManager.tsx, page.tsx, Tabs.tsx] | lang=en
- "ui_tabs_tabscontent": "TabsContent()" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L117 | neighbors=[ApprovalsQueue.tsx, UserDirectory.tsx, AdminRewardsManager.tsx, page.tsx, Tabs.tsx] | lang=en
- "ui_tabs_tabslist": "TabsList()" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L51 | neighbors=[ApprovalsQueue.tsx, UserDirectory.tsx, AdminRewardsManager.tsx, page.tsx, Tabs.tsx] | lang=en
- "ui_tabs_tabstrigger": "TabsTrigger()" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L71 | neighbors=[ApprovalsQueue.tsx, UserDirectory.tsx, AdminRewardsManager.tsx, page.tsx, Tabs.tsx] | lang=en
- "callback_route": "route.ts" | kind=code-symbol | source=src/app/auth/callback/route.ts:L1 | neighbors=[GET(), 03e257b feat: complete dashboard, auth …, 35fbf30 Introduce units and unit-based …, 37e3b0a Improve auth error UI, callback…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@2b98c8697100508ec9687e2cd00b592381b88c7e": "2b98c86 Replace Coolvetica with Google Poppins font" | kind=Commit | source=git | neighbors=[layout.tsx, main, 9e0c0d2 Merge branch 'main' of https://…, 4950c5b Revamp dashboard, wallet & LMS …] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@430dc36d30859f5eb683eec0d09462185f100d4b": "430dc36 Update OnboardingClient.tsx" | kind=Commit | source=git | neighbors=[main, fc280be Update next.config.ts, OnboardingClient.tsx, 81653c4 remove manual login forms] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@44216ba11a02bc98cdba78f6da3c6981d81c56a8": "44216ba Rename admin nav item to 'Streaks'" | kind=Commit | source=git | neighbors=[AdminNav.tsx, main, 9ddb8b2 chore: sync package-lock.json t…, 80ff45f Add AdminNav, Sonner toasts & U…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@44b9a2a09256ab3e762cb88dad0be54f528abf25": "44b9a2a Add relative class to book cover container" | kind=Commit | source=git | neighbors=[main, 3f188c3 Add mobile API routes and supab…, page.tsx, 53cdade Implement server-side logout an…] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@56fc59693250b3ab8e27a4fdcdad9609c2b91c73": "56fc596 Redirect root page to /auth/login" | kind=Commit | source=git | neighbors=[03e257b feat: complete dashboard, auth …, page.tsx, main, d6aee11 Merge branch 'main' of https://…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@a42476af6f94ca2ca7787d1fbcf08009f1e390a9": "a42476a Add lifetime-based rank tiers and UI tweaks" | kind=Commit | source=git | neighbors=[54a4d65 Replace announcements with noti…, main, e714bb0 Improve QR scanner, realtime ch…, page.tsx] | lang=pt
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@bda94d0d83f3d80b15cd02c27fb528d82c74ce64": "bda94d0 Add inspect scripts; simplify event visibility" | kind=Commit | source=git | neighbors=[835d3b9 Add unit roster & event visibil…, main, 986cd4b Split President console; add ev…, page.tsx] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@c68f0b09cccbc35230923b9c5a046f3b35562096": "c68f0b0 Allow db.ydc.org.pk in CSP and image domains" | kind=Commit | source=git | neighbors=[main, 463284b Enforce 3-per-day deeds and add…, next.config.ts, f9b6a15 Improve CSP, error handling, an…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@d199610d74a138e33c499a448e30be2ed3578a00": "d199610 Normalize and validate R2 public URL" | kind=Commit | source=git | neighbors=[8eb7aa8 Add course rewards and server-s…, actions.ts, main, f5b2296 Add social OAuth, deed local_da…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@d6aee11b969a7fc3076d3a994bfcabd67a35590c": "d6aee11 Merge branch 'main' of https://github.com/Youth-Development-Chapter/ydc…" | kind=Commit | source=git | neighbors=[35b9ddf Initial commit, 56fc596 Redirect root page to /auth/log…, main, 2c7d0ff Add admin LMS UI, admin actions…] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@e41ebed1f76f37e98268e3a9a49e96a3a8bf6006": "e41ebed try patch #3" | kind=Commit | source=git | neighbors=[07226c4 Add event posters, archiving & …, layout.tsx, main, 81653c4 remove manual login forms] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@e8e1c1db590e4c023762e0a21cafe5393b892bc8": "e8e1c1d Add coin total to user profile" | kind=Commit | source=git | neighbors=[7522853 Add admin user management & tic…, actions.ts, main, 4950c5b Revamp dashboard, wallet & LMS …] | lang=en
- "commit:repo:github.com/Youth-Development-Chapter/ydc-portal@fc280be1142d41b223059a3697001c98a54fcb98": "fc280be Update next.config.ts" | kind=Commit | source=git | neighbors=[430dc36 Update OnboardingClient.tsx, main, 28caec0 fix(auth): resolve PKCE verifie…, next.config.ts] | lang=en
- "courses_actions_createcourse": "createCourse()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L37 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CoursesAdminClient.tsx] | lang=en
- "courses_actions_createlesson": "createLesson()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L201 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_createmcq": "createMcq()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L291 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_createmodule": "createModule()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L129 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_deletecourse": "deleteCourse()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L116 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CoursesAdminClient.tsx] | lang=en
- "courses_actions_deletelesson": "deleteLesson()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L277 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_deletemcq": "deleteMcq()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L379 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_deletemodule": "deleteModule()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L188 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_importcoursefromjson": "importCourseFromJson()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L472 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CoursesAdminClient.tsx] | lang=en
- "courses_actions_updatecourse": "updateCourse()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L78 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_updatelesson": "updateLesson()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L242 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_updatemcq": "updateMcq()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L335 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "courses_actions_updatemodule": "updateModule()" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L164 | neighbors=[actions.ts, requireCourseAdmin(), revalidateCourse(), CourseBuilder.tsx] | lang=en
- "dashboard_myeventscarousel": "MyEventsCarousel.tsx" | kind=code-symbol | source=src/components/dashboard/MyEventsCarousel.tsx:L1 | neighbors=[07226c4 Add event posters, archiving & …, EventCarouselItem, MyEventsCarousel(), page.tsx] | lang=en
- "lib_lms_data_getcourses": "getCourses()" | kind=code-symbol | source=src/lib/lms-data.ts:L40 | neighbors=[page.tsx, page.tsx, lms-data.ts, page.tsx] | lang=en
- "migrations_20260608000000_comprehensive_updates_public_deed_submissions": "public.deed_submissions" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L141 | neighbors=[20260608000000_comprehensive_updates.sql, on_deed_change_update_streak, on_deed_status_coins, public.update_user_streak()] | lang=en
- "migrations_20260608120000_sync_updated_schema_public_deed_submissions": "public.deed_submissions" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L133 | neighbors=[20260608120000_sync_updated_schema.sql, on_deed_change_update_streak, on_deed_status_coins, public.update_user_streak()] | lang=en
- "migrations_20260608130000_check_user_providers_public_check_user_providers": "public.check_user_providers()" | kind=code-symbol | source=supabase/migrations/20260608130000_check_user_providers.sql:L2 | neighbors=[20260608130000_check_user_providers.sql, auth.identities, auth.users, providers] | lang=en
- "migrations_consolidated_migration_public_deed_submissions": "public.deed_submissions" | kind=code-symbol | source=supabase/migrations/consolidated_migration.sql:L163 | neighbors=[consolidated_migration.sql, on_deed_change_update_streak, on_deed_status_coins, public.update_user_streak()] | lang=en
- "submit_route": "route.ts" | kind=code-symbol | source=src/app/api/lms/quiz/submit/route.ts:L1 | neighbors=[3f188c3 Add mobile API routes and supab…, POST(), api.ts, createApiClient()] | lang=en
- "supabase_schema_public_check_user_providers": "public.check_user_providers()" | kind=code-symbol | source=supabase/schema.sql:L1055 | neighbors=[schema.sql, auth.identities, auth.users, providers] | lang=en

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-005.json

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
