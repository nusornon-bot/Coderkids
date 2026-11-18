import { describe, expect, it } from 'vitest';
import {
  FIREBASE_PROJECT_ID,
  isVerifiedTeacherToken,
  verifyFirebaseIdToken,
} from '../firebaseJwt.ts';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createSignedTestJwt(
  payload: Record<string, unknown>,
  overrides?: { kid?: string; alg?: string }
) {
  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const pubJwk = (await globalThis.crypto.subtle.exportKey('jwk', keyPair.publicKey)) as {
    kty: string;
    n: string;
    e: string;
  };
  const kid = overrides?.kid || 'test-kid-1';

  const headerSegment = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        alg: overrides?.alg || 'RS256',
        kid,
        typ: 'JWT',
      })
    )
  );
  const payloadSegment = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = new TextEncoder().encode(`${headerSegment}.${payloadSegment}`);
  const signature = await globalThis.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    signingInput
  );
  const signatureSegment = toBase64Url(new Uint8Array(signature));

  return {
    token: `${headerSegment}.${payloadSegment}.${signatureSegment}`,
    jwks: {
      [kid]: {
        kty: pubJwk.kty,
        alg: 'RS256',
        use: 'sig',
        kid,
        n: pubJwk.n,
        e: pubJwk.e,
      },
    },
  };
}

describe('verifyFirebaseIdToken & isVerifiedTeacherToken', () => {
  const nowSec = 1_800_000_000;

  it('verifies a valid RS256 Firebase ID token and extracts user identity', async () => {
    const { token, jwks } = await createSignedTestJwt({
      aud: FIREBASE_PROJECT_ID,
      iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      sub: 'teacher_uid_001',
      iat: nowSec - 60,
      exp: nowSec + 3600,
      email: 'Nusorn.Not@anubalnara.ac.th',
      email_verified: true,
      name: 'Kru Nusorn',
    });

    const user = await verifyFirebaseIdToken(`Bearer ${token}`, {
      nowSeconds: nowSec,
      jwkResolver: async () => jwks,
    });

    expect(user).not.toBeNull();
    expect(user?.uid).toBe('teacher_uid_001');
    expect(user?.email).toBe('nusorn.not@anubalnara.ac.th');
    expect(user?.emailVerified).toBe(true);
    expect(isVerifiedTeacherToken(user)).toBe(true);
  });

  it('rejects expired tokens, wrong audience, and missing Bearer prefix', async () => {
    const expired = await createSignedTestJwt({
      aud: FIREBASE_PROJECT_ID,
      iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      sub: 'uid_expired',
      iat: nowSec - 7200,
      exp: nowSec - 10,
      email: 'nusornon@gmail.com',
      email_verified: true,
    });

    expect(
      await verifyFirebaseIdToken(`Bearer ${expired.token}`, {
        nowSeconds: nowSec,
        jwkResolver: async () => expired.jwks,
      })
    ).toBeNull();

    const wrongAud = await createSignedTestJwt({
      aud: 'other-firebase-project',
      iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      sub: 'uid_aud',
      iat: nowSec - 60,
      exp: nowSec + 3600,
      email: 'nusornon@gmail.com',
      email_verified: true,
    });

    expect(
      await verifyFirebaseIdToken(`Bearer ${wrongAud.token}`, {
        nowSeconds: nowSec,
        jwkResolver: async () => wrongAud.jwks,
      })
    ).toBeNull();

    expect(await verifyFirebaseIdToken(wrongAud.token)).toBeNull();
    expect(await verifyFirebaseIdToken(undefined)).toBeNull();
  });

  it('rejects unverified emails and non-allowlisted users from teacher privilege', async () => {
    const unverifiedTeacher = await createSignedTestJwt({
      aud: FIREBASE_PROJECT_ID,
      iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      sub: 'uid_unverified',
      iat: nowSec - 60,
      exp: nowSec + 3600,
      email: 'nusornon@gmail.com',
      email_verified: false,
    });

    const user1 = await verifyFirebaseIdToken(`Bearer ${unverifiedTeacher.token}`, {
      nowSeconds: nowSec,
      jwkResolver: async () => unverifiedTeacher.jwks,
    });
    expect(user1).not.toBeNull();
    expect(isVerifiedTeacherToken(user1)).toBe(false);

    const studentUser = await createSignedTestJwt({
      aud: FIREBASE_PROJECT_ID,
      iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      sub: 'uid_student',
      iat: nowSec - 60,
      exp: nowSec + 3600,
      email: 'student01@anubalnara.ac.th',
      email_verified: true,
    });

    const user2 = await verifyFirebaseIdToken(`Bearer ${studentUser.token}`, {
      nowSeconds: nowSec,
      jwkResolver: async () => studentUser.jwks,
    });
    expect(user2).not.toBeNull();
    expect(isVerifiedTeacherToken(user2)).toBe(false);
  });
});
