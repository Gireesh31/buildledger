import { NextResponse } from "next/server";
import { db } from "./supabase";

/**
 * Attempt limits for the sign-in, sign-up and email-sending routes, so passwords can't be guessed
 * endlessly and nobody can flood an inbox with reset links. The counters live in Postgres
 * (public.hit_rate_limit) because each request may run on a different server.
 */
interface Limit {
  /** What is being counted, e.g. "login:email:someone@example.com". */
  key: string;
  max: number;
  windowSeconds: number;
}

/** The caller's IP as Vercel reports it (it sets these headers itself, so clients can't fake them there). */
export function clientIp(request: Request): string {
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Counts one attempt against every limit; returns a 429 response when any is used up, otherwise null. */
export async function rateLimit(...limits: Limit[]): Promise<NextResponse | null> {
  let blocked: Limit | undefined;
  for (const limit of limits) {
    try {
      const { data, error } = await (await db()).rpc("hit_rate_limit", { p_key: limit.key, p_limit: limit.max, p_window_seconds: limit.windowSeconds });
      if (error) throw error;
      if (data === false) blocked ??= limit;
    } catch (error) {
      // A broken counter must not lock everyone out of their accounts.
      console.error("Rate limit check failed:", error);
    }
  }
  if (!blocked) return null;
  const minutes = Math.ceil(blocked.windowSeconds / 60);
  return NextResponse.json(
    { error: `Too many attempts. Please wait ${minutes} minutes and try again.` },
    { status: 429, headers: { "retry-after": String(blocked.windowSeconds) } },
  );
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;

/** The limits for each route, in one place. */
export const limits = {
  loginByEmail: (email: string) => ({ key: `login:email:${email}`, max: 10, windowSeconds: 15 * MINUTE }),
  loginByIp: (ip: string) => ({ key: `login:ip:${ip}`, max: 50, windowSeconds: 15 * MINUTE }),
  registerByIp: (ip: string) => ({ key: `register:ip:${ip}`, max: 10, windowSeconds: HOUR }),
  resetEmailByEmail: (email: string) => ({ key: `reset:email:${email}`, max: 3, windowSeconds: HOUR }),
  resetEmailByIp: (ip: string) => ({ key: `reset:ip:${ip}`, max: 20, windowSeconds: HOUR }),
  resetPasswordByIp: (ip: string) => ({ key: `reset-password:ip:${ip}`, max: 20, windowSeconds: HOUR }),
  verifyEmailByUser: (userId: string) => ({ key: `verify:user:${userId}`, max: 5, windowSeconds: HOUR }),
};
