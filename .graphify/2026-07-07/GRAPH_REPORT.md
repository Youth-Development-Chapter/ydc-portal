# Graph Report - .  (2026-07-07)

## Corpus Check
- 199 files · ~149,081 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 724 nodes · 1887 edges · 37 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 568 · contains: 503 · imports: 270 · imports_from: 225 · reads_from: 109 · PARENT_OF: 70 · ON_BRANCH: 68 · calls: 29 · references: 26 · triggers: 16 · conceptually_related_to: 2 · semantically_similar_to: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 199 · Candidates: 417
- Excluded: 6 untracked · 27779 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `0aff7f1`
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

### Community 3 - "Admin Auth and Client Instantiation"
Cohesion: 0.05
Nodes (27): eslintConfig, securityHeaders, serviceWorkerHeaders, nextConfig, config, ALLOWED_IMAGE_TYPES, signup(), login() (+19 more)

### Community 21 - "Documentation and Email Templates"
Cohesion: 0.24
Nodes (7): ALLOWED_MIME_TYPES, claimTicket(), getEventsFromServer(), QRCode, Event, EventsClientProps, 0aff7f1 add graphify

### Community 9 - "Event Roster and Unit Admin"
Cohesion: 0.11
Nodes (13): logDeed(), createEvent(), updateEventCoinReward(), updatePassword(), Registration, EventItem, QRScannerModal, Registration (+5 more)

### Community 10 - "Dashboard Client Features"
Cohesion: 0.13
Nodes (18): checkInTicket(), toggleManualAttendance(), updateEvent(), archiveEvent(), deleteEvent(), createUnit(), updateUnit(), deleteUnit() (+10 more)

### Community 30 - "Community 30"
Cohesion: 0.40
Nodes (3): approveDeedSubmission(), rejectDeedSubmission(), MappedSubmission

### Community 12 - "Reward Shop Redemptions"
Cohesion: 0.19
Nodes (12): updateSystemSetting(), updateCourseReward(), SettingItem, CourseItem, RankTier, CardProps, Card(), CardHeader() (+4 more)

### Community 16 - "LMS Lesson Quiz Submissions"
Cohesion: 0.16
Nodes (12): adjustUserCoins(), updateUserAdminRole(), getUserFullHistory(), updateUserProfileAdmin(), deleteUserProfile(), GranularPermissions, DirectoryUser, BadgeProps (+4 more)

### Community 14 - "Deed Approval Database Triggers"
Cohesion: 0.14
Nodes (15): flagDeedSubmission(), overrideDeedDecision(), MappedSubmission, ResolvedSubmission, ModalType, TabsContextProps, TabsContext, TabsProps (+7 more)

### Community 1 - "Core Relational Database Schema"
Cohesion: 0.07
Nodes (17): Announcement, createAnnouncement(), deleteAnnouncement(), togglePinAnnouncement(), PresidentNavProps, LocalTimeProps, DeedSubmission, DayCell (+9 more)

### Community 4 - "Event RSVPs and Deed Logging"
Cohesion: 0.11
Nodes (24): CourseRow, Tab, requireCourseAdmin(), revalidateCourse(), createCourse(), updateCourse(), deleteCourse(), createModule() (+16 more)

### Community 0 - "LMS Authoring and Course Management"
Cohesion: 0.05
Nodes (39): McqNode, LessonNode, ModuleNode, CourseBuilderData, Course, CoursesClientProps, lockCourseLanguage(), SubmitQuizResult (+31 more)

### Community 6 - "Volunteer Authentication Session"
Cohesion: 0.07
Nodes (15): Reward, PendingRedemption, createReward(), toggleRewardActive(), fulfilRedemption(), rejectRedemption(), notoNastaliqUrdu, poppins (+7 more)

### Community 27 - "Streak and Coin Ledgers"
Cohesion: 0.32
Nodes (4): 5eaef27 Replace html5-qrcode with jsqr in lockfile, 835d3b9 Add unit roster & event visibility rules, 9be5451 Add unit scoping and eligibility checks, bda94d0 Add inspect scripts; simplify event visibility

### Community 28 - "User Streak Updates"
Cohesion: 0.25
Nodes (4): NotificationItem, ActiveAlert, getRecentAnnouncements(), getUpcomingEventsForUnitCached()

### Community 22 - "Admin Course Directory"
Cohesion: 0.29
Nodes (4): Reward, redeemReward(), getUserCoinBalance(), 437a50b Changes before error encountered

### Community 7 - "Deed Streak PostgreSQL Calculations"
Cohesion: 0.10
Nodes (6): CustomCriteria, evaluateCriteria(), createApiClient(), 3f188c3 Add mobile API routes and supabase api client, 41b5a86 security: fix XSS, API ownership, crypto random, file upload, password, cookies, headers, middleware, f5b2296 Add social OAuth, deed local_date checks & UI

### Community 26 - "Event Creation Actions"
Cohesion: 0.29
Nodes (4): completeProfile(), Unit, SelectProps, Select

### Community 17 - "Event Scan Modals"
Cohesion: 0.18
Nodes (8): Flashcard, DashboardFlashcardsProps, EventCarouselItem, 2b98c86 Replace Coolvetica with Google Poppins font, 4950c5b Revamp dashboard, wallet & LMS UI/UX, 50d072a chore: start performance optimization plan, 7522853 Add admin user management & ticket scanning updates, e8e1c1d Add coin total to user profile

### Community 23 - "Leaderboard Standings"
Cohesion: 0.22
Nodes (2): PageHeaderProps, d73e533 Add auth UIs, president console, event update

### Community 5 - "User Admin Directory and Roles"
Cohesion: 0.06
Nodes (20): Profile, Unit, ALLOWED_IMAGE_TYPES, UpdateProfileResult, updateProfile(), BarcodeDetector, QrScannerWidgetProps, ScannerEvent (+12 more)

### Community 11 - "Streak Database Triggers"
Cohesion: 0.20
Nodes (9): LeaderboardEntry, getLeaderboard(), getRecentAnnouncementsCached, createPublicSupabaseServerClient(), config, 390bb7c perf: optimize hot queries and add cache-safe data helpers, 51e7e61 perf: fix tag invalidation signatures and type-safe event mappings, 90ef3d6 Merge pull request #3 from Youth-Development-Chapter/copilot/improve-site-performance (+1 more)

### Community 20 - "Admin Dashboard Navigation Layout"
Cohesion: 0.29
Nodes (12): public.user_course_settings, public.profiles, public.courses, public.handle_course_completion(), total_lessons, public.lessons, public.modules, completed_lessons (+4 more)

### Community 24 - "User Profile Sync Triggers"
Cohesion: 0.36
Nodes (8): on_profile_created, public.profiles, on_auth_user_email_updated, auth.users, public.set_profile_email(), NEW.email, public.sync_profile_email(), a7f8177 Add email to profiles with migration & triggers

### Community 18 - "System Announcements Admin"
Cohesion: 0.27
Nodes (13): public.handle_course_completion(), course_reward, public.courses, total_modules, public.modules, module_idx, public.lessons, max_earned_coins (+5 more)

### Community 19 - "Event Capacity Enforcement"
Cohesion: 0.24
Nodes (13): public.units, on_deed_change_update_streak, public.deed_submissions, on_deed_status_coins, public.update_user_streak(), latest_deed_date, public.streaks, has_deed (+5 more)

### Community 8 - "Deed Approvals and Reviews"
Cohesion: 0.12
Nodes (26): public.units, public.user_course_settings, public.profiles, public.courses, on_deed_change_update_streak, public.deed_submissions, on_deed_status_coins, on_progress_completed (+18 more)

### Community 32 - "Community 32"
Cohesion: 0.70
Nodes (4): public.check_user_providers(), providers, auth.identities, auth.users

### Community 15 - "Course Module Database Relations"
Cohesion: 0.20
Nodes (15): 07226c4 Add event posters, archiving & roster features, 28caec0 fix(auth): resolve PKCE verifier loss on OAuth and hydration mismatch on error page, 430dc36 Update OnboardingClient.tsx, 44b9a2a Add relative class to book cover container, 53cdade Implement server-side logout and update dashboard, 54a4d65 Replace announcements with notifications, 81653c4 remove manual login forms, a42476a Add lifetime-based rank tiers and UI tweaks (+7 more)

### Community 33 - "Community 33"
Cohesion: 1.00
Nodes (2): public.handle_deed_coins(), public.coin_transactions

### Community 29 - "Community 29"
Cohesion: 0.52
Nodes (6): public.update_user_streak(), latest_deed_date, public.deed_submissions, public.streaks, has_deed, longest

### Community 25 - "User Profile Editing"
Cohesion: 0.42
Nodes (8): on_registration_enforce_capacity, public.event_registrations, public.enforce_event_capacity(), event_capacity, public.events, public.profiles, is_staff, current_count

### Community 13 - "Course Completion Rewards"
Cohesion: 0.18
Nodes (16): public.units, on_deed_change_update_streak, public.deed_submissions, on_deed_status_coins, public.update_user_streak(), latest_deed_date, public.streaks, has_deed (+8 more)

### Community 2 - "QR Ticket Scan Widgets"
Cohesion: 0.08
Nodes (49): public.profiles, auth.users, public.units, public.events, public.event_registrations, public.deed_submissions, public.streaks, public.coin_transactions (+41 more)

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (5): Developer & Agent Guide, AI Course Prompt Guide, Claude Configuration Reference, Course JSON Import Schema Guide, Mobile App Integration Guide

### Community 35 - "Community 35"
Cohesion: 1.00
Nodes (1): YDC Portal Logo Icon

### Community 34 - "Community 34"
Cohesion: 1.00
Nodes (1): YDC Colored Logo

### Community 36 - "Community 36"
Cohesion: 1.00
Nodes (1): YDC Transparent Logo

## Knowledge Gaps
- **108 isolated node(s):** `eslintConfig`, `securityHeaders`, `serviceWorkerHeaders`, `nextConfig`, `config` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Leaderboard Standings`** (2 nodes): `PageHeaderProps`, `d73e533 Add auth UIs, president console, event update`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `public.handle_deed_coins()`, `public.coin_transactions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `YDC Portal Logo Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `YDC Colored Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `YDC Transparent Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Core Relational Database Schema` to `Dashboard Client Features`, `Reward Shop Redemptions`, `Documentation and Email Templates`, `Volunteer Authentication Session`, `Admin Auth and Client Instantiation`, `Event RSVPs and Deed Logging`, `LMS Authoring and Course Management`, `Event Scan Modals`, `Streak and Coin Ledgers`, `Streak Database Triggers`, `User Streak Updates`, `Admin Course Directory`, `User Admin Directory and Roles`, `Deed Streak PostgreSQL Calculations`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Button` connect `Event Roster and Unit Admin` to `Deed Approval Database Triggers`, `Dashboard Client Features`, `Reward Shop Redemptions`, `LMS Lesson Quiz Submissions`, `Admin Auth and Client Instantiation`, `Event RSVPs and Deed Logging`, `Community 30`, `Documentation and Email Templates`, `LMS Authoring and Course Management`, `Event Creation Actions`, `User Admin Directory and Roles`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `getAdminContext()` connect `Core Relational Database Schema` to `Dashboard Client Features`, `Reward Shop Redemptions`, `Streak and Coin Ledgers`, `LMS Authoring and Course Management`, `User Streak Updates`, `Admin Course Directory`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `securityHeaders`, `serviceWorkerHeaders` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Auth and Client Instantiation` be split into smaller, more focused modules?**
  _Cohesion score 0.05319148936170213 - nodes in this community are weakly interconnected._
- **Should `Event Roster and Unit Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Dashboard Client Features` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._