# Node Description Batch 16 of 19

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

- "lib_lms_data_lesson_html_options": "LESSON_HTML_OPTIONS" | kind=code-symbol | source=src/lib/lms-data.ts:L19 | neighbors=[lms-data.ts]
- "lib_lms_data_sanitizelessoncontent": "sanitizeLessonContent()" | kind=code-symbol | source=src/lib/lms-data.ts:L36 | neighbors=[lms-data.ts]
- "lib_perf_data_getrecentannouncementscached": "getRecentAnnouncementsCached" | kind=code-symbol | source=src/lib/perf-data.ts:L97 | neighbors=[perf-data.ts]
- "lib_perf_data_leaderboardentry": "LeaderboardEntry" | kind=code-symbol | source=src/lib/perf-data.ts:L16 | neighbors=[perf-data.ts]
- "lib_wellms_mcq": "MCQ" | kind=code-symbol | source=src/lib/wellms.ts:L13 | neighbors=[wellms.ts]
- "lib_wellms_saveprogress": "saveProgress()" | kind=code-symbol | source=src/lib/wellms.ts:L104 | neighbors=[wellms.ts]
- "lms_changelanguagebutton_changelanguagebutton": "ChangeLanguageButton()" | kind=code-symbol | source=src/components/lms/ChangeLanguageButton.tsx:L14 | neighbors=[ChangeLanguageButton.tsx]
- "lms_changelanguagebutton_changelanguagebuttonprops": "ChangeLanguageButtonProps" | kind=code-symbol | source=src/components/lms/ChangeLanguageButton.tsx:L7 | neighbors=[ChangeLanguageButton.tsx]
- "lms_coursemoduleslist_coursemoduleslist": "CourseModulesList()" | kind=code-symbol | source=src/components/lms/CourseModulesList.tsx:L68 | neighbors=[CourseModulesList.tsx]
- "lms_coursemoduleslist_coursemoduleslistprops": "CourseModulesListProps" | kind=code-symbol | source=src/components/lms/CourseModulesList.tsx:L16 | neighbors=[CourseModulesList.tsx]
- "lms_coursemoduleslist_marqueetext": "MarqueeText()" | kind=code-symbol | source=src/components/lms/CourseModulesList.tsx:L23 | neighbors=[CourseModulesList.tsx]
- "lms_coursemoduleslist_module": "Module" | kind=code-symbol | source=src/components/lms/CourseModulesList.tsx:L9 | neighbors=[CourseModulesList.tsx]
- "lms_error_lmserror": "LmsError()" | kind=code-symbol | source=src/app/lms/error.tsx:L7 | neighbors=[error.tsx]
- "lms_interactivelesson_getyoutubeembedurl": "getYouTubeEmbedUrl()" | kind=code-symbol | source=src/components/lms/InteractiveLesson.tsx:L35 | neighbors=[InteractiveLesson.tsx]
- "lms_interactivelesson_interactivelesson": "InteractiveLesson()" | kind=code-symbol | source=src/components/lms/InteractiveLesson.tsx:L54 | neighbors=[InteractiveLesson.tsx]
- "lms_interactivelesson_learnermcq": "LearnerMCQ" | kind=code-symbol | source=src/components/lms/InteractiveLesson.tsx:L9 | neighbors=[InteractiveLesson.tsx]
- "lms_interactivelesson_lesson": "Lesson" | kind=code-symbol | source=src/components/lms/InteractiveLesson.tsx:L17 | neighbors=[InteractiveLesson.tsx]
- "lms_interactivelesson_viewstate": "ViewState" | kind=code-symbol | source=src/components/lms/InteractiveLesson.tsx:L28 | neighbors=[InteractiveLesson.tsx]
- "lms_languageselectmodal_languageselectmodal": "LanguageSelectModal()" | kind=code-symbol | source=src/components/lms/LanguageSelectModal.tsx:L17 | neighbors=[LanguageSelectModal.tsx]
- "lms_languageselectmodal_languageselectmodalprops": "LanguageSelectModalProps" | kind=code-symbol | source=src/components/lms/LanguageSelectModal.tsx:L8 | neighbors=[LanguageSelectModal.tsx]
- "lms_layout_lmslayout": "LmsLayout()" | kind=code-symbol | source=src/app/lms/layout.tsx:L4 | neighbors=[layout.tsx]
- "lms_loading_lmsloading": "LmsLoading()" | kind=code-symbol | source=src/app/lms/loading.tsx:L3 | neighbors=[loading.tsx]
- "log_deed_deedhistoryclient_deedhistoryclient": "DeedHistoryClient()" | kind=code-symbol | source=src/app/dashboard/log-deed/DeedHistoryClient.tsx:L8 | neighbors=[DeedHistoryClient.tsx]
- "log_deed_logdeedform_logdeedform": "LogDeedForm()" | kind=code-symbol | source=src/app/dashboard/log-deed/LogDeedForm.tsx:L9 | neighbors=[LogDeedForm.tsx]
- "log_deed_page_logdeedpage": "LogDeedPage()" | kind=code-symbol | source=src/app/dashboard/log-deed/page.tsx:L14 | neighbors=[page.tsx]
- "login_loginclient_loginclient": "LoginClient()" | kind=code-symbol | source=src/app/auth/login/LoginClient.tsx:L11 | neighbors=[LoginClient.tsx]
- "login_page_loginpage": "LoginPage()" | kind=code-symbol | source=src/app/auth/login/page.tsx:L5 | neighbors=[page.tsx]
- "migrations_20260523120000_event_coin_rewards": "20260523120000_event_coin_rewards.sql" | kind=code-symbol | source=supabase/migrations/20260523120000_event_coin_rewards.sql:L1 | neighbors=[fb18f2e Add division scoping, reward ed…]
- "migrations_20260523130000_role_based_access_controls": "20260523130000_role_based_access_controls.sql" | kind=code-symbol | source=supabase/migrations/20260523130000_role_based_access_controls.sql:L1 | neighbors=[fb18f2e Add division scoping, reward ed…]
- "migrations_20260523150000_add_created_at_to_profiles": "20260523150000_add_created_at_to_profiles.sql" | kind=code-symbol | source=supabase/migrations/20260523150000_add_created_at_to_profiles.sql:L1 | neighbors=[d73e533 Add auth UIs, president console…]
- "migrations_20260523160000_leaderboard_coin_read_policy": "20260523160000_leaderboard_coin_read_policy.sql" | kind=code-symbol | source=supabase/migrations/20260523160000_leaderboard_coin_read_policy.sql:L1 | neighbors=[d73e533 Add auth UIs, president console…]
- "migrations_20260523180000_performance_aggregates_and_indexes_public_get_leaderboard": "public.get_leaderboard()" | kind=code-symbol | source=supabase/migrations/20260523180000_performance_aggregates_and_indexes.sql:L23 | neighbors=[20260523180000_performance_aggregates_a…]
- "migrations_20260523180000_performance_aggregates_and_indexes_public_get_user_coin_balance": "public.get_user_coin_balance()" | kind=code-symbol | source=supabase/migrations/20260523180000_performance_aggregates_and_indexes.sql:L6 | neighbors=[20260523180000_performance_aggregates_a…]
- "migrations_202606071926_add_credited_by": "202606071926_add_credited_by.sql" | kind=code-symbol | source=supabase/migrations/202606071926_add_credited_by.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …]
- "migrations_20260608_add_division_to_events": "20260608_add_division_to_events.sql" | kind=code-symbol | source=supabase/migrations/20260608_add_division_to_events.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …]
- "migrations_20260608000000_comprehensive_updates_public_units": "public.units" | kind=code-symbol | source=supabase/migrations/20260608000000_comprehensive_updates.sql:L6 | neighbors=[20260608000000_comprehensive_updates.sql]
- "migrations_20260608000001_update_leaderboard_rpc_public_get_leaderboard": "public.get_leaderboard()" | kind=code-symbol | source=supabase/migrations/20260608000001_update_leaderboard_rpc.sql:L1 | neighbors=[20260608000001_update_leaderboard_rpc.s…]
- "migrations_20260608000002_update_leaderboard_rpc_unit_filter_public_get_leaderboard": "public.get_leaderboard()" | kind=code-symbol | source=supabase/migrations/20260608000002_update_leaderboard_rpc_unit_filter.sql:L1 | neighbors=[20260608000002_update_leaderboard_rpc_u…]
- "migrations_202606080036_event_criteria_leaves": "202606080036_event_criteria_leaves.sql" | kind=code-symbol | source=supabase/migrations/202606080036_event_criteria_leaves.sql:L1 | neighbors=[35fbf30 Introduce units and unit-based …]
- "migrations_20260608120000_sync_updated_schema_public_get_leaderboard": "public.get_leaderboard()" | kind=code-symbol | source=supabase/migrations/20260608120000_sync_updated_schema.sql:L340 | neighbors=[20260608120000_sync_updated_schema.sql]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-015.json

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
