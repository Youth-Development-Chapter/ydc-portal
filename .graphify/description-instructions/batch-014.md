# Node Description Batch 15 of 19

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

- "dashboard_qrscannermodal_qrscannermodal": "QRScannerModal()" | kind=code-symbol | source=src/components/dashboard/QRScannerModal.tsx:L12 | neighbors=[QRScannerModal.tsx]
- "dashboard_qrscannermodal_qrscannermodalprops": "QRScannerModalProps" | kind=code-symbol | source=src/components/dashboard/QRScannerModal.tsx:L7 | neighbors=[QRScannerModal.tsx]
- "docs_mobile_integration_guide_md": "Mobile App Integration Guide" | kind=entity | source=docs/mobile-integration-guide.md | neighbors=[Developer & Agent Guide]
- "eslint_config_eslintconfig": "eslintConfig" | kind=code-symbol | source=eslint.config.mjs:L5 | neighbors=[eslint.config.mjs]
- "events_eventsclient_event": "Event" | kind=code-symbol | source=src/app/events/EventsClient.tsx:L18 | neighbors=[EventsClient.tsx]
- "events_eventsclient_eventsclient": "EventsClient()" | kind=code-symbol | source=src/app/events/EventsClient.tsx:L48 | neighbors=[EventsClient.tsx]
- "events_eventsclient_eventsclientprops": "EventsClientProps" | kind=code-symbol | source=src/app/events/EventsClient.tsx:L33 | neighbors=[EventsClient.tsx]
- "events_eventsclient_qrcode": "QRCode" | kind=code-symbol | source=src/app/events/EventsClient.tsx:L16 | neighbors=[EventsClient.tsx]
- "events_loading_eventsloading": "EventsLoading()" | kind=code-symbol | source=src/app/events/loading.tsx:L3 | neighbors=[loading.tsx]
- "events_page_admineventspage": "AdminEventsPage()" | kind=code-symbol | source=src/app/admin/events/page.tsx:L9 | neighbors=[page.tsx]
- "events_page_eventspage": "EventsPage()" | kind=code-symbol | source=src/app/events/page.tsx:L8 | neighbors=[page.tsx]
- "events_page_presidenteventspage": "PresidentEventsPage()" | kind=code-symbol | source=src/app/dashboard/president/events/page.tsx:L8 | neighbors=[page.tsx]
- "forgot_password_page_forgotpasswordpage": "ForgotPasswordPage()" | kind=code-symbol | source=src/app/auth/forgot-password/page.tsx:L10 | neighbors=[page.tsx]
- "id_coursebuilder_coursebuilder": "CourseBuilder()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L68 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_courseinfoeditor": "CourseInfoEditor()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L137 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_field": "Field()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L1354 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_lessoncard": "LessonCard()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L727 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_lessonseditor": "LessonsEditor()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L606 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_mcqcard": "McqCard()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L1034 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_mcqform": "McqForm()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L1181 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_mcqseditor": "McqsEditor()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L920 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_modulecard": "ModuleCard()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L458 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_moduleseditor": "ModulesEditor()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L323 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_tab": "Tab" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L66 | neighbors=[CourseBuilder.tsx]
- "id_coursebuilder_tabbutton": "TabButton()" | kind=code-symbol | source=src/app/admin/courses/[id]/CourseBuilder.tsx:L111 | neighbors=[CourseBuilder.tsx]
- "id_page_admincourseeditpage": "AdminCourseEditPage()" | kind=code-symbol | source=src/app/admin/courses/[id]/page.tsx:L15 | neighbors=[page.tsx]
- "id_page_admineventdetailspage": "AdminEventDetailsPage()" | kind=code-symbol | source=src/app/admin/events/[id]/page.tsx:L9 | neighbors=[page.tsx]
- "id_page_coursedetailspage": "CourseDetailsPage()" | kind=code-symbol | source=src/app/lms/courses/[id]/page.tsx:L13 | neighbors=[page.tsx]
- "id_page_lessonviewerpage": "LessonViewerPage()" | kind=code-symbol | source=src/app/lms/lessons/[id]/page.tsx:L10 | neighbors=[page.tsx]
- "id_page_presidenteventdetailspage": "PresidentEventDetailsPage()" | kind=code-symbol | source=src/app/dashboard/president/events/[id]/page.tsx:L8 | neighbors=[page.tsx]
- "id_route_get": "GET()" | kind=code-symbol | source=src/app/api/lessons/[id]/route.ts:L6 | neighbors=[route.ts]
- "leaderboard_page_leaderboardpage": "LeaderboardPage()" | kind=code-symbol | source=src/app/leaderboard/page.tsx:L11 | neighbors=[page.tsx]
- "leave_route_delete": "DELETE()" | kind=code-symbol | source=src/app/api/events/leave/route.ts:L78 | neighbors=[route.ts]
- "leave_route_post": "POST()" | kind=code-symbol | source=src/app/api/events/leave/route.ts:L6 | neighbors=[route.ts]
- "lessons_actions_submitquizerror": "SubmitQuizError" | kind=code-symbol | source=src/app/lms/lessons/actions.ts:L26 | neighbors=[actions.ts]
- "lib_admin_adminrole": "AdminRole" | kind=code-symbol | source=src/lib/admin.ts:L12 | neighbors=[admin.ts]
- "lib_admin_isadminrole": "isAdminRole()" | kind=code-symbol | source=src/lib/admin.ts:L17 | neighbors=[admin.ts]
- "lib_criteria_customcriteria": "CustomCriteria" | kind=code-symbol | source=src/lib/criteria.ts:L3 | neighbors=[criteria.ts]
- "lib_env_env": "Env" | kind=code-symbol | source=src/lib/env.ts:L24 | neighbors=[env.ts]
- "lib_env_envschema": "envSchema" | kind=code-symbol | source=src/lib/env.ts:L3 | neighbors=[env.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-014.json

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
