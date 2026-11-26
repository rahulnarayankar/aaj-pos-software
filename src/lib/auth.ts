import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "aaj_pos_session";

export type SessionStaff = {
  id: string;
  name: string;
  role: "CASHIER" | "MANAGER";
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(staff: SessionStaff) {
  return new SignJWT(staff)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("18h")
    .sign(secret());
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.id !== "string" || typeof payload.name !== "string") {
      return null;
    }
    if (payload.role !== "MANAGER" && payload.role !== "CASHIER") return null;
    return {
      id: payload.id,
      name: payload.name,
      role: payload.role,
    } satisfies SessionStaff;
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 18,
  };
}
