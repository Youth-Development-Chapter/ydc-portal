# Node Description Batch 18 of 19

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

- "scanner_page_presidentscannerpage": "PresidentScannerPage()" | kind=code-symbol | source=src/app/dashboard/president/scanner/page.tsx:L9 | neighbors=[page.tsx]
- "seed_route_get": "GET()" | kind=code-symbol | source=src/app/api/lms/seed/route.ts:L7 | neighbors=[route.ts]
- "settings_actions_allowed_image_types": "ALLOWED_IMAGE_TYPES" | kind=code-symbol | source=src/app/dashboard/settings/actions.ts:L8 | neighbors=[actions.ts]
- "settings_actions_updateprofileresult": "UpdateProfileResult" | kind=code-symbol | source=src/app/dashboard/settings/actions.ts:L17 | neighbors=[actions.ts]
- "settings_page_adminsettingspage": "AdminSettingsPage()" | kind=code-symbol | source=src/app/admin/settings/page.tsx:L9 | neighbors=[page.tsx]
- "settings_page_settingspage": "SettingsPage()" | kind=code-symbol | source=src/app/dashboard/settings/page.tsx:L8 | neighbors=[page.tsx]
- "settings_settingsform_profile": "Profile" | kind=code-symbol | source=src/app/dashboard/settings/SettingsForm.tsx:L9 | neighbors=[SettingsForm.tsx]
- "settings_settingsform_settingsform": "SettingsForm()" | kind=code-symbol | source=src/app/dashboard/settings/SettingsForm.tsx:L26 | neighbors=[SettingsForm.tsx]
- "settings_settingsform_unit": "Unit" | kind=code-symbol | source=src/app/dashboard/settings/SettingsForm.tsx:L20 | neighbors=[SettingsForm.tsx]
- "showcase_page_showcasepage": "ShowcasePage()" | kind=code-symbol | source=src/app/showcase/page.tsx:L23 | neighbors=[page.tsx]
- "signup_page_signuppage": "SignupPage()" | kind=code-symbol | source=src/app/auth/signup/page.tsx:L5 | neighbors=[page.tsx]
- "signup_signupclient_signupclient": "SignupClient()" | kind=code-symbol | source=src/app/auth/signup/SignupClient.tsx:L14 | neighbors=[SignupClient.tsx]
- "src_proxy_config": "config" | kind=code-symbol | source=src/proxy.ts:L8 | neighbors=[proxy.ts]
- "src_proxy_proxy": "proxy()" | kind=code-symbol | source=src/proxy.ts:L4 | neighbors=[proxy.ts]
- "submit_route_post": "POST()" | kind=code-symbol | source=src/app/api/lms/quiz/submit/route.ts:L6 | neighbors=[route.ts]
- "supabase_schema_public_get_leaderboard": "public.get_leaderboard()" | kind=code-symbol | source=supabase/schema.sql:L989 | neighbors=[schema.sql]
- "supabase_schema_public_get_user_coin_balance": "public.get_user_coin_balance()" | kind=code-symbol | source=supabase/schema.sql:L975 | neighbors=[schema.sql]
- "supabase_schema_public_system_settings": "public.system_settings" | kind=code-symbol | source=supabase/schema.sql:L320 | neighbors=[schema.sql]
- "supabase_schema_public_trigger_update_streak": "public.trigger_update_streak()" | kind=code-symbol | source=supabase/schema.sql:L735 | neighbors=[schema.sql]
- "ui_badge_badgeprops": "BadgeProps" | kind=code-symbol | source=src/components/ui/Badge.tsx:L5 | neighbors=[Badge.tsx]
- "ui_button_buttonprops": "ButtonProps" | kind=code-symbol | source=src/components/ui/Button.tsx:L5 | neighbors=[Button.tsx]
- "ui_card_cardprops": "CardProps" | kind=code-symbol | source=src/components/ui/Card.tsx:L5 | neighbors=[Card.tsx]
- "ui_input_inputprops": "InputProps" | kind=code-symbol | source=src/components/ui/Input.tsx:L5 | neighbors=[Input.tsx]
- "ui_localtime_localtime": "LocalTime()" | kind=code-symbol | source=src/components/ui/LocalTime.tsx:L10 | neighbors=[LocalTime.tsx]
- "ui_localtime_localtimeprops": "LocalTimeProps" | kind=code-symbol | source=src/components/ui/LocalTime.tsx:L5 | neighbors=[LocalTime.tsx]
- "ui_pageheader_pageheader": "PageHeader()" | kind=code-symbol | source=src/components/ui/PageHeader.tsx:L24 | neighbors=[PageHeader.tsx]
- "ui_pageheader_pageheaderprops": "PageHeaderProps" | kind=code-symbol | source=src/components/ui/PageHeader.tsx:L8 | neighbors=[PageHeader.tsx]
- "ui_select_selectprops": "SelectProps" | kind=code-symbol | source=src/components/ui/Select.tsx:L6 | neighbors=[Select.tsx]
- "ui_switch_switchprops": "SwitchProps" | kind=code-symbol | source=src/components/ui/Switch.tsx:L5 | neighbors=[Switch.tsx]
- "ui_tabs_tabscontentprops": "TabsContentProps" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L113 | neighbors=[Tabs.tsx]
- "ui_tabs_tabscontext": "TabsContext" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L10 | neighbors=[Tabs.tsx]
- "ui_tabs_tabscontextprops": "TabsContextProps" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L5 | neighbors=[Tabs.tsx]
- "ui_tabs_tabslistprops": "TabsListProps" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L47 | neighbors=[Tabs.tsx]
- "ui_tabs_tabsprops": "TabsProps" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L12 | neighbors=[Tabs.tsx]
- "ui_tabs_tabstriggerprops": "TabsTriggerProps" | kind=code-symbol | source=src/components/ui/Tabs.tsx:L66 | neighbors=[Tabs.tsx]
- "ui_weeklyactivity_daycell": "DayCell" | kind=code-symbol | source=src/components/ui/WeeklyActivity.tsx:L8 | neighbors=[WeeklyActivity.tsx]
- "ui_weeklyactivity_deedsubmission": "DeedSubmission" | kind=code-symbol | source=src/components/ui/WeeklyActivity.tsx:L6 | neighbors=[WeeklyActivity.tsx]
- "ui_weeklyactivity_weeklyactivity": "WeeklyActivity()" | kind=code-symbol | source=src/components/ui/WeeklyActivity.tsx:L17 | neighbors=[WeeklyActivity.tsx]
- "units_page_adminunitspage": "AdminUnitsPage()" | kind=code-symbol | source=src/app/admin/units/page.tsx:L9 | neighbors=[page.tsx]
- "users_page_adminuserspage": "AdminUsersPage()" | kind=code-symbol | source=src/app/admin/users/page.tsx:L9 | neighbors=[page.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-017.json

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
