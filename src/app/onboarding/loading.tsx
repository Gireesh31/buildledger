// Suspense boundary for each onboarding step, so moving between steps is instant.
export default function OnboardingStepLoading() {
  return <p className="text-sm text-foreground/60">Loading…</p>;
}
