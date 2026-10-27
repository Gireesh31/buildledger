import { Logo } from "@/components/layout/AppHeader";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 relative overflow-hidden bg-gradient-to-br from-orange-50 via-background to-teal-50 dark:from-orange-500/[0.06] dark:via-background dark:to-teal-500/[0.06] px-4 py-16">
      <div aria-hidden className="animate-float pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />
      <div aria-hidden className="animate-float pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl [animation-delay:-4s]" />
      <div className="relative">
        <Logo size="lg" />
      </div>
      <div className="relative flex w-full justify-center">{children}</div>
    </main>
  );
}
