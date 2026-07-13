# Graph Report - .  (2026-07-07)

## Corpus Check
- 174 files · ~108,215 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 728 nodes · 1906 edges · 35 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 580 · contains: 504 · imports: 272 · imports_from: 227 · reads_from: 109 · PARENT_OF: 71 · ON_BRANCH: 69 · calls: 29 · references: 26 · triggers: 16 · conceptually_related_to: 2 · semantically_similar_to: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 174 · Candidates: 419
- Excluded: 0 untracked · 28459 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `7026f95`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `createClient()` - 35 edges
2. `Button` - 24 edges
3. `requireCourseAdmin()` - 15 edges
4. `public.profiles` - 15 edges
5. `revalidateCourse()` - 14 edges
6. `Input` - 14 edges
7. `getAdminContext()` - 14 edges
8. `public.handle_course_completion()` - 13 edges
9. `public.handle_course_completion()` - 13 edges
10. `public.handle_course_completion()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AI Course Prompt Guide` --semantically_similar_to--> `Course JSON Import Schema Guide`  [INFERRED] [semantically similar]
  AI_COURSE_PROMPT.md → docs/course_import_schema.md
- `Course JSON Import Schema Guide` --conceptually_related_to--> `Developer & Agent Guide`  [INFERRED]
  docs/course_import_schema.md → AGENTS.md
- `Mobile App Integration Guide` --conceptually_related_to--> `Developer & Agent Guide`  [INFERRED]
  docs/mobile-integration-guide.md → AGENTS.md
- `Claude Configuration Reference` --references--> `Developer & Agent Guide`  [EXTRACTED]
  CLAUDE.md → AGENTS.md

## Hyperedges (group relationships)
- **Supabase Authentication Email Templates** — supabase_email_templates_change_email_html, supabase_email_templates_confirm_signup_html, supabase_email_templates_magic_link_html [INFERRED 0.90]
- **Course Creation and LMS Import Ecosystem** — ai_course_prompt_md, docs_course_import_schema_md [INFERRED 0.95]

## Communities

### Community 0 - "LMS Authoring and Course Management"
Cohesion: 0.05
Nodes (37): 02a44a2 Add bilingual (Urdu) support for courses, 670c0c3 Add server lms-data and refactor wellms, 8cc013d Add dynamic dashboard flashcards and UI refinements, 8eb7aa8 Add course rewards and server-side quiz grading, a227584 Add LMS gamification rewards & UI updates, c0dc632 Add Urdu localization to lessons and UI, d600a2b Add change-language UI and YouTube frame-src, CheckInPayload (+29 more)

### Community 1 - "Core Relational Database Schema"
Cohesion: 0.07
Nodes (18): 2c7d0ff Add admin LMS UI, admin actions, and APIs, 463284b Enforce 3-per-day deeds and add UI components, 54a4d65 Replace announcements with notifications, 986cd4b Split President console; add event & deed UIs, d17ee1f Add fluid top gradient, tweak dashboard headers, fb18f2e Add division scoping, reward edits, admin UI, PresidentNavProps, AdminRole (+10 more)

### Community 2 - "QR Ticket Scan Widgets"
Cohesion: 0.08
Nodes (49): already_awarded, auth.identities, auth.users, completed_lessons, course_reward, current_count, event_capacity, has_deed (+41 more)

### Community 3 - "Admin Auth and Client Instantiation"
Cohesion: 0.07
Nodes (17): metadata, notoNastaliqUrdu, poppins, 11b9da2 fix: make build deterministic offline and resolve admin rewards type issue, 2a2d0ed feat: add leaderboard, announcements, rewards, sql scripts, and next16 proxy compatibility fix, a4961d0 Merge pull request #1 from Youth-Development-Chapter/copilot/review-security-performance-issues, c993599 perf: fix N+1 queries, parallelize submitQuiz, add error boundaries and loading states, Env (+9 more)

### Community 4 - "Event RSVPs and Deed Logging"
Cohesion: 0.11
Nodes (24): 33ae1c0 Require single lesson per module; sync IDs, 468bb32 Add course JSON import flow and auth error page, courseImportSchema, createCourse(), createLesson(), createMcq(), createModule(), deleteCourse() (+16 more)

### Community 5 - "User Admin Directory and Roles"
Cohesion: 0.07
Nodes (22): AdminNavProps, AdminPermissions, NavItem, NavSection, ROOT_ITEMS, SECTIONS, ErrorDetails, 33d76b0 Refactor auth, storage, and admin permissions (+14 more)

### Community 6 - "Volunteer Authentication Session"
Cohesion: 0.11
Nodes (15): logDeed(), ALLOWED_IMAGE_TYPES, completeProfile(), login(), logout(), resetPassword(), signup(), updatePassword() (+7 more)

### Community 7 - "Deed Streak PostgreSQL Calculations"
Cohesion: 0.10
Nodes (6): 3f188c3 Add mobile API routes and supabase api client, 41b5a86 security: fix XSS, API ownership, crypto random, file upload, password, cookies, headers, middleware, f5b2296 Add social OAuth, deed local_date checks & UI, CustomCriteria, evaluateCriteria(), createApiClient()

### Community 8 - "Deed Approvals and Reviews"
Cohesion: 0.08
Nodes (27): adjustUserCoins(), deleteUserProfile(), flagDeedSubmission(), getUserFullHistory(), overrideDeedDecision(), updateUserAdminRole(), updateUserProfileAdmin(), MappedSubmission (+19 more)

### Community 9 - "Event Roster and Unit Admin"
Cohesion: 0.07
Nodes (17): BarcodeDetector, QrScannerWidgetProps, 35fbf30 Introduce units and unit-based admin scoping, ScannerEvent, supabase, QRScannerModalProps, has_valid_deed, public.coin_transactions (+9 more)

### Community 10 - "Dashboard Client Features"
Cohesion: 0.12
Nodes (26): already_awarded, completed_lessons, course_reward, has_deed, latest_deed_date, longest, max_earned_coins, module_idx (+18 more)

### Community 11 - "Streak Database Triggers"
Cohesion: 0.14
Nodes (12): 390bb7c perf: optimize hot queries and add cache-safe data helpers, 437a50b Changes before error encountered, 51e7e61 perf: fix tag invalidation signatures and type-safe event mappings, 90ef3d6 Merge pull request #3 from Youth-Development-Chapter/copilot/improve-site-performance, 9e0c0d2 Merge branch 'main' of https://github.com/Youth-Development-Chapter/ydc-portal, getLeaderboard(), getRecentAnnouncementsCached, getUserCoinBalance() (+4 more)

### Community 12 - "Reward Shop Redemptions"
Cohesion: 0.13
Nodes (18): archiveEvent(), bulkCheckInAttendees(), bulkProcessLeaves(), checkInTicket(), createUnit(), deleteEvent(), deleteUnit(), getEventRoster() (+10 more)

### Community 13 - "Course Completion Rewards"
Cohesion: 0.16
Nodes (19): main, 28caec0 fix(auth): resolve PKCE verifier loss on OAuth and hydration mismatch on error page, 2b98c86 Replace Coolvetica with Google Poppins font, 35b9ddf Initial commit, 430dc36 Update OnboardingClient.tsx, 44b9a2a Add relative class to book cover container, 4950c5b Revamp dashboard, wallet & LMS UI/UX, 50d072a chore: start performance optimization plan (+11 more)

### Community 14 - "Deed Approval Database Triggers"
Cohesion: 0.19
Nodes (12): updateCourseReward(), updateSystemSetting(), CourseItem, RankTier, SettingItem, Card(), CardContent(), CardDescription() (+4 more)

### Community 15 - "Course Module Database Relations"
Cohesion: 0.18
Nodes (16): auth.identities, auth.users, has_deed, latest_deed_date, longest, on_deed_change_update_streak, on_deed_status_coins, providers (+8 more)

### Community 16 - "LMS Lesson Quiz Submissions"
Cohesion: 0.16
Nodes (5): 5eaef27 Replace html5-qrcode with jsqr in lockfile, 835d3b9 Add unit roster & event visibility rules, 9be5451 Add unit scoping and eligibility checks, bda94d0 Add inspect scripts; simplify event visibility, d73e533 Add auth UIs, president console, event update

### Community 17 - "Event Scan Modals"
Cohesion: 0.18
Nodes (6): 07226c4 Add event posters, archiving & roster features, a42476a Add lifetime-based rank tiers and UI tweaks, e714bb0 Improve QR scanner, realtime check-ins & UI, DashboardFlashcardsProps, Flashcard, EventCarouselItem

### Community 18 - "System Announcements Admin"
Cohesion: 0.27
Nodes (13): already_awarded, completed_lessons, course_reward, max_earned_coins, module_idx, public.coin_transactions, public.courses, public.handle_course_completion() (+5 more)

### Community 19 - "Event Capacity Enforcement"
Cohesion: 0.24
Nodes (13): handle_deed_approval, has_deed, latest_deed_date, longest, on_deed_change_update_streak, on_deed_status_coins, public.coin_transactions, public.deed_submissions (+5 more)

### Community 20 - "Admin Dashboard Navigation Layout"
Cohesion: 0.15
Nodes (7): createEvent(), updateEventCoinReward(), EventItem, Registration, EventItem, QRScannerModal, Registration

### Community 21 - "Documentation and Email Templates"
Cohesion: 0.22
Nodes (8): ALLOWED_MIME_TYPES, claimTicket(), getEventsFromServer(), 0aff7f1 add graphify, 7026f95 update events, Event, EventsClientProps, QRCode

### Community 22 - "Admin Course Directory"
Cohesion: 0.29
Nodes (12): already_awarded, completed_lessons, course_reward, public.coin_transactions, public.courses, public.handle_course_completion(), public.lessons, public.modules (+4 more)

### Community 23 - "Leaderboard Standings"
Cohesion: 0.36
Nodes (8): a7f8177 Add email to profiles with migration & triggers, auth.users, NEW.email, on_auth_user_email_updated, on_profile_created, public.profiles, public.set_profile_email(), public.sync_profile_email()

### Community 24 - "User Profile Sync Triggers"
Cohesion: 0.42
Nodes (8): current_count, event_capacity, is_staff, on_registration_enforce_capacity, public.enforce_event_capacity(), public.event_registrations, public.events, public.profiles

### Community 25 - "User Profile Editing"
Cohesion: 0.25
Nodes (4): getRecentAnnouncements(), getUpcomingEventsForUnitCached(), ActiveAlert, NotificationItem

### Community 26 - "Event Creation Actions"
Cohesion: 0.52
Nodes (6): has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks, public.update_user_streak()

### Community 27 - "Streak and Coin Ledgers"
Cohesion: 0.40
Nodes (3): approveDeedSubmission(), rejectDeedSubmission(), MappedSubmission

### Community 28 - "User Streak Updates"
Cohesion: 0.40
Nodes (5): Developer & Agent Guide, AI Course Prompt Guide, Claude Configuration Reference, Course JSON Import Schema Guide, Mobile App Integration Guide

### Community 29 - "Community 29"
Cohesion: 0.70
Nodes (4): auth.identities, auth.users, providers, public.check_user_providers()

### Community 30 - "Community 30"
Cohesion: 1.00
Nodes (2): public.coin_transactions, public.handle_deed_coins()

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (2): Select, SelectProps

### Community 32 - "Community 32"
Cohesion: 1.00
Nodes (1): YDC Colored Logo

### Community 33 - "Community 33"
Cohesion: 1.00
Nodes (1): YDC Portal Logo Icon

### Community 34 - "Community 34"
Cohesion: 1.00
Nodes (1): YDC Transparent Logo

## Knowledge Gaps
- **108 isolated node(s):** `eslintConfig`, `securityHeaders`, `serviceWorkerHeaders`, `nextConfig`, `config` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 30`** (2 nodes): `public.coin_transactions`, `public.handle_deed_coins()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Select`, `SelectProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `YDC Colored Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `YDC Portal Logo Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `YDC Transparent Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Core Relational Database Schema` to `Reward Shop Redemptions`, `Deed Approval Database Triggers`, `Documentation and Email Templates`, `Admin Auth and Client Instantiation`, `Volunteer Authentication Session`, `Event RSVPs and Deed Logging`, `LMS Authoring and Course Management`, `Event Scan Modals`, `LMS Lesson Quiz Submissions`, `Streak Database Triggers`, `User Profile Editing`, `Event Roster and Unit Admin`, `User Admin Directory and Roles`, `Deed Streak PostgreSQL Calculations`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Button` connect `Volunteer Authentication Session` to `Deed Approvals and Reviews`, `Reward Shop Redemptions`, `Admin Dashboard Navigation Layout`, `Deed Approval Database Triggers`, `User Admin Directory and Roles`, `Event RSVPs and Deed Logging`, `Streak and Coin Ledgers`, `Documentation and Email Templates`, `LMS Authoring and Course Management`, `Event Roster and Unit Admin`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `getAdminContext()` connect `Core Relational Database Schema` to `Reward Shop Redemptions`, `Deed Approval Database Triggers`, `LMS Lesson Quiz Submissions`, `LMS Authoring and Course Management`, `User Profile Editing`, `Streak Database Triggers`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `securityHeaders`, `serviceWorkerHeaders` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LMS Authoring and Course Management` be split into smaller, more focused modules?**
  _Cohesion score 0.05336951605608322 - nodes in this community are weakly interconnected._
- **Should `Core Relational Database Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.06779661016949153 - nodes in this community are weakly interconnected._
- **Should `QR Ticket Scan Widgets` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._