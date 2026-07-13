# Node Description Batch 14 of 19

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

- "callback_route_get": "GET()" | kind=code-symbol | source=src/app/auth/callback/route.ts:L5 | neighbors=[route.ts]
- "check_in_route_post": "POST()" | kind=code-symbol | source=src/app/api/events/ticket/check-in/route.ts:L7 | neighbors=[route.ts]
- "claim_route_post": "POST()" | kind=code-symbol | source=src/app/api/events/ticket/claim/route.ts:L8 | neighbors=[route.ts]
- "claude_md": "Claude Configuration Reference" | kind=entity | source=CLAUDE.md | neighbors=[Developer & Agent Guide]
- "components_checkinlistener_checkinlistener": "CheckInListener()" | kind=code-symbol | source=src/components/CheckInListener.tsx:L25 | neighbors=[CheckInListener.tsx]
- "components_checkinlistener_checkinpayload": "CheckInPayload" | kind=code-symbol | source=src/components/CheckInListener.tsx:L9 | neighbors=[CheckInListener.tsx]
- "courseid_route_get": "GET()" | kind=code-symbol | source=src/app/api/progress/[userId]/[courseId]/route.ts:L6 | neighbors=[route.ts]
- "courses_actions_courseimportschema": "courseImportSchema" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L460 | neighbors=[actions.ts]
- "courses_actions_lessonimportschema": "lessonImportSchema" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L437 | neighbors=[actions.ts]
- "courses_actions_mcqimportschema": "mcqImportSchema" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L428 | neighbors=[actions.ts]
- "courses_actions_moduleimportschema": "moduleImportSchema" | kind=code-symbol | source=src/app/admin/courses/actions.ts:L449 | neighbors=[actions.ts]
- "courses_coursesadminclient_coursesadminclient": "CoursesAdminClient()" | kind=code-symbol | source=src/app/admin/courses/CoursesAdminClient.tsx:L22 | neighbors=[CoursesAdminClient.tsx]
- "courses_coursesadminclient_formfield": "FormField()" | kind=code-symbol | source=src/app/admin/courses/CoursesAdminClient.tsx:L383 | neighbors=[CoursesAdminClient.tsx]
- "courses_coursesclient_course": "Course" | kind=code-symbol | source=src/app/lms/courses/CoursesClient.tsx:L7 | neighbors=[CoursesClient.tsx]
- "courses_coursesclient_coursesclient": "CoursesClient()" | kind=code-symbol | source=src/app/lms/courses/CoursesClient.tsx:L24 | neighbors=[CoursesClient.tsx]
- "courses_coursesclient_coursesclientprops": "CoursesClientProps" | kind=code-symbol | source=src/app/lms/courses/CoursesClient.tsx:L17 | neighbors=[CoursesClient.tsx]
- "courses_loading_lmscoursesloading": "LmsCoursesLoading()" | kind=code-symbol | source=src/app/lms/courses/loading.tsx:L3 | neighbors=[loading.tsx]
- "courses_page_admincoursespage": "AdminCoursesPage()" | kind=code-symbol | source=src/app/admin/courses/page.tsx:L9 | neighbors=[page.tsx]
- "courses_page_lmscoursespage": "LmsCoursesPage()" | kind=code-symbol | source=src/app/lms/courses/page.tsx:L9 | neighbors=[page.tsx]
- "courses_route_get": "GET()" | kind=code-symbol | source=src/app/api/courses/route.ts:L8 | neighbors=[route.ts]
- "dashboard_dashboardflashcards_dashboardflashcards": "DashboardFlashcards()" | kind=code-symbol | source=src/components/dashboard/DashboardFlashcards.tsx:L42 | neighbors=[DashboardFlashcards.tsx]
- "dashboard_dashboardflashcards_dashboardflashcardsprops": "DashboardFlashcardsProps" | kind=code-symbol | source=src/components/dashboard/DashboardFlashcards.tsx:L38 | neighbors=[DashboardFlashcards.tsx]
- "dashboard_error_dashboarderror": "DashboardError()" | kind=code-symbol | source=src/app/dashboard/error.tsx:L7 | neighbors=[error.tsx]
- "dashboard_loading_dashboardloading": "DashboardLoading()" | kind=code-symbol | source=src/app/dashboard/loading.tsx:L3 | neighbors=[loading.tsx]
- "dashboard_myeventscarousel_eventcarouselitem": "EventCarouselItem" | kind=code-symbol | source=src/components/dashboard/MyEventsCarousel.tsx:L7 | neighbors=[MyEventsCarousel.tsx]
- "dashboard_myeventscarousel_myeventscarousel": "MyEventsCarousel()" | kind=code-symbol | source=src/components/dashboard/MyEventsCarousel.tsx:L20 | neighbors=[MyEventsCarousel.tsx]
- "dashboard_page_userdashboard": "UserDashboard()" | kind=code-symbol | source=src/app/dashboard/page.tsx:L20 | neighbors=[page.tsx]
- "dashboard_presidentapprovalsmanager_mappedsubmission": "MappedSubmission" | kind=code-symbol | source=src/components/dashboard/PresidentApprovalsManager.tsx:L20 | neighbors=[PresidentApprovalsManager.tsx]
- "dashboard_presidentapprovalsmanager_presidentapprovalsmanager": "PresidentApprovalsManager()" | kind=code-symbol | source=src/components/dashboard/PresidentApprovalsManager.tsx:L35 | neighbors=[PresidentApprovalsManager.tsx]
- "dashboard_presidenteventsmanager_eventitem": "EventItem" | kind=code-symbol | source=src/components/dashboard/PresidentEventsManager.tsx:L48 | neighbors=[PresidentEventsManager.tsx]
- "dashboard_presidenteventsmanager_extractaccentcolor": "extractAccentColor()" | kind=code-symbol | source=src/components/dashboard/PresidentEventsManager.tsx:L64 | neighbors=[PresidentEventsManager.tsx]
- "dashboard_presidenteventsmanager_presidenteventsmanager": "PresidentEventsManager()" | kind=code-symbol | source=src/components/dashboard/PresidentEventsManager.tsx:L132 | neighbors=[PresidentEventsManager.tsx]
- "dashboard_presidenteventsmanager_qrscannermodal": "QRScannerModal" | kind=code-symbol | source=src/components/dashboard/PresidentEventsManager.tsx:L31 | neighbors=[PresidentEventsManager.tsx]
- "dashboard_presidenteventsmanager_registration": "Registration" | kind=code-symbol | source=src/components/dashboard/PresidentEventsManager.tsx:L33 | neighbors=[PresidentEventsManager.tsx]
- "dashboard_presidentnav_presidentnav": "PresidentNav()" | kind=code-symbol | source=src/components/dashboard/PresidentNav.tsx:L12 | neighbors=[PresidentNav.tsx]
- "dashboard_presidentnav_presidentnavprops": "PresidentNavProps" | kind=code-symbol | source=src/components/dashboard/PresidentNav.tsx:L8 | neighbors=[PresidentNav.tsx]
- "dashboard_presidentnotificationsclient_presidentnotificationsclient": "PresidentNotificationsClient()" | kind=code-symbol | source=src/components/dashboard/PresidentNotificationsClient.tsx:L9 | neighbors=[PresidentNotificationsClient.tsx]
- "dashboard_presidentscannerclient_presidentscannerclient": "PresidentScannerClient()" | kind=code-symbol | source=src/components/dashboard/PresidentScannerClient.tsx:L17 | neighbors=[PresidentScannerClient.tsx]
- "dashboard_presidentscannerclient_scannerevent": "ScannerEvent" | kind=code-symbol | source=src/components/dashboard/PresidentScannerClient.tsx:L10 | neighbors=[PresidentScannerClient.tsx]
- "dashboard_presidentscannerclient_supabase": "supabase" | kind=code-symbol | source=src/components/dashboard/PresidentScannerClient.tsx:L10 | neighbors=[PresidentScannerClient.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-013.json

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
