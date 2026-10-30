import { SiteLoader } from "@/components/ui/SiteLoader";

// Suspense boundary for each onboarding step, so moving between steps is instant.
export default function OnboardingStepLoading() {
  return <SiteLoader className="py-6" />;
}
