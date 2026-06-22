import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SESSION_COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me";
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("hex");
}

export function createSessionToken(username: string): string {
  const payload = JSON.stringify({ username, exp: Date.now() + MAX_AGE * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): { username: string } | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    if (sign(encoded) !== signature) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;

    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function setSessionCookie(username: string) {
  const token = createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function validateCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME || "admin";
  const validPassword = process.env.ADMIN_PASSWORD || "admin123";
  return username === validUsername && password === validPassword;
}
