import { NextResponse } from "next/server";
import { loadAppConfig } from "@/lib/server/app-settings";

/** The admin's form choices, extra fields and feature switches, for the mobile app (the website gets them with each page). */
export async function GET() {
  return NextResponse.json(await loadAppConfig());
}
