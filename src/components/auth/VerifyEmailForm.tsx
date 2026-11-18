"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormMessage, sendJson } from "./form";

/** Confirms the email as soon as the link from the message is opened. */
export function VerifyEmailForm() {
  const token = useSearchParams().get("token") ?? "";
  const [result, setResult] = useState<{ tone: "error" | "success"; text: string } | null>(
    token ? null : { tone: "error", text: "This link is missing its token." },
  );

  useEffect(() => {
    if (!token) return;
    sendJson<{ message: string }>("/api/auth/verify-email", { token }).then((sent) =>
      setResult(sent.ok ? { tone: "success", text: "Your email is confirmed. Projects shared with you are now open." } : { tone: "error", text: sent.error }),
    );
  }, [token]);

  if (!result) return <p className="text-sm text-foreground/60">Confirming…</p>;
  return (
    <div className="flex flex-col gap-4">
      <FormMessage tone={result.tone}>{result.text}</FormMessage>
      <Link href="/" className="rounded-md bg-foreground px-4 py-2 text-center text-sm font-medium text-background">
        Go to BuildLedger
      </Link>
    </div>
  );
}
