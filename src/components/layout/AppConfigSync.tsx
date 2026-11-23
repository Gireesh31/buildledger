"use client";

import { applyAppConfig, type AppConfig } from "@/lib/app-config";

/**
 * Installs the admin's settings (form choices, extra fields, feature switches) in the browser, so
 * forms, tables and PDF exports rendered after it use them. Render it before the parts that need them.
 */
export function AppConfigSync({ config }: { config: AppConfig }) {
  applyAppConfig(config);
  return null;
}
