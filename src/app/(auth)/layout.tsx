import { Logo } from "@/components/layout/AppHeader";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 relative px-4 py-16">
      <div className="relative">
        <Logo size="lg" />
      </div>
      <div className="relative flex w-full justify-center">{children}</div>
    </main>
  );
}
