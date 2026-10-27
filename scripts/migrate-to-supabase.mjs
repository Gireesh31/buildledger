// One-time copy of the old local data (.data/*.json, uploads, avatars) into Supabase.
// Keeps every id, and upserts, so it is safe to run again. The .data folder is left untouched.
// usage: node --env-file=.env.local scripts/migrate-to-supabase.mjs
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const DATA = path.join(process.cwd(), ".data");
const read = (name) => (fs.existsSync(path.join(DATA, name)) ? JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")) : []);
const now = Date.now();

async function upsert(table, rows, onConflict = "id") {
  if (rows.length === 0) return console.log(`${table.padEnd(13)} 0`);
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table.padEnd(13)} ${rows.length}`);
}

const splitName = (name) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { first: first ?? "", last: rest.join(" ") };
};

// Accounts
const users = read("users.json");
const userIds = new Set(users.map((u) => u.id));
const userOrNull = (id) => (userIds.has(id) ? id : null);
await upsert(
  "users",
  users.map((u) => {
    const split = splitName(u.name);
    return {
      id: u.id,
      name: u.name,
      first_name: u.firstName ?? split.first,
      last_name: u.lastName ?? split.last,
      email: u.email,
      phone: u.phone ?? null,
      location: u.location ?? null,
      password_hash: u.passwordHash,
      photo_type: u.photo?.type ?? null,
      photo_updated_at: u.photo?.updatedAt ?? null,
      created_at: u.createdAt,
      onboarded_at: u.onboardedAt ?? null,
    };
  }),
);
const live = (t) => userIds.has(t.userId) && Date.parse(t.expiresAt) > now;
await upsert("sessions", read("sessions.json").filter(live).map((s) => ({ token_hash: s.tokenHash, user_id: s.userId, expires_at: s.expiresAt })), "token_hash");
await upsert("reset_tokens", read("reset-tokens.json").filter(live).map((t) => ({ token_hash: t.tokenHash, user_id: t.userId, expires_at: t.expiresAt })), "token_hash");

// Projects and team
const projects = read("projects.json").filter((p) => userIds.has(p.ownerId));
const projectIds = new Set(projects.map((p) => p.id));
await upsert(
  "projects",
  projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    location: p.location ?? null,
    project_type: p.projectType ?? null,
    status: p.status ?? "planning",
    budget: p.budget ?? null,
    area_sqft: p.areaSqft ?? null,
    start_date: p.startDate ?? null,
    end_date: p.endDate ?? null,
    owner_id: p.ownerId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  })),
);
await upsert(
  "invites",
  read("invites.json")
    .filter((i) => projectIds.has(i.projectId))
    .map((i) => ({ id: i.id, project_id: i.projectId, email: i.email, role: i.role, invited_by: userOrNull(i.invitedBy), created_at: i.createdAt })),
);

// Ledgers
const records = [];
for (const collection of ["materials", "transport", "workers", "attendance", "dailyLogs"]) {
  for (const r of read(`${collection}.json`)) {
    if (!projectIds.has(r.projectId)) continue;
    const { id, projectId, createdBy, createdAt, updatedAt, ...data } = r;
    records.push({ id, collection, project_id: projectId, data, created_by: userOrNull(createdBy), created_at: createdAt, updated_at: updatedAt });
  }
}
await upsert("records", records);

// Uploaded files: rows plus the files themselves
const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/heic": ".heic", "application/pdf": ".pdf" };
const attachments = read("attachments.json").filter((a) => projectIds.has(a.projectId));
let files = 0;
for (const a of attachments) {
  const name = `${a.id}${EXT[a.mimeType] ?? ""}`;
  const local = path.join(DATA, "uploads", a.projectId, name);
  if (!fs.existsSync(local)) continue;
  const { error } = await supabase.storage.from("uploads").upload(`${a.projectId}/${name}`, fs.readFileSync(local), { contentType: a.mimeType, upsert: true });
  if (error) throw new Error(`upload ${name}: ${error.message}`);
  files++;
}
await upsert(
  "attachments",
  attachments.map((a) => ({
    id: a.id,
    project_id: a.projectId,
    kind: a.kind,
    file_name: a.fileName,
    mime_type: a.mimeType,
    size: a.size,
    collection: a.collection ?? null,
    record_id: a.recordId ?? null,
    caption: a.caption ?? null,
    uploaded_by: userOrNull(a.uploadedBy),
    created_at: a.createdAt,
  })),
);
console.log(`upload files  ${files}`);

// Profile photos
let photos = 0;
for (const u of users.filter((u) => u.photo)) {
  const local = path.join(DATA, "avatars", u.id);
  if (!fs.existsSync(local)) continue;
  const { error } = await supabase.storage.from("avatars").upload(u.id, fs.readFileSync(local), { contentType: u.photo.type, upsert: true });
  if (error) throw new Error(`avatar ${u.id}: ${error.message}`);
  photos++;
}
console.log(`photos        ${photos}`);
console.log("Done. Your old .data folder was not changed.");
