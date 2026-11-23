import { NextResponse } from "next/server";
import { applyAppConfig, defaultAppConfig, featureList, isFeatureOn, type Announcement, type AppConfig, type FeatureKey, type Features } from "@/lib/app-config";
import type { FormConfig } from "@/lib/collections";
import { db, iso, isUuid, must } from "./supabase";

// Settings change rarely; each server instance re-reads them at most this often.
const TTL_MS = 10_000;
let cached: { config: AppConfig; at: number } | undefined;

/** The admin's settings, applied to this server so validation and pages use them. */
export async function loadAppConfig(): Promise<AppConfig> {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const rows = must(await (await db()).from("app_settings").select("key, value")) as { key: string; value: unknown }[];
    const get = (key: string) => rows.find((r) => r.key === key)?.value;
    cached = {
      config: {
        forms: (get("forms") as FormConfig | undefined) ?? {},
        features: { ...defaultAppConfig.features, ...((get("features") as Partial<Features> | undefined) ?? {}) },
      },
      at: Date.now(),
    };
  }
  applyAppConfig(cached.config);
  return cached.config;
}

export async function saveAppSetting(key: "forms" | "features", value: unknown, userId: string) {
  must(await (await db()).from("app_settings").upsert({ key, value, updated_at: new Date().toISOString(), updated_by: userId }));
  cached = undefined;
  await loadAppConfig();
}

/** For route handlers: a 403 when an admin has switched the feature off. */
export async function featureOff(key: FeatureKey | undefined): Promise<NextResponse | null> {
  if (!key) return null;
  await loadAppConfig();
  if (isFeatureOn(key)) return null;
  const name = featureList.find((f) => f.key === key)?.label ?? key;
  return NextResponse.json({ error: `${name} is turned off right now.` }, { status: 403 });
}

// --- Announcements -----------------------------------------------------------------------------

interface AnnouncementRow {
  id: string;
  kind: Announcement["kind"];
  title: string;
  body: string;
  link_url: string | null;
  link_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const fromRow = (r: AnnouncementRow): Announcement => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body,
  ...(r.link_url && { linkUrl: r.link_url }),
  ...(r.link_label && { linkLabel: r.link_label }),
  ...(r.starts_at && { startsAt: iso(r.starts_at) }),
  ...(r.ends_at && { endsAt: iso(r.ends_at) }),
  published: r.published,
  createdAt: iso(r.created_at)!,
  updatedAt: iso(r.updated_at)!,
});

export type AnnouncementInput = Omit<Announcement, "id" | "createdAt" | "updatedAt">;

const toColumns = (a: AnnouncementInput) => ({
  kind: a.kind,
  title: a.title,
  body: a.body,
  link_url: a.linkUrl ?? null,
  link_label: a.linkLabel ?? null,
  starts_at: a.startsAt ?? null,
  ends_at: a.endsAt ?? null,
  published: a.published,
});

/** What signed-in users see now: published, started and not yet ended. */
export async function listLiveAnnouncements(): Promise<Announcement[]> {
  const now = new Date().toISOString();
  const rows = must(
    await (await db())
      .from("announcements")
      .select("*")
      .eq("published", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(5),
  ) as AnnouncementRow[];
  return rows.map(fromRow);
}

export async function listAllAnnouncements(): Promise<Announcement[]> {
  const rows = must(await (await db()).from("announcements").select("*").order("created_at", { ascending: false })) as AnnouncementRow[];
  return rows.map(fromRow);
}

export async function createAnnouncement(input: AnnouncementInput, userId: string): Promise<Announcement> {
  const row = must(await (await db()).from("announcements").insert({ ...toColumns(input), created_by: userId }).select("*").single<AnnouncementRow>());
  return fromRow(row!);
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<Announcement | undefined> {
  if (!isUuid(id)) return undefined;
  const row = must(
    await (await db())
      .from("announcements")
      .update({ ...toColumns(input), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle<AnnouncementRow>(),
  );
  return row ? fromRow(row) : undefined;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = must(await (await db()).from("announcements").delete().eq("id", id).select("id")) as { id: string }[];
  return rows.length > 0;
}
