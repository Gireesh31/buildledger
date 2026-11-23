/**
 * Talks to the BuildLedger website's API (the same accounts, projects and entries as the website).
 * The session token from sign-in is kept in the phone's secure storage and sent as a Bearer header.
 */
import * as SecureStore from "expo-secure-store";
import { Linking, Platform } from "react-native";

/** The website the app reads and writes. Set EXPO_PUBLIC_API_URL to use another (e.g. a local dev server). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "https://buildledger-sable.vercel.app").replace(/\/$/, "");

const TOKEN_KEY = "buildledger-session";
let token: string | null = null;
let onSignedOut: (() => void) | null = null;

// Phones keep the token in secure storage; the web preview (used for testing) has only localStorage.
const web = Platform.OS === "web";
const store = {
  get: () => (web ? Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null) : SecureStore.getItemAsync(TOKEN_KEY)),
  set: (v: string) => (web ? Promise.resolve(globalThis.localStorage?.setItem(TOKEN_KEY, v)) : SecureStore.setItemAsync(TOKEN_KEY, v)),
  remove: () => (web ? Promise.resolve(globalThis.localStorage?.removeItem(TOKEN_KEY)) : SecureStore.deleteItemAsync(TOKEN_KEY)),
};

/** Small settings kept on the phone (e.g. which announcements were closed). */
export const prefs = {
  async get(key: string): Promise<string | null> {
    try {
      return web ? (globalThis.localStorage?.getItem(key) ?? null) : await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string) {
    try {
      if (web) globalThis.localStorage?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      // Not saved: it just shows again next time.
    }
  },
};

export async function loadToken(): Promise<string | null> {
  token = await store.get();
  return token;
}

export async function saveToken(value: string | null) {
  token = value;
  if (value) await store.set(value);
  else await store.remove();
}

/** Headers that sign a request in, e.g. for loading a bill photo straight from the server. */
export const authHeaders = (): Record<string, string> => (token ? { authorization: `Bearer ${token}` } : {});

/** Called when the server says the session has ended, so the app can go back to sign-in. */
export function setSignedOutHandler(handler: (() => void) | null) {
  onSignedOut = handler;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; form?: FormData } = {},
): Promise<T> {
  let response: Response;
  const json = options.body !== undefined;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (json || options.form ? "POST" : "GET"),
      headers: {
        ...(json && { "content-type": "application/json" }),
        ...authHeaders(),
      },
      body: options.form ?? (json ? JSON.stringify(options.body) : undefined),
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

/** Opens a page of the website in the phone's browser (privacy policy, photo credits, reset link pages). */
export const openWebsite = (path: string) => Linking.openURL(`${API_URL}${path}`);

/** Message for any error thrown while calling the API. */
export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong. Please try again.");
