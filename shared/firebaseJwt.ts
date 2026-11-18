export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

interface GoogleJwkKey {
  kty: string;
  alg?: string;
  use?: string;
  kid: string;
  n: string;
  e: string;
}

export type JwkResolver = () => Promise<Record<string, GoogleJwkKey>>;

export const FIREBASE_PROJECT_ID = 'gen-lang-client-0756366544';

export const TEACHER_ALLOWLIST_EMAILS: readonly string[] = [
  'webmaster@anubalnara.ac.th',
  'nusorn.not@anubalnara.ac.th',
  'nusornon@gmail.com',
];

const GOOGLE_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let cachedJwks: Record<string, GoogleJwkKey> | null = null;
let cachedJwksExpiresAt = 0;

function base64UrlToUint8Array(input: string): Uint8Array<ArrayBuffer> {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJwtJson<T = Record<string, unknown>>(segment: string): T | null {
  try {
    const bytes = base64UrlToUint8Array(segment);
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function parseCacheMaxAge(cacheControlHeader: string | null): number {
  if (!cacheControlHeader) return 300;
  const match = cacheControlHeader.match(/max-age=(\d+)/i);
  if (!match) return 300;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

export async function fetchGoogleFirebaseJwks(): Promise<Record<string, GoogleJwkKey>> {
  const now = Date.now();
  if (cachedJwks && now < cachedJwksExpiresAt) {
    return cachedJwks;
  }

  const res = await fetch(GOOGLE_JWK_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase JWK set (HTTP ${res.status})`);
  }

  const body = (await res.json()) as { keys?: GoogleJwkKey[] };
  if (!body || !Array.isArray(body.keys)) {
    throw new Error('Malformed Firebase JWK response');
  }

  const map: Record<string, GoogleJwkKey> = {};
  for (const k of body.keys) {
    if (k && typeof k.kid === 'string') {
      map[k.kid] = k;
    }
  }

  const maxAgeSec = parseCacheMaxAge(res.headers.get('cache-control'));
  cachedJwks = map;
  cachedJwksExpiresAt = now + maxAgeSec * 1000;
  return map;
}

export async function verifyFirebaseIdToken(
  authHeader: string | null | undefined,
  options?: {
    projectId?: string;
    nowSeconds?: number;
    jwkResolver?: JwkResolver;
  }
): Promise<VerifiedFirebaseUser | null> {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/);
  if (!match) return null;

  const token = match[1];
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeJwtJson<{ alg?: string; kid?: string; typ?: string }>(headerB64);
  const payload = decodeJwtJson<{
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
  }>(payloadB64);

  if (!header || !payload) return null;
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    return null;
  }

  const projectId = options?.projectId || FIREBASE_PROJECT_ID;
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  const nowSec = options?.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (payload.aud !== projectId) return null;
  if (payload.iss !== expectedIssuer) return null;
  if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) return null;

  try {
    const jwks = options?.jwkResolver
      ? await options.jwkResolver()
      : await fetchGoogleFirebaseJwks();
    const jwk = jwks[header.kid];
    if (!jwk) return null;

    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'jwk',
      jwk as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    const valid = await globalThis.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      signingInput
    );

    if (!valid) return null;

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '',
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export function isVerifiedTeacherToken(user: VerifiedFirebaseUser | null | undefined): boolean {
  if (!user || !user.emailVerified || !user.email) return false;
  const email = user.email.trim().toLowerCase();
  return TEACHER_ALLOWLIST_EMAILS.some((allowed) => allowed.toLowerCase() === email);
}
