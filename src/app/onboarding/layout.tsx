import type { Metadata } from "next";
import { Logo } from "@/components/layout/AppHeader";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Get started" };

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 relative overflow-hidden bg-gradient-to-br from-orange-50 via-background to-teal-50 dark:from-orange-500/[0.06] dark:via-background dark:to-teal-500/[0.06] px-4 py-12">
      <Logo />
      <Suspense fallback={null}>
        <OnboardingStepper />
      </Suspense>
      <div className="animate-fade-up w-full max-w-xl rounded-2xl border border-foreground/[0.07] bg-surface p-8 shadow-xl shadow-orange-500/10">
        <Suspense fallback={<p className="text-sm text-foreground/60">Loading…</p>}>
          <RequireUser>{children}</RequireUser>
        </Suspense>
      </div>
    </main>
  );
}

async function RequireUser({ children }: { children: ReactNode }) {
  if (!(await getCurrentUser())) redirect("/login?next=/onboarding");
  return children;
}
