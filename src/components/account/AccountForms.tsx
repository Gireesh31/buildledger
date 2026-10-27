"use client";

import { Camera, Eye, EyeOff, Loader2, Lock, Mail, MapPin, Phone, Trash2, UserRound, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type Ref } from "react";
import { createPortal } from "react-dom";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

type Message = { tone: "error" | "success"; text: string } | null;

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  location: string;
  ownedProjects: number;
}

/** The whole profile in one form: name, phone, email, location and password. */
export function ProfileForm(props: ProfileFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(props.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [deleting, setDeleting] = useState(false);

  // Changing the login email or password needs the current password.
  const needsCurrent = email.trim().toLowerCase() !== props.email || password !== "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    const result = await sendJson<{ passwordChanged: boolean }>(
      "/api/account",
      {
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        phone: form.get("phone"),
        email,
        location: form.get("location"),
        password,
        currentPassword: form.get("currentPassword") ?? "",
      },
      "PUT",
    );
    setPending(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setPassword("");
    setMessage({
      tone: "success",
      text: result.data.passwordChanged ? "Profile saved and password changed. Other devices have been signed out." : "Profile saved.",
    });
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field icon={UserRound} label="First name" name="firstName" defaultValue={props.firstName} autoComplete="given-name" required maxLength={50} />
          <Field icon={UserRound} label="Last name" name="lastName" defaultValue={props.lastName} autoComplete="family-name" maxLength={50} />
          <Field icon={Phone} label="Phone number" name="phone" type="tel" inputMode="tel" defaultValue={props.phone} autoComplete="tel" placeholder="98765 43210" maxLength={20} />
          <Field icon={Mail} label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <Field icon={MapPin} label="Location" name="location" defaultValue={props.location} autoComplete="address-level2" placeholder="City, state" maxLength={100} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground/80">Password</span>
            <span className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                placeholder="Leave blank to keep current password"
                className={`${inputClass} pl-9 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-foreground/50 hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {needsCurrent && (
            <div className="animate-scale-in sm:col-span-2">
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <Field
                  icon={Lock}
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  hint="Needed because you're changing your email or password."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.07] pt-5">
          <button type="button" onClick={() => setDeleting(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-critical hover:underline">
            <Trash2 className="h-4 w-4" aria-hidden /> Delete account
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Portal: the animated card would otherwise trap the fixed overlay inside it. */}
      {deleting && createPortal(<DeleteAccountDialog ownedProjects={props.ownedProjects} onClose={() => setDeleting(false)} />, document.body)}
    </>
  );
}

function Field({
  icon: Icon,
  label,
  hint,
  ...input
}: { icon: LucideIcon; label: string; hint?: string; ref?: Ref<HTMLInputElement> } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground/80">
        {label}
        {input.required && <span className="text-critical"> *</span>}
      </span>
      <span className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden />
        <input {...input} className={`${inputClass} pl-9`} />
      </span>
      {hint && <span className="text-xs text-foreground/60">{hint}</span>}
    </label>
  );
}

/** Confirmation pop-up: password + typing DELETE. */
function DeleteAccountDialog({ ownedProjects, onClose }: { ownedProjects: number; onClose: () => void }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await sendJson("/api/account", { password: form.get("password"), confirm }, "DELETE");
    if (!result.ok) {
      setPending(false);
      return setError(result.error);
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in w-full max-w-md rounded-2xl border border-critical/25 bg-surface p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="delete-title" className="text-lg font-semibold">
            Delete your account?
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-foreground/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-foreground/70">
          This permanently deletes your account
          {ownedProjects > 0 && ` and the ${ownedProjects} project${ownedProjects === 1 ? "" : "s"} you own, with all their materials, labour, transport, logs and files`}.
          You&apos;ll lose access to projects shared with you. This can&apos;t be undone.
        </p>
        {error && (
          <div className="mb-4">
            <FormMessage tone="error">{error}</FormMessage>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Field ref={firstField} icon={Lock} label="Your password" name="password" type="password" autoComplete="current-password" required />
          <Field icon={Trash2} label='Type "DELETE" to confirm' name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" required />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonClass("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={pending || confirm !== "DELETE"} className={buttonClass("danger")}>
            {pending ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </form>
    </div>
  );
}

const PHOTO_SIZE = 320;

/** Centre-crops the chosen image to a small square JPEG, so uploads stay tiny and look right in round avatars. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.88));
}

/** The profile avatar: shows the photo (or initials) with buttons to upload or remove a photo. */
export function ProfilePhoto({ photoUrl, initials }: { photoUrl?: string; initials: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setPending("upload");
    try {
      const form = new FormData();
      form.append("photo", await toSquareJpeg(file), "photo.jpg");
      const response = await fetch("/api/account/photo", { method: "POST", body: form });
      if (!response.ok) setError((await response.json().catch(() => null))?.error ?? "Couldn't upload the photo.");
      else router.refresh();
    } catch {
      setError("Couldn't read that image. Try a JPG or PNG photo.");
    }
    setPending(null);
  }

  async function remove() {
    setError(null);
    setPending("remove");
    const response = await fetch("/api/account/photo", { method: "DELETE" });
    if (!response.ok) setError("Couldn't remove the photo.");
    else router.refresh();
    setPending(null);
  }

  return (
    <div className="flex items-end gap-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending !== null}
        title={photoUrl ? "Change photo" : "Add photo"}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-gradient-to-br from-teal-500 to-sky-500 text-xl font-semibold text-white shadow-lg"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your profile photo" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{initials || "?"}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-5 w-5" aria-hidden />
        </span>
        <span aria-hidden className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand shadow ring-2 ring-surface">
          <Camera className="h-3.5 w-3.5" />
        </span>
        {pending && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Loader2 className="h-5 w-5 animate-spin" aria-hidden /></span>}
        <span className="sr-only">{photoUrl ? "Change profile photo" : "Add profile photo"}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      <div className="flex flex-col items-start gap-0.5 pb-1 text-xs">
        {photoUrl && (
          <button type="button" onClick={remove} disabled={pending !== null} className="inline-flex items-center gap-1 text-foreground/60 hover:text-critical">
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
          </button>
        )}
        {error && <span className="max-w-48 text-critical">{error}</span>}
      </div>
    </div>
  );
}
