# YDC Portal — Mobile App (React Native & Flutter) Integration Guide

Welcome to the Developer & Integration Guide for the Youth Development Chapter (YDC) Portal. This document describes how a mobile application (built using React Native or Flutter) can securely and efficiently connect to the YDC backend ecosystem.

---

## 1. Core Architecture

The YDC Portal is powered by a modern, hybrid backend:
1. **Supabase Database (PostgreSQL)**: Handles the relational schema, Row Level Security (RLS) policies, database triggers, and performance indexes.
2. **Supabase Auth**: Authenticates volunteers and admins.
3. **Supabase Storage**: Buckets (`deeds` and `avatars`) for volunteer-uploaded proof images and profile avatars.
4. **Next.js 16 API Layer**: Orchestrates complex server-side validation (such as checking MCQ answers, generating unique ticket codes, checking in attendance, enforcing daily limits, and handling scoped administrative approvals).

### Dual-Integration Strategy
To build a high-performance, native-feeling mobile app, follow this pattern:
* **Direct Supabase SDK Access**: Use the official Supabase SDK (JavaScript or Dart) on the mobile client to handle Authentication, read database tables (like events, user profiles, streaks, and leaderboards), and upload files to storage buckets. Database access is fully secured via **Row Level Security (RLS)**.
* **Next.js REST API Endpoint Invocation**: Call custom REST APIs on the Next.js server for actions that require server-side validation or business logic (e.g., grading quiz MCQs, claiming tickets, scanning ticket QR codes, submitting deeds, and admin approvals).

---

## 2. Authentication Flow

Your mobile app should authenticate directly with Supabase using the standard Supabase Auth SDK.

### Steps to Authenticate
1. User logs in using email & password or sign-up via the mobile app.
2. Supabase Auth returns a session containing an `access_token` (a short-lived JSON Web Token / JWT) and a `refresh_token`.
3. To call Next.js REST API routes, the mobile app **must** send this JWT in the HTTP headers:
   ```http
   Authorization: Bearer <your_supabase_access_token>
   ```
4. The Next.js API route validates the token with Supabase and executes the operation on behalf of the authenticated user.

---

## 3. Direct Database & Storage Access (via Supabase SDK)

The mobile app can interact directly with Supabase for data queries and file uploads. Below are examples of how to initialize and use it.

### Client Initialization

#### React Native (JavaScript/TypeScript)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
```

#### Flutter (Dart)
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
  );
  runApp(const MyApp());
}

final supabase = Supabase.instance.client;
```

### Key Queries (Enforced by RLS)

* **Read Public Leaderboard Standings (Streaks)**:
  ```typescript
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, profiles(full_name, avatar_url, division)')
    .order('current_streak', { ascending: false })
    .limit(50)
  ```

* **Read Active Rewards Catalog**:
  ```typescript
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('coin_cost', { ascending: true })
  ```

* **Upload Proof Photos to Storage**:
  When volunteers submit deeds, the app should upload the proof photo to the `deeds` bucket, get its public URL, and then call our Next.js API to log the deed.
  
  *React Native Example:*
  ```typescript
  import { decode } from 'base64-arraybuffer'

  const fileName = `${userId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('deeds')
    .upload(fileName, decode(base64ImageString), {
      contentType: 'image/jpeg'
    })

  const { data: { publicUrl } } = supabase.storage
    .from('deeds')
    .getPublicUrl(fileName)
  ```

---

## 4. REST API Endpoint Reference

All custom REST API routes are hosted under the base portal URL (e.g., `https://portal.ydc.org.pk/api/...`).

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| [`/api/courses`](#get-apicourses) | `GET` | Volunteer | Fetches all courses with their module structures. |
| [`/api/courses/[id]`](#get-apicoursesid) | `GET` | Volunteer | Fetches a specific course and its modules. |
| [`/api/lessons/[id]`](#get-apilessonsid) | `GET` | Volunteer | Fetches lesson text content, video URLs, and MCQ questions (with answers omitted). |
| [`/api/lms/quiz/submit`](#post-apilmsquizsubmit) | `POST` | Volunteer | Grades lesson MCQs on the server and awards completion coins. |
| [`/api/progress`](#post-apiprogress) | `POST` | Volunteer | Records/updates progress completion for a lesson. |
| [`/api/progress/[userId]/[courseId]`](#get-apiprogressuseridcourseid) | `GET` | Volunteer | Fetches list of completed lesson IDs for a specific course. |
| [`/api/events/ticket/claim`](#post-apieventsticketclaim) | `POST` | Volunteer | Registers the user for an event and generates a unique ticket. |
| [`/api/deeds/submit`](#post-apideedssubmit) | `POST` | Volunteer | Submits a good deed with limits check (max 3 deeds per day). |
| [`/api/rewards/redeem`](#post-apirewardsredeem) | `POST` | Volunteer | Redeems a shop reward item. Checks balance and stock. |
| [`/api/events/ticket/check-in`](#post-apieventsticketcheck-in) | `POST` | Scanner/Admin | Checks in attendee by scanning a ticket code or visual Member ID. |
| [`/api/admin/deeds/verify`](#post-apiadmindeedsverify) | `POST` | Approver/Admin | Approves or rejects volunteer deeds (applies division scoping). |

---

### GET `/api/courses`
Fetches a list of all courses and their child modules.
* **Headers**: `Authorization: Bearer <JWT>`
* **Response `200 OK`**:
  ```json
  [
    {
      "id": "deenyat",
      "title": "Islamic Deenyat",
      "author": "Maulana Tariq",
      "description": "Introduction to Islamic values",
      "imageUrl": "https://...",
      "modules": [
        { "id": "d_m1", "title": "Faith & Beliefs", "duration": "15 mins" }
      ]
    }
  ]
  ```

---

### GET `/api/courses/[id]`
Fetches details of a specific course by ID.
* **Headers**: `Authorization: Bearer <JWT>`
* **Response `200 OK`**:
  ```json
  {
    "id": "deenyat",
    "title": "Islamic Deenyat",
    "author": "Maulana Tariq",
    "description": "Introduction to Islamic values",
    "imageUrl": "https://...",
    "modules": [
      { "id": "d_m1", "title": "Faith & Beliefs", "duration": "15 mins" }
    ]
  }
  ```

---

### GET `/api/lessons/[id]`
Fetches lesson details. MCQ correct answers are deliberately stripped out for security.
* **Headers**: `Authorization: Bearer <JWT>`
* **Response `200 OK`**:
  ```json
  {
    "id": "lesson_1",
    "moduleId": "d_m1",
    "courseId": "deenyat",
    "title": "Pillars of Faith",
    "videoUrl": "https://youtube.com/watch?v=...",
    "textContent": "Pillars of faith are...",
    "mcq": [
      {
        "question": "What is the first pillar?",
        "options": ["Tawheed", "Salah", "Zakat", "Sawm"]
      }
    ]
  }
  ```

---

### POST `/api/lms/quiz/submit`
Verifies MCQ answers on the server. If all are correct, the database updates progress and issues coin transactions (including completion bonuses).
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "lessonId": "lesson_1",
    "answers": [0],
    "difficulty": "advanced",
    "language": "en"
  }
  ```
* **Response `200 OK` (Passed)**:
  ```json
  {
    "ok": true,
    "passed": true,
    "total": 1,
    "failedAttempts": 0,
    "completedCourseId": "deenyat",
    "rewardCoins": 50
  }
  ```
* **Response `200 OK` (Failed)**:
  ```json
  {
    "ok": true,
    "passed": false,
    "total": 1,
    "failedAttempts": 1,
    "completedCourseId": null,
    "rewardCoins": 0
  }
  ```

---

### POST `/api/progress`
Marks a lesson as complete for the logged-in user.
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "courseId": "deenyat",
    "lessonId": "lesson_1"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "progress": [
      { "user_id": "...", "course_id": "deenyat", "lesson_id": "lesson_1", "completed": true }
    ]
  }
  ```

---

### GET `/api/progress/[userId]/[courseId]`
Returns an array of completed lesson IDs for the specified user and course.
* **Headers**: `Authorization: Bearer <JWT>`
* **Response `200 OK`**:
  ```json
  ["lesson_1", "lesson_2"]
  ```

---

### POST `/api/events/ticket/claim`
Claims a ticket for an event. Generates a unique secure ticket code formatted as `TKT-[PREFIX]-[HEX]`.
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "eventId": "d258b688-6625-4ad9-a72d-8b01bbbbad78"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "ticketCode": "TKT-D258-F104BA"
  }
  ```

---

### POST `/api/deeds/submit`
Logs a good deed submission. Enforces a strict daily limit of up to 3 deeds per day.
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "description": "Visited an orphanage and distributed toys.",
    "proofUrl": "https://your-public-r2-url.com/deeds/user_id/image.jpg",
    "localDate": "2026-05-24"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "deed": {
      "id": "...",
      "status": "pending",
      "description": "Visited an orphanage...",
      "proof_url": "https://..."
    }
  }
  ```

---

### POST `/api/events/ticket/check-in`
Used by event scanners to scan a ticket. Marks attendance and rewards the volunteer with coins.
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "scannedId": "TKT-D258-F104BA",
    "eventId": "optional-uuid"
  }
  ```
  *(Note: `scannedId` can also be a visual member ID like `YDC-0b3abd22` alongside a provided `eventId`)*
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "userName": "Ahmad Ali",
    "coinsAwarded": 50
  }
  ```

---

### POST `/api/admin/deeds/verify`
Used by admins/presidents to approve or reject submitted volunteer deeds.
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "deedId": "917f9e83-34bd-4ee7-94d5-56f8745ea4fb",
    "status": "approved",
    "bonusCoins": 15,
    "adminNotes": "Excellent contribution! Verified."
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true
  }
  ```

---

### POST `/api/rewards/redeem`
Redeems a reward catalog item. Validates that the reward is active, stock is available, and the user has a sufficient coin balance.
* **Headers**: `Authorization: Bearer <JWT>`
* **Request Body**:
  ```json
  {
    "rewardId": "824f9e83-34bd-4ee7-94d5-56f8745ea4fa"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "redemption": {
      "id": "...",
      "user_id": "...",
      "reward_id": "824f9e83-34bd-4ee7-94d5-56f8745ea4fa",
      "coin_cost": 50,
      "status": "pending",
      "redeemed_at": "..."
    }
  }
  ```

---

## 5. Summary Integration Code Examples

### Fetching API using Dart / Flutter
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> submitQuiz({
  required String jwt,
  required String lessonId,
  required List<int> answers,
  required String difficulty,
  required String language,
}) async {
  final url = Uri.parse('https://portal.ydc.org.pk/api/lms/quiz/submit');
  
  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $jwt',
    },
    body: jsonEncode({
      'lessonId': lessonId,
      'answers': answers,
      'difficulty': difficulty,
      'language': language,
    }),
  );

  return jsonDecode(response.body);
}
```

### Fetching API using React Native / Fetch
```typescript
async function claimEventTicket(jwt: string, eventId: string) {
  try {
    const response = await fetch('https://portal.ydc.org.pk/api/events/ticket/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({ eventId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to claim ticket');
    
    return data.ticketCode;
  } catch (error) {
    console.error('Error claiming ticket:', error);
  }
}
```
