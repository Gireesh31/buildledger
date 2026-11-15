/**
 * Talks to the BuildLedger website's API (the same accounts, projects and entries as the website).
 * The session token from sign-in is kept in the phone's secure storage and sent as a Bearer header.
 */
import * as SecureStore from "expo-secure-store";

/** The website the app reads and writes. Set EXPO_PUBLIC_API_URL to use another (e.g. a local dev server). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://buildledger-sable.vercel.app").replace(/\/$/, "");

const TOKEN_KEY = "buildledger-session";
let token: string | null = null;
let onSignedOut: (() => void) | null = null;

export async function loadToken(): Promise<string | null> {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}

export async function saveToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Called when the server says the session has ended, so the app can go back to sign-in. */
export function setSignedOutHandler(handler: (() => void) | null) {
  onSignedOut = handler;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, options: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: {
        ...(options.body !== undefined && { "content-type": "application/json" }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Sign-in rides on the Bearer token only, never on cookies.
      credentials: "omit",
    });
  } catch {
    throw new ApiError("Can't reach BuildLedger. Check your internet connection.", 0);
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) onSignedOut?.();
    throw new ApiError((data as { error?: string }).error ?? "Something went wrong. Please try again.", response.status);
  }
  return data as T;
}

/** Message for any error thrown while calling the API. */
export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong. Please try again.");
