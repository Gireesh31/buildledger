import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/form";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Reset password" subtitle="Choose a new password for your account.">
      {/* The token comes from the URL, which is only known at request time. */}
      <Suspense fallback={<p className="text-sm text-foreground/60">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
