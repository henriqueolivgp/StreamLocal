// Sessões próprias com cookie HttpOnly + tabela `sessions` (ver README > Decisão de autenticação).
// Evita dependência de providers externos no MVP; preparado para migrar para Auth.js.
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

const COOKIE = "sl_session";
const TTL_DAYS = 14;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function hashPassword(pw: string) { return bcrypt.hash(pw, 12); }
export async function verifyPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_DAYS * 864e5);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  cookies().set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const token = cookies().get(COOKIE)?.value;
  try {
    if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  } finally {
    // O cookie é sempre limpo, mesmo que a BD esteja inacessível — sair nunca pode falhar.
    cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
  }
}

export async function getSessionUser(): Promise<User | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db.select({ s: sessions, u: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())));
  return rows[0]?.u ?? null;
}

export async function requireUser(): Promise<User> {
  const u = await getSessionUser();
  if (!u) throw new Error("Não autenticado.");
  return u;
}
