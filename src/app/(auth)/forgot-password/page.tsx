import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/form";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot password" subtitle="Enter your email and we'll send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
