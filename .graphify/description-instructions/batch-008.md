# Node Description Batch 9 of 19

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

- "courses_actions_lockcourselanguage": "lockCourseLanguage()" | kind=code-symbol | source=src/app/lms/courses/actions.ts:L6 | neighbors=[actions.ts, LanguageSelectModal.tsx]
- "courses_coursesadminclient_courserow": "CourseRow" | kind=code-symbol | source=src/app/admin/courses/CoursesAdminClient.tsx:L12 | neighbors=[CoursesAdminClient.tsx, page.tsx]
- "dashboard_dashboardflashcards_flashcard": "Flashcard" | kind=code-symbol | source=src/components/dashboard/DashboardFlashcards.tsx:L18 | neighbors=[DashboardFlashcards.tsx, page.tsx]
- "docs_course_import_schema_md": "Course JSON Import Schema Guide" | kind=entity | source=docs/course_import_schema.md | neighbors=[AI Course Prompt Guide, Developer & Agent Guide]
- "eslint_config": "eslint.config.mjs" | kind=code-symbol | source=eslint.config.mjs:L1 | neighbors=[64f6af9 Initial commit from Create Next…, eslintConfig]
- "events_loading": "loading.tsx" | kind=code-symbol | source=src/app/events/loading.tsx:L1 | neighbors=[f5b2296 Add social OAuth, deed local_da…, EventsLoading()]
- "id_coursebuilder_coursebuilderdata": "CourseBuilderData" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L52 | neighbors=[CourseBuilder.tsx, page.tsx]
- "id_coursebuilder_lessonnode": "LessonNode" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L31 | neighbors=[CourseBuilder.tsx, page.tsx]
- "id_coursebuilder_mcqnode": "McqNode" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L21 | neighbors=[CourseBuilder.tsx, page.tsx]
- "id_coursebuilder_modulenode": "ModuleNode" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L43 | neighbors=[CourseBuilder.tsx, page.tsx]
- "lessons_actions_submitquiz": "submitQuiz()" | kind=code-symbol | source=src/app/lms/lessons/actions.ts:L49 | neighbors=[actions.ts, InteractiveLesson.tsx]
- "lessons_actions_submitquizresult": "SubmitQuizResult" | kind=code-symbol | source=src/app/lms/lessons/actions.ts:L6 | neighbors=[actions.ts, InteractiveLesson.tsx]
- "lib_admin_adminpermissions": "AdminPermissions" | kind=code-symbol | source=src/lib/admin.ts:L3 | neighbors=[actions.ts, admin.ts]
- "lib_lms_data_getcoursebyid": "getCourseById()" | kind=code-symbol | source=src/lib/lms-data.ts:L96 | neighbors=[page.tsx, lms-data.ts]
- "lib_lms_data_getlessonbyid": "getLessonById()" | kind=code-symbol | source=src/lib/lms-data.ts:L204 | neighbors=[lms-data.ts, getLessonForLearner()]
- "lib_perf_data_getleaderboard": "getLeaderboard()" | kind=code-symbol | source=src/lib/perf-data.ts:L24 | neighbors=[page.tsx, perf-data.ts]
- "lib_wellms_course": "Course" | kind=code-symbol | source=src/lib/wellms.ts:L60 | neighbors=[lms-data.ts, wellms.ts]
- "lib_wellms_getprogress": "getProgress()" | kind=code-symbol | source=src/lib/wellms.ts:L76 | neighbors=[wellms.ts, CourseModulesList.tsx]
- "lib_wellms_learnerlesson": "LearnerLesson" | kind=code-symbol | source=src/lib/wellms.ts:L47 | neighbors=[lms-data.ts, wellms.ts]
- "lib_wellms_learnermcq": "LearnerMCQ" | kind=code-symbol | source=src/lib/wellms.ts:L39 | neighbors=[lms-data.ts, wellms.ts]
- "lib_wellms_lesson": "Lesson" | kind=code-symbol | source=src/lib/wellms.ts:L22 | neighbors=[lms-data.ts, wellms.ts]
- "lms_loading": "loading.tsx" | kind=code-symbol | source=src/app/lms/loading.tsx:L1 | neighbors=[f5b2296 Add social OAuth, deed local_da…, LmsLoading()]
- "migrations_20260523000000_bilingual_and_levels_already_awarded": "already_awarded" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L128 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_completed_lessons": "completed_lessons" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L114 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_course_reward": "course_reward" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L132 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_public_coin_transactions": "public.coin_transactions" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L125 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_public_lessons": "public.lessons" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L108 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_public_modules": "public.modules" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L109 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_public_profiles": "public.profiles" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L23 | neighbors=[20260523000000_bilingual_and_levels.sql, public.user_course_settings]
- "migrations_20260523000000_bilingual_and_levels_public_user_progress": "public.user_progress" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L115 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523000000_bilingual_and_levels_total_lessons": "total_lessons" | kind=code-symbol | source=supabase/migrations/20260523000000_bilingual_and_levels.sql:L107 | neighbors=[20260523000000_bilingual_and_levels.sql, public.handle_course_completion()]
- "migrations_20260523140000_add_email_to_profiles_new_email": "NEW.email" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L17 | neighbors=[20260523140000_add_email_to_profiles.sql, public.set_profile_email()]
- "migrations_20260523140000_add_email_to_profiles_on_auth_user_email_updated": "on_auth_user_email_updated" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L41 | neighbors=[20260523140000_add_email_to_profiles.sql, auth.users]
- "migrations_20260523140000_add_email_to_profiles_on_profile_created": "on_profile_created" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L24 | neighbors=[20260523140000_add_email_to_profiles.sql, public.profiles]
- "migrations_20260523140000_add_email_to_profiles_public_sync_profile_email": "public.sync_profile_email()" | kind=code-symbol | source=supabase/migrations/20260523140000_add_email_to_profiles.sql:L30 | neighbors=[20260523140000_add_email_to_profiles.sql, public.profiles]
- "migrations_20260523170000_lms_gamification_rewards_already_awarded": "already_awarded" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L109 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_completed_lessons": "completed_lessons" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L94 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_course_reward": "course_reward" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L26 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_max_earned_coins": "max_earned_coins" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L70 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]
- "migrations_20260523170000_lms_gamification_rewards_module_idx": "module_idx" | kind=code-symbol | source=supabase/migrations/20260523170000_lms_gamification_rewards.sql:L34 | neighbors=[20260523170000_lms_gamification_rewards…, public.handle_course_completion()]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-008.json

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
