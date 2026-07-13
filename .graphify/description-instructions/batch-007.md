# Node Description Batch 8 of 19

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

- "notifications_actions_createannouncement": "createAnnouncement()" | kind=code-symbol | source=src/app/admin/notifications/actions.ts:L7 | neighbors=[PresidentNotificationsClient.tsx, actions.ts, NotificationsManager.tsx]
- "notifications_actions_deleteannouncement": "deleteAnnouncement()" | kind=code-symbol | source=src/app/admin/notifications/actions.ts:L55 | neighbors=[PresidentNotificationsClient.tsx, actions.ts, NotificationsManager.tsx]
- "notifications_actions_togglepinannouncement": "togglePinAnnouncement()" | kind=code-symbol | source=src/app/admin/notifications/actions.ts:L90 | neighbors=[PresidentNotificationsClient.tsx, actions.ts, NotificationsManager.tsx]
- "supabase_schema_public_announcements": "public.announcements" | kind=code-symbol | source=supabase/schema.sql:L546 | neighbors=[schema.sql, public.profiles, public.units]
- "supabase_schema_public_events": "public.events" | kind=code-symbol | source=supabase/schema.sql:L101 | neighbors=[schema.sql, public.enforce_event_capacity(), public.event_registrations]
- "supabase_schema_public_quiz_attempts": "public.quiz_attempts" | kind=code-symbol | source=supabase/schema.sql:L580 | neighbors=[schema.sql, public.lessons, public.profiles]
- "supabase_schema_public_reward_redemptions": "public.reward_redemptions" | kind=code-symbol | source=supabase/schema.sql:L648 | neighbors=[schema.sql, public.profiles, public.rewards]
- "supabase_schema_public_set_profile_email": "public.set_profile_email()" | kind=code-symbol | source=supabase/schema.sql:L1021 | neighbors=[schema.sql, auth.users, NEW.email]
- "supabase_schema_public_streaks": "public.streaks" | kind=code-symbol | source=supabase/schema.sql:L264 | neighbors=[schema.sql, public.profiles, public.update_user_streak()]
- "supabase_schema_public_user_course_settings": "public.user_course_settings" | kind=code-symbol | source=supabase/schema.sql:L469 | neighbors=[schema.sql, public.courses, public.profiles]
- "ui_badge_badge": "Badge()" | kind=code-symbol | source=src/components/ui/Badge.tsx:L9 | neighbors=[UserDirectory.tsx, page.tsx, Badge.tsx]
- "ui_card_carddescription": "CardDescription()" | kind=code-symbol | source=src/components/ui/Card.tsx:L48 | neighbors=[page.tsx, page.tsx, Card.tsx]
- "ui_switch_switch": "Switch()" | kind=code-symbol | source=src/components/ui/Switch.tsx:L15 | neighbors=[UserDirectory.tsx, page.tsx, Switch.tsx]
- "verify_route": "route.ts" | kind=code-symbol | source=src/app/auth/v1/verify/route.ts:L1 | neighbors=[33d76b0 Refactor auth, storage, and adm…, 37e3b0a Improve auth error UI, callback…, GET()]
- "admin_actions_adjustusercoins": "adjustUserCoins()" | kind=code-symbol | source=src/app/admin/actions.ts:L196 | neighbors=[actions.ts, UserDirectory.tsx]
- "admin_actions_archiveevent": "archiveEvent()" | kind=code-symbol | source=src/app/admin/actions.ts:L892 | neighbors=[actions.ts, EventDetailsClient.tsx]
- "admin_actions_bulkprocessleaves": "bulkProcessLeaves()" | kind=code-symbol | source=src/app/admin/actions.ts:L1895 | neighbors=[actions.ts, EventDetailsClient.tsx]
- "admin_actions_createunit": "createUnit()" | kind=code-symbol | source=src/app/admin/actions.ts:L1255 | neighbors=[actions.ts, UnitsManager.tsx]
- "admin_actions_deleteevent": "deleteEvent()" | kind=code-symbol | source=src/app/admin/actions.ts:L944 | neighbors=[actions.ts, EventDetailsClient.tsx]
- "admin_actions_deleteunit": "deleteUnit()" | kind=code-symbol | source=src/app/admin/actions.ts:L1320 | neighbors=[actions.ts, UnitsManager.tsx]
- "admin_actions_deleteuserprofile": "deleteUserProfile()" | kind=code-symbol | source=src/app/admin/actions.ts:L1185 | neighbors=[actions.ts, UserDirectory.tsx]
- "admin_actions_flagdeedsubmission": "flagDeedSubmission()" | kind=code-symbol | source=src/app/admin/actions.ts:L1448 | neighbors=[actions.ts, ApprovalsQueue.tsx]
- "admin_actions_geteventroster": "getEventRoster()" | kind=code-symbol | source=src/app/admin/actions.ts:L1589 | neighbors=[actions.ts, EventDetailsClient.tsx]
- "admin_actions_getpaginatedusers": "getPaginatedUsers()" | kind=code-symbol | source=src/app/admin/actions.ts:L1347 | neighbors=[actions.ts, page.tsx]
- "admin_actions_getuserfullhistory": "getUserFullHistory()" | kind=code-symbol | source=src/app/admin/actions.ts:L996 | neighbors=[actions.ts, UserDirectory.tsx]
- "admin_actions_overridedeeddecision": "overrideDeedDecision()" | kind=code-symbol | source=src/app/admin/actions.ts:L1512 | neighbors=[actions.ts, ApprovalsQueue.tsx]
- "admin_actions_processeventleave": "processEventLeave()" | kind=code-symbol | source=src/app/admin/actions.ts:L1424 | neighbors=[actions.ts, EventDetailsClient.tsx]
- "admin_actions_togglemanualattendance": "toggleManualAttendance()" | kind=code-symbol | source=src/app/admin/actions.ts:L655 | neighbors=[actions.ts, EventDetailsClient.tsx]
- "admin_actions_updateeventcoinreward": "updateEventCoinReward()" | kind=code-symbol | source=src/app/admin/actions.ts:L749 | neighbors=[actions.ts, EventsManager.tsx]
- "admin_actions_updatesystemsetting": "updateSystemSetting()" | kind=code-symbol | source=src/app/admin/actions.ts:L141 | neighbors=[actions.ts, SettingsManager.tsx]
- "admin_actions_updateunit": "updateUnit()" | kind=code-symbol | source=src/app/admin/actions.ts:L1287 | neighbors=[actions.ts, UnitsManager.tsx]
- "admin_actions_updateuseradminrole": "updateUserAdminRole()" | kind=code-symbol | source=src/app/admin/actions.ts:L232 | neighbors=[actions.ts, UserDirectory.tsx]
- "admin_actions_updateuserprofileadmin": "updateUserProfileAdmin()" | kind=code-symbol | source=src/app/admin/actions.ts:L1105 | neighbors=[actions.ts, UserDirectory.tsx]
- "app_actions_geteventsfromserver": "getEventsFromServer()" | kind=code-symbol | source=src/app/actions.ts:L211 | neighbors=[actions.ts, EventsClient.tsx]
- "app_actions_logdeed": "logDeed()" | kind=code-symbol | source=src/app/actions.ts:L108 | neighbors=[actions.ts, LogDeedForm.tsx]
- "auth_actions_completeprofile": "completeProfile()" | kind=code-symbol | source=src/app/auth/actions.ts:L54 | neighbors=[actions.ts, OnboardingClient.tsx]
- "auth_actions_login": "login()" | kind=code-symbol | source=src/app/auth/actions.ts:L138 | neighbors=[actions.ts, LoginClient.tsx]
- "auth_actions_logout": "logout()" | kind=code-symbol | source=src/app/auth/actions.ts:L241 | neighbors=[actions.ts, page.tsx]
- "auth_actions_resetpassword": "resetPassword()" | kind=code-symbol | source=src/app/auth/actions.ts:L179 | neighbors=[actions.ts, page.tsx]
- "auth_actions_signup": "signup()" | kind=code-symbol | source=src/app/auth/actions.ts:L20 | neighbors=[actions.ts, SignupClient.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-007.json

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
