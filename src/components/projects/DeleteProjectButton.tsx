"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/primitives";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    const typed = prompt(`This permanently deletes "${projectName}" with all its materials, labour, transport, logs and files.\n\nType the project name to confirm:`);
    if (typed?.trim() !== projectName) return;
    setPending(true);
    const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (!response.ok) {
      setPending(false);
      alert((await response.json().catch(() => ({}))).error ?? "Couldn't delete the project.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} disabled={pending} className={buttonClass("danger")}>
      {pending ? "Deleting…" : "Delete project"}
    </button>
  );
}
