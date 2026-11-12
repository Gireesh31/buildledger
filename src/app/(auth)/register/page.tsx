import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/form";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { googleConfig } from "@/lib/server/google";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard title="Create account" subtitle="Track every rupee on your construction sites.">
      <RegisterForm google={googleConfig() !== null} />
      <span hidden data-hide-footer />
    </AuthCard>
  );
}
