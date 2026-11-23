import { NextResponse } from "next/server";
import { parseFeatures, parseFormConfig } from "@/lib/app-config";
import { requireAdmin } from "@/lib/server/access";
import { loadAppConfig, saveAppSetting } from "@/lib/server/app-settings";

/** The current settings. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  return NextResponse.json(await loadAppConfig());
}

/** Saves { forms } and/or { features }. Each replaces that setting as a whole. */
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || (!("forms" in body) && !("features" in body))) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }
  // Check both before saving either.
  const forms = "forms" in body ? parseFormConfig(body.forms) : undefined;
  if (forms && !forms.ok) return NextResponse.json({ error: forms.error }, { status: 400 });
  const features = "features" in body ? parseFeatures(body.features) : undefined;
  if (features === null) return NextResponse.json({ error: "Invalid feature switches." }, { status: 400 });

  if (forms?.ok) await saveAppSetting("forms", forms.forms, admin.user.id);
  if (features) await saveAppSetting("features", features, admin.user.id);
  return NextResponse.json(await loadAppConfig());
}
