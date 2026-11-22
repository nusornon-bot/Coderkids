# Coder Kids Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Identity & Email Verification**: All user-owned writes require `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation (Split Collection)**: Private fields (`studentId`, `contactEmail`, `bio`, `motto`, `role`) live strictly under `/users/{userId}/private/info` and are readable/writable ONLY by `userId == request.auth.uid` or verified admin. Public leaderboard/profile display fields live under `/users/{userId}/public/profile`.
3. **Anti-Privilege-Escalation**: Standard users cannot self-assign `role == 'admin'` or write into `/admins/{adminUid}`. Bootstrapped teacher/admin access requires BOTH `request.auth.token.email_verified == true` AND membership in the trusted admin allowlist or `/admins/{uid}` document.
4. **Relational Sync & Anti-Orphan**: Every `/showcaseProjects/{projectId}/reviews/{reviewId}` document MUST reference an existing parent `/showcaseProjects/{projectId}` document (`exists(...)` on create) and carry `reviewerId == request.auth.uid`.
5. **Anti-Update-Gap & Action-Based Updates**: Every `create` validates exact required and allowed keys (`keys().hasAll(...) && keys().hasOnly(...)`) plus types and size bounds. Every `update` validates `isValid[Entity](incoming())` AND restricts modified fields per named action via `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
6. **Immutable Ownership & Server Temporal Integrity**: `ownerId`, `reviewerId`, `uid`, and `createdAt` are immutable across updates. `createdAt == request.time` on create; `updatedAt == request.time` on update.
7. **Terminal State Locking**: Published showcase projects with `status == 'archived'` cannot be updated by non-admins.
8. **Total Array & String Size Bounds (DoS / Denial-of-Wallet Prevention)**: Document IDs match `^[a-zA-Z0-9_\\-]+$` and `<= 128` chars. Strings have explicit `.size()` ceilings. Flowchart `nodes` arrays are bounded `<= 100` with element checks.
9. **Secure List Queries**: Any `allow list` rule evaluates `resource.data` directly (e.g., `resource.data.ownerId == request.auth.uid` or `resource.data.status == 'published'`) with zero `get()`/`exists()` calls inside `list`.
10. **Homework Submission & Grading Separation**: Students can create `/homeworkSubmissions/{submissionId}` with `ownerId == request.auth.uid` and `status == 'pending'`, and can only edit their submission fields while `status == 'pending'`. Only verified admins/teachers (`isAdmin()`) can transition `status` to `'graded'` or write `gradeScore` (1..5) and `teacherFeedback`.
11. **Cloud Studio Projects Isolation**: `/users/{userId}/studioProjects/{studioProjectId}` documents are strictly scoped to `ownerId == userId == request.auth.uid` (or admin read) with bounded `codeContent` (`<= 20000`) and `blocksJson` (`<= 30000`).
12. **Live Classroom Quiz Room Integrity**: Only verified teachers/admins (`isAdmin()`) can create `/liveRooms/{roomCode}` (with `hostUid == request.auth.uid`) and only the host (`existing().hostUid == request.auth.uid`) or `isAdmin()` can update or delete them. Participants under `/liveRooms/{roomCode}/participants/{participantId}` must belong to an active room, start with `score == 0 && streak == 0 && lastAnswerIndex == -1` on create, cannot increase `score` by more than `+2000` or `streak` by more than `+1` per update while the room stage is not `'podium'`, and can only be deleted by the room host or `isAdmin()` (preventing self-delete duplicate-join bypass).
13. **Coding Battle Question Bank Integrity**: `/battleQuestions/{questionId}` stores Scratch and Micro:bit questions categorized by difficulty (`easy`, `medium`, `hard`). Verified users can read/list active questions (`resource.data.status == 'active'`). Only verified teachers/admins (`isAdmin()`) can create, update, or delete questions, with strict schema keys (`hasAll`/`hasOnly`), 4-choice array bounds (`options.size() == 4`, `options[0] is string`), `correctIndex` in `0..3`, immutable `createdByUid`/`createdAt`, and server timestamps.
14. **User Profile Points & Progression Rate Bounding**: Under `/users/{userId}/public/profile`, non-admin users are capped on initial `create` (`points <= 1000`, `completedModulesCount <= 4`, `streakDays <= 30`) and bounded on `update` (`points <= existing().points + 600`, `completedModulesCount <= existing().completedModulesCount + 1 && <= 4`, `streakDays <= existing().streakDays + 1`) to block direct Firestore SDK point/module/streak inflation.
15. **Virtual Classroom Room, Member, Assignment, Submission, Schedule, Material & Post Integrity**:
    - Only verified teachers/admins (`isAdmin()`) can create `/virtualClassrooms/{roomCode}` (with `hostUid == request.auth.uid`, `status == 'active'`, `roomCode` matching `^[a-zA-Z0-9_\\-]+$` length 3..20), and only the host or `isAdmin()` can update or delete it.
    - Students (verified or `guest_...` participant ID) can `get` an active room by exact `roomCode`, join `/virtualClassrooms/{roomCode}/members/{memberId}` strictly with `role == 'student'` (non-PII fields only), submit homework under `/submissions/{submissionId}` strictly with `status == 'submitted'` (no `score`/`teacherFeedback`), increment material `downloadsCount` by `+1` only, and create/like Q&A `/posts/{postId}` (`authorRole == 'student'`, `likes == 1` on create, `likes == existing().likes + 1` on like).
    - Only `isAdmin()` or room `hostUid` can create/update/delete assignments, schedules, materials (except `+1` download counter), or grade submissions (`status: 'graded'`, `score`, `teacherFeedback`).

---

## 2. The "Dirty Dozen" (+ Anti-Cheat) Adversarial Payloads (Must Return `PERMISSION_DENIED`)

1. **Unauthenticated Write**: Creating `/users/u1/public/profile` with `auth == null`.
2. **Unverified Email Admin Spoof**: Calling with `auth.token = { email: "nusornon@gmail.com", email_verified: false }` to read `/porpor5Records/r1`.
3. **Self-Assigned Admin Role Escalation**: Creating `/users/u1/private/info` with `role: "admin"` or writing `/admins/u1`.
4. **Shadow / Ghost Field Injection**: Creating `/users/u1/public/profile` with all valid fields plus an unexpected shadow field `isSuperVerified: true`.
5. **Cross-Tenant PII Read**: Authenticated student `u2` attempting `get` on `/users/u1/private/info`.
6. **Owner UID Spoofing**: Authenticated student `u1` creating `/users/u1/flowcharts/fc1` with `ownerId: "victim_uid"`.
7. **Immutable Field Mutation**: Authenticated owner `u1` updating `/showcaseProjects/p1` to change `ownerId` or `createdAt`.
8. **Client-Forged Timestamp**: Creating `/users/u1/flowcharts/fc1` with `createdAt` set to a past client date instead of `request.time`.
9. **Orphaned Subcollection Write**: Creating `/showcaseProjects/nonexistent_proj/reviews/rev1` where parent project does not exist.
10. **Path ID Poisoning / Oversized String**: Creating `/users/u1/flowcharts/${"a".repeat(200)}` or `title` exceeding `maxLength`.
11. **Terminal State Bypass**: Non-admin owner attempting to modify `/showcaseProjects/p1` after `status == 'archived'`.
12. **Blanket List Query Scraping**: Non-admin user calling `list` on `/porpor5Records` or `/users/{other}/flowcharts`.
13. **Direct Profile XP Inflation**: Non-admin student updating `/users/u1/public/profile` with `points: existing().points + 50000`.
14. **Unauthorized Live Room Creation**: Non-admin student attempting `create` on `/liveRooms/CHEAT1`.
15. **Live Battle Score Injection / Post-Podium Write**: Student participant setting `score: 99999` on create or updating score by `+10000` or after `stage == 'podium'`.
16. **Participant Self-Delete Rejoin Bypass**: Student participant calling `delete` on `/liveRooms/{roomCode}/participants/{participantId}` to bypass duplicate-join guard.
17. **Unauthorized Virtual Classroom Creation**: Non-admin student attempting `create` on `/virtualClassrooms/HACK1`.
18. **Virtual Classroom Teacher Role Spoofing**: Student joining `/virtualClassrooms/CS61/members/u1` with `role: "teacher"` or posting with `authorRole: "teacher"`.
19. **Student Self-Grading Submission**: Student creating `/virtualClassrooms/CS61/submissions/sub1` with `status: "graded"` and `score: 100`.
20. **Orphaned Virtual Classroom Member Write**: Creating `/virtualClassrooms/NONEXISTENT/members/guest_1234567890` where parent room does not exist.


