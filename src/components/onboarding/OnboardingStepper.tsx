"use client";

import { usePathname } from "next/navigation";

const steps = [
  { label: "Welcome", matches: (path: string) => path === "/onboarding" },
  { label: "Create project", matches: (path: string) => path === "/onboarding/create-project" },
  { label: "Budget & timeline", matches: (path: string) => path.endsWith("/setup") },
  { label: "Invite team", matches: (path: string) => path.endsWith("/invite") },
];

export function OnboardingStepper() {
  const pathname = usePathname();
  const current = Math.max(
    0,
    steps.findIndex((step) => step.matches(pathname)),
  );

  return (
    <ol className="flex w-full max-w-xl items-center gap-2" aria-label="Onboarding progress">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li key={step.label} className="flex flex-1 flex-col gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={`h-1.5 rounded-full transition-colors duration-500 ${state === "upcoming" ? "bg-foreground/10" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}
            />
            <span
              className={`text-xs ${state === "current" ? "font-medium text-brand" : "text-foreground/50"}`}
            >
              {index + 1}. {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
