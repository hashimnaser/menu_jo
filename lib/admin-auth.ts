import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "menu-admin-session";

export function isAdminConfigured() {
  return Boolean(
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_SESSION_SECRET &&
    process.env.ADMIN_SESSION_SECRET.length >= 32,
  );
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function createAdminSessionToken() {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", getSessionSecret())
    .update(`menu-jo-admin-session-v1:${issuedAt}`)
    .digest("hex");
  return `${issuedAt}.${signature}`;
}

export function isValidAdminSession(token: string | undefined) {
  if (!token) return false;
  const [issuedAtValue, signature, extra] = token.split(".");
  if (extra !== undefined || !/^\d+$/.test(issuedAtValue ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "")) {
    return false;
  }

  const issuedAt = Number(issuedAtValue);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > now + 60 || now - issuedAt > 60 * 60 * 8) {
    return false;
  }

  const expected = createHmac("sha256", getSessionSecret())
    .update(`menu-jo-admin-session-v1:${issuedAtValue}`)
    .digest();
  return timingSafeEqual(Buffer.from(signature, "hex"), expected);
}

export function isValidAdminPassword(password: string) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  const expected = createHmac("sha256", getSessionSecret()).update(expectedPassword).digest();
  const received = createHmac("sha256", getSessionSecret()).update(password).digest();
  return timingSafeEqual(received, expected);
}
