"use client";

import { useState } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";

/** Shown until the email is confirmed: projects shared by invite stay closed until then. */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function resend() {
    setPending(true);
    const sent = await sendJson<{ message: string }>("/api/auth/verify-email/resend", {});
    setPending(false);
    setResult(sent.ok ? { tone: "success", text: sent.data.message } : { tone: "error", text: sent.error });
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
      <p>
        <span className="font-semibold">Confirm your email.</span> Open the link we sent to {email}. Projects that others shared with you open once
        it&apos;s confirmed.
      </p>
      {result && <FormMessage tone={result.tone}>{result.text}</FormMessage>}
      <button type="button" onClick={resend} disabled={pending} className="self-start font-medium text-brand hover:underline disabled:opacity-60">
        {pending ? "Sending…" : "Send the link again"}
      </button>
    </div>
  );
}
