import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/form";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" subtitle="Welcome back. Sign in to your account.">
      {/* Reads ?next= from the URL, which is only known at request time. */}
      <Suspense fallback={<p className="text-sm text-foreground/60">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
