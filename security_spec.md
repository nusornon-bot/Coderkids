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

---

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)

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
