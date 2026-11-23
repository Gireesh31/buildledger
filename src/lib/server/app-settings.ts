import { NextResponse } from "next/server";
import {
  ANNOUNCEMENT_MEDIA_TYPES,
  applyAppConfig,
  defaultAppConfig,
  featureList,
  isFeatureOn,
  type Announcement,
  type AnnouncementMedia,
  type AppConfig,
  type FeatureKey,
  type Features,
} from "@/lib/app-config";
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
  media: { type: AnnouncementMedia["type"]; path: string }[] | null;
  created_at: string;
  updated_at: string;
}

// Images and videos on announcements: a public bucket, written only by the server or with a signed upload URL.
const MEDIA_BUCKET = "announcement-media";

const mediaUrl = (path: string) => `${(process.env.SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;

/** A one-time upload address for a new file, so big videos go straight to storage (not through this server). */
export async function createMediaUpload(contentType: string): Promise<{ path: string; uploadUrl: string; url: string; type: AnnouncementMedia["type"] } | null> {
  const kind = ANNOUNCEMENT_MEDIA_TYPES[contentType];
  if (!kind) return null;
  const path = `${crypto.randomUUID()}.${kind.ext}`;
  const { data, error } = await (await db()).storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Storage error: ${error?.message ?? "no upload URL"}`);
  return { path, uploadUrl: data.signedUrl, url: mediaUrl(path), type: kind.type };
}

async function removeMediaFiles(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await (await db()).storage.from(MEDIA_BUCKET).remove(paths);
  if (error) console.error("Couldn't delete announcement media:", error.message);
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
  media: (r.media ?? []).map((m) => ({ type: m.type, path: m.path, url: mediaUrl(m.path) })),
  createdAt: iso(r.created_at)!,
  updatedAt: iso(r.updated_at)!,
});

export type AnnouncementInput = Omit<Announcement, "id" | "createdAt" | "updatedAt" | "media"> & { media: Omit<AnnouncementMedia, "url">[] };

const toColumns = (a: AnnouncementInput) => ({
  kind: a.kind,
  title: a.title,
  body: a.body,
  link_url: a.linkUrl ?? null,
  link_label: a.linkLabel ?? null,
  starts_at: a.startsAt ?? null,
  ends_at: a.endsAt ?? null,
  published: a.published,
  media: a.media.map((m) => ({ type: m.type, path: m.path })),
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
  const before = must(await (await db()).from("announcements").select("media").eq("id", id).maybeSingle<Pick<AnnouncementRow, "media">>());
  if (!before) return undefined;
  const row = must(
    await (await db())
      .from("announcements")
      .update({ ...toColumns(input), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle<AnnouncementRow>(),
  );
  // Files taken off the announcement are deleted from storage.
  const kept = new Set(input.media.map((m) => m.path));
  await removeMediaFiles((before.media ?? []).map((m) => m.path).filter((p) => !kept.has(p)));
  return row ? fromRow(row) : undefined;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = must(await (await db()).from("announcements").delete().eq("id", id).select("id, media")) as Pick<AnnouncementRow, "id" | "media">[];
  await removeMediaFiles(rows.flatMap((r) => (r.media ?? []).map((m) => m.path)));
  return rows.length > 0;
}
