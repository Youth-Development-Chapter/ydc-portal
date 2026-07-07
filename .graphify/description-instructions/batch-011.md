# Node Description Batch 12 of 19

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

- "supabase_schema_completed_lessons": "completed_lessons" | kind=code-symbol | source=supabase/schema.sql:L859 | neighbors=[schema.sql, public.handle_course_completion()]
- "supabase_schema_course_reward": "course_reward" | kind=code-symbol | source=supabase/schema.sql:L797 | neighbors=[schema.sql, public.handle_course_completion()]
- "supabase_schema_current_count": "current_count" | kind=code-symbol | source=supabase/schema.sql:L206 | neighbors=[schema.sql, public.enforce_event_capacity()]
- "supabase_schema_event_capacity": "event_capacity" | kind=code-symbol | source=supabase/schema.sql:L187 | neighbors=[schema.sql, public.enforce_event_capacity()]
- "supabase_schema_has_deed": "has_deed" | kind=code-symbol | source=supabase/schema.sql:L712 | neighbors=[schema.sql, public.update_user_streak()]
- "supabase_schema_is_staff": "is_staff" | kind=code-symbol | source=supabase/schema.sql:L200 | neighbors=[schema.sql, public.enforce_event_capacity()]
- "supabase_schema_latest_deed_date": "latest_deed_date" | kind=code-symbol | source=supabase/schema.sql:L693 | neighbors=[schema.sql, public.update_user_streak()]
- "supabase_schema_longest": "longest" | kind=code-symbol | source=supabase/schema.sql:L722 | neighbors=[schema.sql, public.update_user_streak()]
- "supabase_schema_max_earned_coins": "max_earned_coins" | kind=code-symbol | source=supabase/schema.sql:L837 | neighbors=[schema.sql, public.handle_course_completion()]
- "supabase_schema_module_idx": "module_idx" | kind=code-symbol | source=supabase/schema.sql:L805 | neighbors=[schema.sql, public.handle_course_completion()]
- "supabase_schema_new_email": "NEW.email" | kind=code-symbol | source=supabase/schema.sql:L1025 | neighbors=[schema.sql, public.set_profile_email()]
- "supabase_schema_on_auth_user_email_updated": "on_auth_user_email_updated" | kind=code-symbol | source=supabase/schema.sql:L1049 | neighbors=[schema.sql, auth.users]
- "supabase_schema_on_deed_change_update_streak": "on_deed_change_update_streak" | kind=code-symbol | source=supabase/schema.sql:L752 | neighbors=[schema.sql, public.deed_submissions]
- "supabase_schema_on_deed_status_coins": "on_deed_status_coins" | kind=code-symbol | source=supabase/schema.sql:L773 | neighbors=[schema.sql, public.deed_submissions]
- "supabase_schema_on_profile_created": "on_profile_created" | kind=code-symbol | source=supabase/schema.sql:L1032 | neighbors=[schema.sql, public.profiles]
- "supabase_schema_on_progress_completed": "on_progress_completed" | kind=code-symbol | source=supabase/schema.sql:L888 | neighbors=[schema.sql, public.user_progress]
- "supabase_schema_on_registration_enforce_capacity": "on_registration_enforce_capacity" | kind=code-symbol | source=supabase/schema.sql:L219 | neighbors=[schema.sql, public.event_registrations]
- "supabase_schema_providers": "providers" | kind=code-symbol | source=supabase/schema.sql:L1060 | neighbors=[schema.sql, public.check_user_providers()]
- "supabase_schema_public_admin_permissions": "public.admin_permissions" | kind=code-symbol | source=supabase/schema.sql:L514 | neighbors=[schema.sql, public.profiles]
- "supabase_schema_public_handle_deed_coins": "public.handle_deed_coins()" | kind=code-symbol | source=supabase/schema.sql:L757 | neighbors=[schema.sql, public.coin_transactions]
- "supabase_schema_public_mcqs": "public.mcqs" | kind=code-symbol | source=supabase/schema.sql:L431 | neighbors=[schema.sql, public.lessons]
- "supabase_schema_public_rewards": "public.rewards" | kind=code-symbol | source=supabase/schema.sql:L618 | neighbors=[schema.sql, public.reward_redemptions]
- "supabase_schema_public_sync_profile_email": "public.sync_profile_email()" | kind=code-symbol | source=supabase/schema.sql:L1038 | neighbors=[schema.sql, public.profiles]
- "supabase_schema_public_units": "public.units" | kind=code-symbol | source=supabase/schema.sql:L27 | neighbors=[schema.sql, public.announcements]
- "supabase_schema_total_lessons": "total_lessons" | kind=code-symbol | source=supabase/schema.sql:L854 | neighbors=[schema.sql, public.handle_course_completion()]
- "supabase_schema_total_modules": "total_modules" | kind=code-symbol | source=supabase/schema.sql:L801 | neighbors=[schema.sql, public.handle_course_completion()]
- "ui_card_cardfooter": "CardFooter()" | kind=code-symbol | source=src/components/ui/Card.tsx:L64 | neighbors=[page.tsx, Card.tsx]
- "wallet_loading": "loading.tsx" | kind=code-symbol | source=src/app/dashboard/wallet/loading.tsx:L1 | neighbors=[f5b2296 Add social OAuth, deed local_da…, WalletLoading()]
- "admin_adminnav_adminnav": "AdminNav()" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L131 | neighbors=[AdminNav.tsx]
- "admin_adminnav_adminnavprops": "AdminNavProps" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L29 | neighbors=[AdminNav.tsx]
- "admin_adminnav_adminpermissions": "AdminPermissions" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L20 | neighbors=[AdminNav.tsx]
- "admin_adminnav_navitem": "NavItem" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L36 | neighbors=[AdminNav.tsx]
- "admin_adminnav_navsection": "NavSection" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L45 | neighbors=[AdminNav.tsx]
- "admin_adminnav_root_items": "ROOT_ITEMS" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L121 | neighbors=[AdminNav.tsx]
- "admin_adminnav_sections": "SECTIONS" | kind=code-symbol | source=src/components/admin/AdminNav.tsx:L51 | neighbors=[AdminNav.tsx]
- "admin_approvalsqueue_approvalsqueue": "ApprovalsQueue()" | kind=code-symbol | source=src/components/admin/ApprovalsQueue.tsx:L63 | neighbors=[ApprovalsQueue.tsx]
- "admin_approvalsqueue_mappedsubmission": "MappedSubmission" | kind=code-symbol | source=src/components/admin/ApprovalsQueue.tsx:L26 | neighbors=[ApprovalsQueue.tsx]
- "admin_approvalsqueue_modaltype": "ModalType" | kind=code-symbol | source=src/components/admin/ApprovalsQueue.tsx:L61 | neighbors=[ApprovalsQueue.tsx]
- "admin_approvalsqueue_resolvedsubmission": "ResolvedSubmission" | kind=code-symbol | source=src/components/admin/ApprovalsQueue.tsx:L42 | neighbors=[ApprovalsQueue.tsx]
- "admin_error_adminerror": "AdminError()" | kind=code-symbol | source=src/app/admin/error.tsx:L7 | neighbors=[error.tsx]

## Instructions

Write a single JSON object mapping each node id to a one-sentence description
to: D:\Coding Practices\ydc\ydc-portal\.graphify\description-instructions\batch-011.json

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
