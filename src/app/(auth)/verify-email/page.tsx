import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/form";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = { title: "Confirm email" };

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Confirm email">
      {/* The token comes from the URL, which is only known at request time. */}
      <Suspense fallback={<p className="text-sm text-foreground/60">Loading…</p>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}
