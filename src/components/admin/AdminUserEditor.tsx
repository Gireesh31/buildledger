"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, Card, inputClass } from "@/components/ui/primitives";
import type { User } from "@/lib/types";

type Message = { tone: "error" | "success"; text: string } | null;

export function AdminUserEditor({
  user,
  isSelf,
  ownedProjects,
}: {
  user: User;
  isSelf: boolean;
  /** Deleting the account deletes these too. */
  ownedProjects: number;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    location: user.location ?? "",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [confirmText, setConfirmText] = useState("");

  async function save(changes: Record<string, unknown>, done: string) {
    setPending(true);
    setMessage(null);
    const result = await sendJson(`/api/admin/users/${user.id}`, changes, "PATCH");
    setPending(false);
    setMessage(result.ok ? { tone: "success", text: done } : { tone: "error", text: result.error });
    if (result.ok) router.refresh();
  }

  async function remove() {
    setPending(true);
    const result = await sendJson<{ deletedProjects: number }>(`/api/admin/users/${user.id}`, { confirm: confirmText }, "DELETE");
    setPending(false);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    router.push("/admin/users");
    router.refresh();
  }

  const field = (key: keyof typeof profile, label: string, type = "text") => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground/80">{label}</span>
      <input type={type} value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} className={inputClass} />
    </label>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
        <Card title="Profile">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save(profile, "Profile saved. The change shows on the website and in the app.");
            }}
          >
            {field("firstName", "First name")}
            {field("lastName", "Last name")}
            {field("email", "Email", "email")}
            {field("phone", "Phone", "tel")}
            <div className="sm:col-span-2">{field("location", "Location")}</div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={pending} className={buttonClass("primary")}>
                <Save className="h-4 w-4" aria-hidden /> Save profile
              </button>
            </div>
          </form>
        </Card>

      </div>

      <div className="flex flex-col gap-6">
        <Card title="Access">
          <div className="flex flex-col gap-4 text-sm">
            <Toggle
              label="Email verified"
              hint="Verified people can open projects shared with their email."
              checked={Boolean(user.emailVerifiedAt)}
              disabled={pending}
              onChange={(verified) => save({ verified }, verified ? "Email marked verified." : "Email marked unverified.")}
            />
            <Toggle
              label="Admin"
              hint={isSelf ? "You can't remove your own admin access." : "Admins can open this panel and every project."}
              checked={Boolean(user.isAdmin)}
              disabled={pending || isSelf}
              onChange={(isAdmin) => save({ isAdmin }, isAdmin ? `${user.name} is now an admin.` : `${user.name} is no longer an admin.`)}
            />
            <Toggle
              label="Disabled"
              hint={isSelf ? "You can't disable your own account." : "Signs them out everywhere and blocks sign-in on the website and the app."}
              checked={Boolean(user.disabledAt)}
              disabled={pending || isSelf}
              onChange={(disabled) => save({ disabled }, disabled ? "Account disabled and signed out everywhere." : "Account enabled again.")}
            />
          </div>
        </Card>

        {!isSelf && (
          <Card title="Delete account">
            <p className="mb-3 text-sm text-foreground/70">
              Deletes the account and the {ownedProjects === 1 ? "project" : `${ownedProjects} projects`} it owns, with every entry and file. This can’t be undone.
            </p>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE" className={inputClass} aria-label="Type DELETE to confirm" />
            <button type="button" onClick={remove} disabled={pending || confirmText !== "DELETE"} className={`${buttonClass("danger")} mt-3 w-full`}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete account
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`flex items-start justify-between gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span>
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-xs text-foreground/60">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-foreground/20 transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-brand checked:before:translate-x-[18px] disabled:cursor-not-allowed"
      />
    </label>
  );
}
