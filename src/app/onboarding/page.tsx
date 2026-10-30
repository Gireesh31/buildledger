import { stagger } from "@/components/ui/primitives";
import Link from "next/link";
import { FinishOnboardingButton } from "@/components/onboarding/FinishOnboardingButton";
import { getCurrentUser } from "@/lib/server/session";

const nextSteps = [
  { title: "Add your site", body: "Project name, location and type of construction." },
  { title: "Set budget and timeline", body: "Total budget, built-up area and dates, so you can track cost per sq ft." },
  { title: "Invite your team", body: "Engineers, supervisors or partners as editors or viewers." },
];

export default async function WelcomePage() {
  // The layout already guarantees a signed-in user.
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user?.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-foreground/60">
          BuildLedger tracks materials, labour, transport and daily progress for your construction sites. Let&apos;s set up your
          first project. It takes about a minute.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {nextSteps.map((step, index) => (
          <li key={step.title} className="animate-fade-up flex gap-3 rounded-xl border border-foreground/[0.07] bg-brand-soft/40 p-3" style={stagger(index, 80)}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-foreground/60">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between gap-4">
        <FinishOnboardingButton href="/">Skip for now</FinishOnboardingButton>
        <Link
          href="/onboarding/create-project"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-strong active:scale-[0.97]"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
