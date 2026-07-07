# Node Description Batch 13 of 19

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

- "admin_eventdetailsclient_eventdetailsclient": "EventDetailsClient()" | kind=code-symbol | source=src/components/admin/EventDetailsClient.tsx:L130 | neighbors=[EventDetailsClient.tsx]
- "admin_eventdetailsclient_eventitem": "EventItem" | kind=code-symbol | source=src/components/admin/EventDetailsClient.tsx:L27 | neighbors=[EventDetailsClient.tsx]
- "admin_eventdetailsclient_extractaccentcolor": "extractAccentColor()" | kind=code-symbol | source=src/components/admin/EventDetailsClient.tsx:L47 | neighbors=[EventDetailsClient.tsx]
- "admin_eventdetailsclient_rosterentry": "RosterEntry" | kind=code-symbol | source=src/components/admin/EventDetailsClient.tsx:L115 | neighbors=[EventDetailsClient.tsx]
- "admin_eventsmanager_eventitem": "EventItem" | kind=code-symbol | source=src/components/admin/EventsManager.tsx:L30 | neighbors=[EventsManager.tsx]
- "admin_eventsmanager_eventsmanager": "EventsManager()" | kind=code-symbol | source=src/components/admin/EventsManager.tsx:L113 | neighbors=[EventsManager.tsx]
- "admin_eventsmanager_extractaccentcolor": "extractAccentColor()" | kind=code-symbol | source=src/components/admin/EventsManager.tsx:L45 | neighbors=[EventsManager.tsx]
- "admin_eventsmanager_registration": "Registration" | kind=code-symbol | source=src/components/admin/EventsManager.tsx:L23 | neighbors=[EventsManager.tsx]
- "admin_layout_adminlayout": "AdminLayout()" | kind=code-symbol | source=src/app/admin/layout.tsx:L12 | neighbors=[layout.tsx]
- "admin_loading_adminloading": "AdminLoading()" | kind=code-symbol | source=src/app/admin/loading.tsx:L3 | neighbors=[loading.tsx]
- "admin_page_admindashboardoverview": "AdminDashboardOverview()" | kind=code-symbol | source=src/app/admin/page.tsx:L21 | neighbors=[page.tsx]
- "admin_qrscannerwidget_barcodedetector": "BarcodeDetector" | kind=code-symbol | source=src/components/admin/QrScannerWidget.tsx:L7 | neighbors=[QrScannerWidget.tsx]
- "admin_qrscannerwidget_qrscannerwidget": "QrScannerWidget()" | kind=code-symbol | source=src/components/admin/QrScannerWidget.tsx:L20 | neighbors=[QrScannerWidget.tsx]
- "admin_qrscannerwidget_qrscannerwidgetprops": "QrScannerWidgetProps" | kind=code-symbol | source=src/components/admin/QrScannerWidget.tsx:L11 | neighbors=[QrScannerWidget.tsx]
- "admin_settingsmanager_courseitem": "CourseItem" | kind=code-symbol | source=src/components/admin/SettingsManager.tsx:L17 | neighbors=[SettingsManager.tsx]
- "admin_settingsmanager_ranktier": "RankTier" | kind=code-symbol | source=src/components/admin/SettingsManager.tsx:L24 | neighbors=[SettingsManager.tsx]
- "admin_settingsmanager_settingitem": "SettingItem" | kind=code-symbol | source=src/components/admin/SettingsManager.tsx:L11 | neighbors=[SettingsManager.tsx]
- "admin_settingsmanager_settingsmanager": "SettingsManager()" | kind=code-symbol | source=src/components/admin/SettingsManager.tsx:L30 | neighbors=[SettingsManager.tsx]
- "admin_unitsmanager_unit": "Unit" | kind=code-symbol | source=src/components/admin/UnitsManager.tsx:L19 | neighbors=[UnitsManager.tsx]
- "admin_unitsmanager_unitsmanager": "UnitsManager()" | kind=code-symbol | source=src/components/admin/UnitsManager.tsx:L31 | neighbors=[UnitsManager.tsx]
- "admin_unitsmanager_unitsmanagerprops": "UnitsManagerProps" | kind=code-symbol | source=src/components/admin/UnitsManager.tsx:L26 | neighbors=[UnitsManager.tsx]
- "admin_userdirectory_directoryuser": "DirectoryUser" | kind=code-symbol | source=src/components/admin/UserDirectory.tsx:L58 | neighbors=[UserDirectory.tsx]
- "admin_userdirectory_granularpermissions": "GranularPermissions" | kind=code-symbol | source=src/components/admin/UserDirectory.tsx:L49 | neighbors=[UserDirectory.tsx]
- "admin_userdirectory_userdirectory": "UserDirectory()" | kind=code-symbol | source=src/components/admin/UserDirectory.tsx:L73 | neighbors=[UserDirectory.tsx]
- "ai_course_prompt_md": "AI Course Prompt Guide" | kind=entity | source=AI_COURSE_PROMPT.md | neighbors=[Course JSON Import Schema Guide]
- "app_actions_allowed_mime_types": "ALLOWED_MIME_TYPES" | kind=code-symbol | source=src/app/actions.ts:L13 | neighbors=[actions.ts]
- "app_error_rooterror": "RootError()" | kind=code-symbol | source=src/app/error.tsx:L5 | neighbors=[error.tsx]
- "app_global_error_globalerror": "GlobalError()" | kind=code-symbol | source=src/app/global-error.tsx:L7 | neighbors=[global-error.tsx]
- "app_layout_metadata": "metadata" | kind=code-symbol | source=src/app/layout.tsx:L22 | neighbors=[layout.tsx]
- "app_layout_notonastaliqurdu": "notoNastaliqUrdu" | kind=code-symbol | source=src/app/layout.tsx:L9 | neighbors=[layout.tsx]
- "app_layout_poppins": "poppins" | kind=code-symbol | source=src/app/layout.tsx:L15 | neighbors=[layout.tsx]
- "app_layout_rootlayout": "RootLayout()" | kind=code-symbol | source=src/app/layout.tsx:L27 | neighbors=[layout.tsx]
- "app_page_home": "Home()" | kind=code-symbol | source=src/app/page.tsx:L3 | neighbors=[page.tsx]
- "approvals_page_adminapprovalspage": "AdminApprovalsPage()" | kind=code-symbol | source=src/app/admin/approvals/page.tsx:L9 | neighbors=[page.tsx]
- "approvals_page_presidentapprovalspage": "PresidentApprovalsPage()" | kind=code-symbol | source=src/app/dashboard/president/approvals/page.tsx:L8 | neighbors=[page.tsx]
- "auth_actions_allowed_image_types": "ALLOWED_IMAGE_TYPES" | kind=code-symbol | source=src/app/auth/actions.ts:L11 | neighbors=[actions.ts]
- "auth_code_error_page_authcodeerrorpage": "AuthCodeErrorPage()" | kind=code-symbol | source=src/app/auth/auth-code-error/page.tsx:L14 | neighbors=[page.tsx]
- "auth_code_error_page_errordetails": "ErrorDetails" | kind=code-symbol | source=src/app/auth/auth-code-error/page.tsx:L8 | neighbors=[page.tsx]
- "callback_route_get": "GET()" | kind=code-symbol | source=src/app/auth/callback/route.ts:L5 | neighbors=[route.ts]
- "check_in_route_post": "POST()" | kind=code-symbol | source=src/app/api/events/ticket/check-in/route.ts:L7 | neighbors=[route.ts]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-012.json

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
