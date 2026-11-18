"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FormMessage, sendJson, SubmitButton, TextField } from "./form";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await sendJson<{ message: string }>("/api/auth/forgot-password", {
      email: form.get("email"),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(result.data);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="success">{sent.message}</FormMessage>
        <Link href="/login" className="text-center text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
      <Link href="/login" className="text-center text-sm text-foreground/60 hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
