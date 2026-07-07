# Graph Report - .  (2026-07-07)

## Corpus Check
- 170 files · ~106,648 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 657 nodes · 1186 edges · 42 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output
- Edge kinds: contains: 503 · imports: 270 · imports_from: 225 · reads_from: 109 · calls: 29 · references: 26 · triggers: 16 · conceptually_related_to: 5 · semantically_similar_to: 3


## Input Scope
- Requested: all
- Resolved: all (source: configured-default)
- Included files: 170 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 1 sensitive · 0 missing committed
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
- `Change Email HTML Template` --conceptually_related_to--> `Developer & Agent Guide`  [INFERRED]
  supabase/email-templates/change-email.html → AGENTS.md
- `Magic Link HTML Template` --conceptually_related_to--> `Developer & Agent Guide`  [INFERRED]
  supabase/email-templates/magic-link.html → AGENTS.md

## Hyperedges (group relationships)
- **Supabase Authentication Email Templates** — supabase_email_templates_change_email_html, supabase_email_templates_confirm_signup_html, supabase_email_templates_magic_link_html [INFERRED 0.90]
- **Course Creation and LMS Import Ecosystem** — ai_course_prompt_md, docs_course_import_schema_md [INFERRED 0.95]

## Communities

### Community 0 - "LMS Authoring and Course Management"
Cohesion: 0.07
Nodes (29): courseImportSchema, createCourse(), createLesson(), createMcq(), createModule(), deleteCourse(), deleteLesson(), deleteMcq() (+21 more)

### Community 1 - "Core Relational Database Schema"
Cohesion: 0.08
Nodes (49): already_awarded, auth.identities, auth.users, completed_lessons, course_reward, current_count, event_capacity, has_deed (+41 more)

### Community 2 - "QR Ticket Scan Widgets"
Cohesion: 0.07
Nodes (21): BarcodeDetector, QrScannerWidgetProps, metadata, notoNastaliqUrdu, poppins, CheckInPayload, ScannerEvent, supabase (+13 more)

### Community 3 - "Admin Auth and Client Instantiation"
Cohesion: 0.09
Nodes (4): PresidentNavProps, AdminRole, getAdminContext(), createClient()

### Community 4 - "Event RSVPs and Deed Logging"
Cohesion: 0.08
Nodes (10): ALLOWED_MIME_TYPES, claimTicket(), getEventsFromServer(), logDeed(), Event, EventsClientProps, QRCode, CustomCriteria (+2 more)

### Community 5 - "User Admin Directory and Roles"
Cohesion: 0.10
Nodes (23): adjustUserCoins(), deleteUserProfile(), getUserFullHistory(), updateUserAdminRole(), updateUserProfileAdmin(), DirectoryUser, GranularPermissions, Badge() (+15 more)

### Community 6 - "Volunteer Authentication Session"
Cohesion: 0.12
Nodes (13): ALLOWED_IMAGE_TYPES, completeProfile(), login(), logout(), resetPassword(), signup(), updatePassword(), ErrorDetails (+5 more)

### Community 7 - "Deed Streak PostgreSQL Calculations"
Cohesion: 0.12
Nodes (26): already_awarded, completed_lessons, course_reward, has_deed, latest_deed_date, longest, max_earned_coins, module_idx (+18 more)

### Community 8 - "Deed Approvals and Reviews"
Cohesion: 0.11
Nodes (20): approveDeedSubmission(), flagDeedSubmission(), overrideDeedDecision(), rejectDeedSubmission(), updateCourseReward(), updateSystemSetting(), MappedSubmission, ModalType (+12 more)

### Community 9 - "Event Roster and Unit Admin"
Cohesion: 0.13
Nodes (18): archiveEvent(), bulkCheckInAttendees(), bulkProcessLeaves(), checkInTicket(), createUnit(), deleteEvent(), deleteUnit(), getEventRoster() (+10 more)

### Community 10 - "Dashboard Client Features"
Cohesion: 0.11
Nodes (10): DashboardFlashcardsProps, Flashcard, EventCarouselItem, getRecentAnnouncements(), getRecentAnnouncementsCached, getUpcomingEventsForUnitCached(), getUserCoinBalance(), LeaderboardEntry (+2 more)

### Community 11 - "Streak Database Triggers"
Cohesion: 0.18
Nodes (16): auth.identities, auth.users, has_deed, latest_deed_date, longest, on_deed_change_update_streak, on_deed_status_coins, providers (+8 more)

### Community 12 - "Reward Shop Redemptions"
Cohesion: 0.17
Nodes (8): createReward(), fulfilRedemption(), redeemReward(), rejectRedemption(), toggleRewardActive(), PendingRedemption, Reward, Reward

### Community 13 - "Course Completion Rewards"
Cohesion: 0.27
Nodes (13): already_awarded, completed_lessons, course_reward, max_earned_coins, module_idx, public.coin_transactions, public.courses, public.handle_course_completion() (+5 more)

### Community 14 - "Deed Approval Database Triggers"
Cohesion: 0.24
Nodes (13): handle_deed_approval, has_deed, latest_deed_date, longest, on_deed_change_update_streak, on_deed_status_coins, public.coin_transactions, public.deed_submissions (+5 more)

### Community 15 - "Course Module Database Relations"
Cohesion: 0.29
Nodes (12): already_awarded, completed_lessons, course_reward, public.coin_transactions, public.courses, public.handle_course_completion(), public.lessons, public.modules (+4 more)

### Community 16 - "LMS Lesson Quiz Submissions"
Cohesion: 0.24
Nodes (6): submitQuiz(), SubmitQuizError, SubmitQuizResult, LearnerMCQ, Lesson, ViewState

### Community 17 - "Event Scan Modals"
Cohesion: 0.22
Nodes (4): EventItem, QRScannerModal, Registration, QRScannerModalProps

### Community 18 - "System Announcements Admin"
Cohesion: 0.39
Nodes (4): createAnnouncement(), deleteAnnouncement(), togglePinAnnouncement(), Announcement

### Community 19 - "Event Capacity Enforcement"
Cohesion: 0.42
Nodes (8): current_count, event_capacity, is_staff, on_registration_enforce_capacity, public.enforce_event_capacity(), public.event_registrations, public.events, public.profiles

### Community 20 - "Admin Dashboard Navigation Layout"
Cohesion: 0.25
Nodes (6): AdminNavProps, AdminPermissions, NavItem, NavSection, ROOT_ITEMS, SECTIONS

### Community 21 - "Documentation and Email Templates"
Cohesion: 0.32
Nodes (8): Developer & Agent Guide, AI Course Prompt Guide, Claude Configuration Reference, Course JSON Import Schema Guide, Mobile App Integration Guide, Change Email HTML Template, Confirm Signup HTML Template, Magic Link HTML Template

### Community 22 - "Admin Course Directory"
Cohesion: 0.25
Nodes (3): CourseRow, hasAdminPermission(), getCourses()

### Community 23 - "Leaderboard Standings"
Cohesion: 0.25
Nodes (2): getLeaderboard(), PageHeaderProps

### Community 24 - "User Profile Sync Triggers"
Cohesion: 0.43
Nodes (7): auth.users, NEW.email, on_auth_user_email_updated, on_profile_created, public.profiles, public.set_profile_email(), public.sync_profile_email()

### Community 25 - "User Profile Editing"
Cohesion: 0.29
Nodes (5): ALLOWED_IMAGE_TYPES, updateProfile(), UpdateProfileResult, Profile, Unit

### Community 26 - "Event Creation Actions"
Cohesion: 0.29
Nodes (4): createEvent(), updateEventCoinReward(), EventItem, Registration

### Community 27 - "Streak and Coin Ledgers"
Cohesion: 0.52
Nodes (6): has_valid_deed, public.coin_transactions, public.deed_submissions, public.handle_deed_approval(), public.streaks, user_streak_record

### Community 28 - "User Streak Updates"
Cohesion: 0.52
Nodes (6): has_deed, latest_deed_date, longest, public.deed_submissions, public.streaks, public.update_user_streak()

### Community 29 - "Auth Provider Check"
Cohesion: 0.70
Nodes (4): auth.identities, auth.users, providers, public.check_user_providers()

### Community 30 - "Session Middleware"
Cohesion: 0.50
Nodes (2): config, updateSession()

### Community 31 - "Courses View"
Cohesion: 0.50
Nodes (2): Course, CoursesClientProps

### Community 32 - "Environment Validation"
Cohesion: 0.50
Nodes (2): Env, envSchema

### Community 33 - "Next Config Headers"
Cohesion: 0.50
Nodes (3): nextConfig, securityHeaders, serviceWorkerHeaders

### Community 34 - "Weekly Activity Cells"
Cohesion: 0.50
Nodes (2): DayCell, DeedSubmission

### Community 36 - "Deed Coins Calculations"
Cohesion: 1.00
Nodes (2): public.coin_transactions, public.handle_deed_coins()

### Community 37 - "Local Time UI"
Cohesion: 0.67
Nodes (1): LocalTimeProps

### Community 47 - "ESLint Config"
Cohesion: 1.00
Nodes (1): eslintConfig

### Community 53 - "Next Config"
Cohesion: 1.00
Nodes (1): config

### Community 57 - "YDC Logo Assets"
Cohesion: 1.00
Nodes (1): YDC Colored Logo

### Community 67 - "YDC Portal Logo Icon"
Cohesion: 1.00
Nodes (1): YDC Portal Logo Icon

### Community 68 - "YDC Transparent Logo"
Cohesion: 1.00
Nodes (1): YDC Transparent Logo

## Knowledge Gaps
- **108 isolated node(s):** `eslintConfig`, `securityHeaders`, `serviceWorkerHeaders`, `nextConfig`, `config` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Leaderboard Standings`** (2 nodes): `getLeaderboard()`, `PageHeaderProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Middleware`** (2 nodes): `config`, `updateSession()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Courses View`** (2 nodes): `Course`, `CoursesClientProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Environment Validation`** (2 nodes): `Env`, `envSchema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Weekly Activity Cells`** (2 nodes): `DayCell`, `DeedSubmission`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deed Coins Calculations`** (2 nodes): `public.coin_transactions`, `public.handle_deed_coins()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Local Time UI`** (1 nodes): `LocalTimeProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslintConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Config`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `YDC Logo Assets`** (1 nodes): `YDC Colored Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `YDC Portal Logo Icon`** (1 nodes): `YDC Portal Logo Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `YDC Transparent Logo`** (1 nodes): `YDC Transparent Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Admin Auth and Client Instantiation` to `Event Roster and Unit Admin`, `Deed Approvals and Reviews`, `Event RSVPs and Deed Logging`, `QR Ticket Scan Widgets`, `Volunteer Authentication Session`, `LMS Authoring and Course Management`, `Admin Course Directory`, `Dashboard Client Features`, `Leaderboard Standings`, `LMS Lesson Quiz Submissions`, `System Announcements Admin`, `Reward Shop Redemptions`, `User Profile Editing`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `Button` connect `Volunteer Authentication Session` to `Deed Approvals and Reviews`, `Event Roster and Unit Admin`, `Event Creation Actions`, `User Admin Directory and Roles`, `LMS Authoring and Course Management`, `Event Scan Modals`, `Event RSVPs and Deed Logging`, `LMS Lesson Quiz Submissions`, `User Profile Editing`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `getAdminContext()` connect `Admin Auth and Client Instantiation` to `Event Roster and Unit Admin`, `Deed Approvals and Reviews`, `LMS Authoring and Course Management`, `Dashboard Client Features`, `Reward Shop Redemptions`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `securityHeaders`, `serviceWorkerHeaders` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LMS Authoring and Course Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._
- **Should `Core Relational Database Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._
- **Should `QR Ticket Scan Widgets` be split into smaller, more focused modules?**
  _Cohesion score 0.06747638326585695 - nodes in this community are weakly interconnected._