<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Youth Development Chapter (YDC) Portal — Developer & Agent Guide

Welcome to the **YDC Portal** codebase. This document serves as a comprehensive onboarding guide and system manual for AI agents and human developers working on this project.

---

## 1. Project Overview & Architecture

The YDC Portal is a gamified, bilingual Learning Management System (LMS) and community service platform designed to empower youth in South Punjab. It enables volunteers to build character and skills, earn "YDC Coins" via courses and community deeds, and redeem them for rewards.

The application follows a **modern 3-tier architecture**:
1. **Frontend / Server-Side Rendering**: Next.js 16 (App Router) + React 19 + Tailwind CSS v4.
2. **Backend Services & Database**: Supabase (PostgreSQL) handling Authentication, relational database storage, Row Level Security (RLS) policies, and Storage buckets.
3. **Storage & Assets**: Cloudflare R2 bucket (via S3 client compatibility) or local Supabase Storage (e.g. for deeds and avatars) for uploading proof images and profile avatars.

---

## 2. Directory Structure

```filepath
ydc-portal/
├── src/
│   ├── app/                    # Next.js App Router Routes & Page layouts
│   │   ├── actions.ts          # Core Client-facing Server Actions (Deeds, ticketing)
│   │   ├── admin/              # Admin Dashboard pages, components, and server actions
│   │   │   ├── actions.ts      # Admin-only Server Actions (approvals, role adjustments, ticketing)
│   │   │   ├── announcements/  # Announcement manager dashboard
│   │   │   ├── approvals/      # Deed submissions pending review
│   │   │   ├── courses/        # LMS Course creator / importer
│   │   │   ├── events/         # Physical event manager / ticket scanner
│   │   │   ├── rewards/        # Redeemable reward shop manager
│   │   │   ├── settings/       # System-wide variables editor
│   │   │   └── users/          # User directories, manual coin adjustment
│   │   ├── auth/               # Login, Sign-up, Password Recovery routes
│   │   ├── dashboard/          # Volunteer User Dashboard
│   │   ├── events/             # Public events and registration portal
│   │   ├── leaderboard/        # Public gamification standings (coins, streaks, deeds completed)
│   │   ├── lms/                # E-learning area (courses, syllabus, and quiz lessons)
│   │   ├── onboarding/         # Setup wizard for profile metadata collection
│   │   ├── showcase/           # Live public feed of approved volunteer deeds
│   │   └── globals.css         # Styling, Tailwind configurations, and Urdu font imports
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Basic UI elements (Buttons, Tabs, Inputs, WeeklyActivity)
│   │   ├── admin/              # Specialized admin layouts
│   │   ├── dashboard/          # Daily deeds logs, progress trackers
│   │   └── lms/                # Interactive video player and Server-checked quiz layouts
│   ├── lib/                    # Shared modules and server-side utilities
│   │   ├── admin.ts            # RBAC helper functions (role mapping, permission validator)
│   │   ├── env.ts              # Zod environment variable validator
│   │   ├── lms-data.ts         # Server-only LMS query functions (bypasses internal API calls)
│   │   └── wellms.ts           # Browser-safe LMS types and browser client methods
│   └── utils/
│       └── supabase/           # Supabase client instantiation (client, server, and middleware session update)
├── supabase/                   # Database setup DDL files
│   ├── migrations/             # Incremental schema changes
│   └── schema.sql              # Consolidated baseline DDL script (tables, policies, triggers, buckets)
└── package.json                # Project configurations & dependency versions
```

---

## 3. Database Schema & Ledger Design

The system relies on strict Row Level Security (RLS) policies and PostgreSQL database triggers to orchestrate gamification flows. The database is hosted in Supabase.

### Core Tables

| Table Name | Description | Key Fields & Constraints |
| :--- | :--- | :--- |
| **`profiles`** | Extended user profile details. | `id` (references `auth.users`), `role` (`volunteer`, `admin`, `superadmin`, `president`, `tier-3`), `division` (e.g. Multan, Bahawalpur, D.G. Khan). |
| **`events`** | Physical community events. | `id` (UUID), `title`, `date`, `time`, `location`, `capacity`, `coin_reward` (default 50), `division`. |
| **`event_registrations`** | Links volunteers to events they registered for. | `ticket_code` (unique code `TKT-XXXX-XXXXXX`), `attended` (boolean), `attended_at`. |
| **`deed_submissions`** | Daily good deed uploads for streak maintenance. | `proof_url` (path to storage), `status` (`pending`, `approved`, `rejected`), `local_date` (avoids timezone drift), `coin_reward`, `bonus_coins`. |
| **`streaks`** | Tracks volunteer consecutive active days. | `current_streak`, `longest_streak`, `last_deed_date` (DATE). |
| **`coin_transactions`** | **Append-Only ledger** tracking coin changes. | `amount` (signed int), `reason` (`daily_deed`, `event_attendance`, `course_completion:<id>:<lang>`, `reward_redeem`). |
| **`courses`** | LMS courses. | `id` (slug), `title`, `title_ur`, `reward_points` (default 50). |
| **`modules`** | Sub-sections (chapters) within courses. | `id` (slug), `course_id`, `title`, `title_ur`, `order_index`. |
| **`lessons`** | Content pages. *Strict: 1 lesson per module.* | `id` (slug), `module_id`, `video_url`, `video_url_ur`, `text_content`, `text_content_ur`. |
| **`mcqs`** | Lesson quizzes. | `lesson_id`, `question`, `question_ur`, `options` (JSONB), `options_ur` (JSONB), `correct_answer_index` (int), `difficulty` (`beginner`, `advanced`, `expert`). |
| **`user_progress`** | Log of completed lessons. | `user_id`, `course_id`, `lesson_id`, `language` (`en`/`ur`), `difficulty` (`beginner`/`advanced`/`expert`). Unique: `(user_id, course_id, lesson_id, language, difficulty)`. |
| **`user_course_settings`** | Tracks chosen track language per course. | `user_id`, `course_id`, `language` (`en` or `ur`). |
| **`admin_permissions`** | Flags for granular control of tier-3 accounts. | `admin_id`, `can_scan_tickets`, `can_approve_deeds`, `can_manage_events`, `can_manage_courses`, etc. |
| **`announcements`** | Pinned or regular system notifications. | `title`, `content`, `is_pinned` (boolean), `created_by`. |
| **`rewards`** | Shop catalog. | `coin_cost`, `quantity_available` (null = unlimited), `is_active`. |
| **`reward_redemptions`** | Redemptions log. | `user_id`, `reward_id`, `coin_cost`, `status` (`pending`, `fulfilled`, `cancelled`). |

### Database Triggers & Automations

*   **`handle_deed_approval()`**: Fired after a `deed_submissions.status` shifts to `approved`.
    1.  Validates and updates `streaks` for the volunteer. If `last_deed_date` was yesterday, `current_streak` increments. If it was today, it remains the same. If older, resets to `1`.
    2.  Calculates coins (`coin_reward` + `bonus_coins`) and inserts a ledger record in `coin_transactions`.
*   **`handle_course_completion()`**: Evaluates points when a quiz is submitted. It computes chapter points based on fractional distribution and difficulty, and grants a 40% completion bonus once all lessons in the course language track are completed.
*   **`set_profile_email()` / `sync_profile_email()`**: Synchronizes user emails between `auth.users` and the public `profiles` table.

---

## 4. Role-Based Access Control (RBAC) & Division Scoping

Administrative roles are restricted to prevent cross-division editing, facilitating decentralized management.

1.  **Superadmin / Admin (Global)**: Full write/read permissions across all divisions.
2.  **President (Division-scoped)**: Head of a regional chapter (e.g. Multan).
    *   Can manage and scanner-check tickets for events in their specific division.
    *   Can approve/reject deeds submitted by volunteers residing in their division.
    *   Can configure customized administrative settings for their division's ticket scanners (`tier-3`).
    *   *Limits*: Restricted to modifying and scanning resources within their `profiles.division` mapping. Can authorize a maximum of **2 Event Scanners** (`tier-3` with `can_scan_tickets = true`) per division.
3.  **Tier-3 (Granular/Customized)**: Specific roles matching selected permissions in `admin_permissions` (e.g., ticket scanners or deed evaluators), restricted by their assigned division.
4.  **Volunteer**: Standard client. Can read public announcements, RSVP for events (claims a ticket), complete lessons/quizzes, earn coins, and redeem rewards.

---

## 5. System Logic & Mechanics

### E-Learning Gamification Engine (Granular Rewards)
To encourage progressive learning and prevent cheating, correct MCQ answers are checked only on the server. The client receives lessons with the answers stripped out. Upon a correct quiz attempt:
*   **60% of Course Reward Points (T)** is distributed across course modules/chapters.
    *   For a module index $i$ out of $N$ modules, the base coins awarded are:
        $$\text{Base Coins} = \left\lfloor \frac{0.6 \times T \times i}{N} \right\rfloor - \left\lfloor \frac{0.6 \times T \times (i-1)}{N} \right\rfloor$$
*   **Difficulty Modifier**:
    *   *Beginner*: $0.7 \times$ base chapter points ($-30\%$).
    *   *Advanced (Standard)*: $1.0 \times$ base chapter points.
    *   *Expert*: $1.3 \times$ base chapter points ($+30\%$).
*   **Upgrade Differential**: If a user re-attempts a quiz at a higher difficulty, they are only awarded the incremental difference:
    $$\text{Coins to Award} = \text{Calculated Chapter Coins} - \text{Previously Earned Coins}$$
*   **40% Completion Bonus**: Awarded once all distinct lessons in the chosen course language track are completed:
    $$\text{Completion Bonus} = T - \lfloor 0.6 \times T \rfloor$$

### Daily Good Deed Streaks
*   **Daily limit**: Up to 3 deeds can be uploaded per day.
*   **Streak validation**: Streaks are incremented upon admin approval. If a user maintains a continuous chain of daily submissions, their streak remains alive. If a day is missed, it resets to 1.

### Ticket Ticketing
When a volunteer claims a ticket, the server generates a unique ticket code: `TKT-[EVENT_PREFIX]-[HEX]`. A volunteer can show their QR code containing this ticket string. Admins scan it using the scanner page (powered by `html5-qrcode`), verifying and checking them in via Server Actions, which logs their attendance and awards coins.

---

## 6. Development Checklist

### Required Environment Variables
Configure these variables in `.env` or `.env.local` to start development:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudflare R2 configurations
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=ydc
CLOUDFLARE_R2_PUBLIC_URL=https://your-public-r2-url.com
```

### Setup & Run commands
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run migrations**: Import `supabase/schema.sql` and the incremental migrations inside the Supabase SQL editor dashboard.
3.  **Start development server**:
    ```bash
    npm run dev
    ```
4.  **Lint & Verify build**:
    ```bash
    npm run lint
    ```
    ```bash
    npm run build
    ```
