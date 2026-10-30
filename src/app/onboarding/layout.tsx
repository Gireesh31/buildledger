import type { Metadata } from "next";
import { Logo } from "@/components/layout/AppHeader";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { getCurrentUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Get started" };

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 relative px-4 py-12">
      <Logo />
      <Suspense fallback={null}>
        <OnboardingStepper />
      </Suspense>
      <div className="animate-fade-up w-full max-w-xl rounded-xl border border-foreground/[0.07] bg-surface p-8 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.12)]">
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
