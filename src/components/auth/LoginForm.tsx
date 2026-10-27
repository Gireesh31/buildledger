"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormMessage, safeRedirectPath, sendJson, SubmitButton, TextField } from "./form";

export function LoginForm() {
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await sendJson("/api/auth/login", {
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <div className="flex flex-col gap-1">
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
        <Link href="/forgot-password" className="self-end text-xs text-foreground/60 hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pending={pending}>Sign in</SubmitButton>
      <p className="text-center text-sm text-foreground/60">
        No account?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
