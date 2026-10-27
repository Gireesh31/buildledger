"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { FormMessage, sendJson, SubmitButton, TextField } from "./form";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="error">This reset link is missing its token.</FormMessage>
        <Link href="/forgot-password" className="text-center text-sm font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="success">Your password has been updated.</FormMessage>
        <Link
          href="/login"
          className="rounded-md bg-foreground px-4 py-2 text-center text-sm font-medium text-background"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await sendJson("/api/auth/reset-password", { token, password: form.get("password") });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
      />
      <TextField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
      />
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
