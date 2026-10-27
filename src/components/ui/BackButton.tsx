"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./primitives";

/** Goes back to the previous page, or to `fallback` when the page was opened directly. */
export function BackButton({ fallback = "/", label = "Back" }: { fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={buttonClass("ghost", "sm")}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> {label}
    </button>
  );
}
