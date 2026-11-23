import crypto from 'node:crypto';

const DEFAULT_SECRET = process.env.MEDSLOT_AUTH_SECRET || 'medslot-cse3206-dev-secret';

/**
 * Hashes a plaintext password using scrypt with a random 16-byte salt.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string in constant time.
 */
export function verifyPassword(password, storedHash) {
  const [salt, originalHex] = String(storedHash || '').split(':');
  if (!salt || !originalHex) {
    return false;
  }
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, original);
}

/**
 * Signs a compact HMAC-SHA256 bearer token with 24h expiration.
 */
export function signAuthToken(payload, secret = DEFAULT_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 bearer token and returns its decoded payload or null.
 */
export function verifyAuthToken(token, secret = DEFAULT_SECRET) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [header, body, signature] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
