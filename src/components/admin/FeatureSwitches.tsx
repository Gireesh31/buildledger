"use client";

import { useState } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { Card } from "@/components/ui/primitives";
import { featureList, type AppConfig, type Features } from "@/lib/app-config";
import { Toggle } from "./AdminUserEditor";

export function FeatureSwitches({ initial }: { initial: Features }) {
  const [features, setFeatures] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function set(key: keyof Features, on: boolean) {
    const next = { ...features, [key]: on };
    setPending(true);
    setMessage(null);
    const result = await sendJson<AppConfig>("/api/admin/settings", { features: next }, "PUT");
    setPending(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setFeatures(result.data.features);
    const name = featureList.find((f) => f.key === key)?.label;
    setMessage({ tone: "success", text: `${name} is now ${on ? "on" : "off"} for everyone.` });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <Card>
        <div className="flex flex-col divide-y divide-foreground/10 text-sm">
          {featureList.map((f) => (
            <div key={f.key} className="py-3 first:pt-0 last:pb-0">
              <Toggle label={f.label} hint={f.description} checked={features[f.key]} disabled={pending} onChange={(on) => set(f.key, on)} />
            </div>
          ))}
        </div>
      </Card>
      <p className="text-xs text-foreground/60">Materials and the project overview are always on.</p>
    </div>
  );
}
