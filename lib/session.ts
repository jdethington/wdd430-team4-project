import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "watchlist_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not defined");
  }

  return secret;
}

function createSignature(userId: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const signature = createSignature(userId);
  const token = `${userId}.${signature}`;

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const [userId, signature] = session.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expectedSignature = createSignature(userId);

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );

    return isValid ? userId : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}
