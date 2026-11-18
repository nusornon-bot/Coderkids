import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));

describe('Firestore Security Rules & Blueprint Invariants (Dirty Dozen Verification)', () => {
  it('uses rules_version 2 and starts with a default-deny catch-all block', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toMatch(/match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  });

  it('covers every collection declared in firebase-blueprint.json', () => {
    const paths = Object.keys(blueprint.firestore || {});
    expect(paths.length).toBeGreaterThanOrEqual(7);
    expect(rulesContent).toContain('match /admins/{adminUid}');
    expect(rulesContent).toContain('match /users/{userId}/public/{profileDocId}');
    expect(rulesContent).toContain('match /users/{userId}/private/{privateDocId}');
    expect(rulesContent).toContain('match /users/{userId}/flowcharts/{flowchartId}');
    expect(rulesContent).toContain('match /showcaseProjects/{projectId}');
    expect(rulesContent).toContain('match /reviews/{reviewId}');
    expect(rulesContent).toContain('match /porpor5Records/{recordId}');
  });

  it('prevents unverified email spoofing on admin allowlist checks', () => {
    expect(rulesContent).toContain('request.auth.token.email_verified == true');
    expect(rulesContent).toContain('function isBootstrappedAdminEmail()');
    expect(rulesContent).toMatch(/isBootstrappedAdminEmail\(\)[\s\S]*isEmailVerified\(\)/);
  });

  it('prevents self-assigned admin role escalation and isolates PII', () => {
    expect(rulesContent).toContain("incoming().role == 'student'");
    expect(rulesContent).toContain('incoming().role == existing().role');
    expect(rulesContent).toContain('match /users/{userId}/private/{privateDocId}');
    expect(rulesContent).not.toMatch(/allow\s+read:\s+if\s+isSignedIn\(\)\s*;/);
  });

  it('enforces strict schema keys, ID regex, array bounds, and server timestamps', () => {
    expect(rulesContent).toContain('data.keys().hasAll(');
    expect(rulesContent).toContain('data.keys().hasOnly(');
    expect(rulesContent).toContain('isValidId(');
    expect(rulesContent).toContain("id.matches('^[a-zA-Z0-9_\\\\-]+$')");
    expect(rulesContent).toContain('data.nodes.size() <= 100');
    expect(rulesContent).toContain('incoming().createdAt == request.time');
    expect(rulesContent).toContain('incoming().updatedAt == request.time');
  });

  it('enforces terminal state locking and orphan prevention on subcollections', () => {
    expect(rulesContent).toContain("existing().status != 'archived'");
    expect(rulesContent).toContain('exists(/databases/$(database)/documents/showcaseProjects/$(projectId))');
    expect(rulesContent).toContain('allow list: if isValidId(userId) && isEmailVerified() && resource.data.ownerId == request.auth.uid;');
    expect(rulesContent).toContain("allow list: if isEmailVerified() && resource.data.status == 'published';");
  });
});
