import Link from "next/link";
import { buttonClass } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/server/session";
import { SignOutButton } from "./SignOutButton";

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="animate-fade-in flex items-center gap-2 text-sm">
        <Link href="/login" className={buttonClass("ghost")}>
          Sign in
        </Link>
        <Link href="/register" className={buttonClass("primary")}>
          Create account
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="animate-fade-in flex items-center gap-3 text-sm">
      {!user.onboardedAt && (
        <Link href="/onboarding" className={buttonClass("primary", "sm")}>
          Finish setup
        </Link>
      )}
      <Link href="/profile" className="group flex items-center gap-2 rounded-full pr-2 transition-colors hover:bg-brand-soft" title="Your profile">
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-sky-500 text-xs font-semibold text-white transition-transform group-hover:scale-105"
        >
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden text-foreground/80 sm:inline">{user.name}</span>
        <span className="sr-only sm:hidden">Your profile</span>
      </Link>
      <SignOutButton />
    </div>
  );
}
