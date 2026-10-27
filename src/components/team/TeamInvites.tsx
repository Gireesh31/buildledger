"use client";

import { useState, type FormEvent } from "react";
import { FormMessage, sendJson } from "@/components/auth/form";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import type { Invite, InviteRole } from "@/lib/types";

interface TeamInvitesProps {
  projectId: string;
  initialInvites: Invite[];
  /** Emails that already have an account, shown as "Joined" instead of "Pending". */
  joinedEmails: string[];
  canManage: boolean;
}

export function TeamInvites({ projectId, initialInvites, joinedEmails, canManage }: TeamInvitesProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<InviteRole>("editor");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const joined = new Set(joinedEmails);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const list = emails
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);
    if (list.length === 0) return;

    setPending(true);
    setError(null);
    setNotice(null);
    const result = await sendJson<Invite[]>(`/api/projects/${projectId}/invites`, { emails: list, role });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInvites((current) => [...current, ...result.data]);
    setEmails("");
    const skipped = list.length - result.data.length;
    setNotice(
      `${result.data.length} invite${result.data.length === 1 ? "" : "s"} added.` +
        (skipped > 0 ? ` ${skipped} skipped (already invited or your own email).` : "") +
        " They get access when they sign in with that email.",
    );
  }

  async function removeInvite(id: string) {
    if (!confirm("Remove this person's access?")) return;
    const response = await fetch(`/api/projects/${projectId}/invites/${id}`, { method: "DELETE" });
    if (response.ok) setInvites((current) => current.filter((invite) => invite.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <FormMessage tone="error">{error}</FormMessage>}
          {notice && <FormMessage tone="success">{notice}</FormMessage>}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground/80">Email addresses</span>
            <textarea
              rows={2}
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              placeholder="engineer@example.com, supervisor@example.com"
              className={inputClass}
            />
            <span className="text-xs text-foreground/50">Separate multiple addresses with commas or spaces.</span>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-foreground/80">Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as InviteRole)} className={inputClass}>
                <option value="editor">Editor: can add and edit entries</option>
                <option value="viewer">Viewer: can only view and export</option>
              </select>
            </label>
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? "Adding…" : "Invite"}
            </button>
          </div>
        </form>
      )}

      {invites.length > 0 && (
        <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/10">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">{invite.email}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs capitalize text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">{invite.role}</span>
                <span className={`text-xs ${joined.has(invite.email) ? "text-good" : "text-foreground/50"}`}>
                  {joined.has(invite.email) ? "✓ Joined" : "Pending"}
                </span>
                {canManage && (
                  <button onClick={() => removeInvite(invite.id)} aria-label={`Remove ${invite.email}`} className="text-foreground/50 hover:text-foreground">
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
