"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Marks onboarding as done, then navigates. Used for both "Skip" and "Finish". */
export function FinishOnboardingButton({
  href,
  variant = "link",
  children,
}: {
  href: string;
  variant?: "link" | "primary";
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function finish() {
    setPending(true);
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push(href);
    router.refresh();
  }

  const styles =
    variant === "primary"
      ? "rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-strong active:scale-[0.97] disabled:opacity-50"
      : "text-sm text-foreground/60 hover:underline disabled:opacity-50";

  return (
    <button type="button" onClick={finish} disabled={pending} className={styles}>
      {pending ? "Please wait…" : children}
    </button>
  );
}
