import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  FileText,
  HardHat,
  IndianRupee,
  MapPin,
  Package,
  ScanLine,
  Smartphone,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { buttonClass, stagger } from "@/components/ui/primitives";
import { HeroSkyline } from "./HeroSkyline";
import { HouseBuild } from "./HouseBuild";
import { LandingBackdrop } from "./LandingBackdrop";

// Sample site shown in the hero preview. Figures are illustrative, in the app's own format.
const sampleEntries = [
  { image: "/photos/materials/cement.webp", name: "OPC 53 cement", detail: "120 bags × ₹390", amount: "₹46,800", tag: "Material" },
  { image: "/photos/materials/steel.webp", name: "TMT bars, 12 mm", detail: "1.2 t × ₹65,500", amount: "₹78,600", tag: "Material" },
  { image: "/photos/vehicles/jcb.webp", name: "JCB 3DX", detail: "3 hrs × ₹1,200", amount: "₹3,600", tag: "Transport" },
  { image: "/photos/materials/bricks.webp", name: "Wire-cut bricks", detail: "4,000 × ₹9", amount: "₹36,000", tag: "Material" },
];

const marquee = [
  ["cement", "Cement"],
  ["steel", "TMT steel"],
  ["sand", "M-sand"],
  ["aggregate", "20 mm aggregate"],
  ["bricks", "Bricks"],
  ["tiles", "Tiles"],
  ["plumbing", "Plumbing"],
  ["electrical", "Electrical"],
  ["paint", "Paint"],
  ["wood", "Wood"],
] as const;

const vehicles = ["jcb", "truck", "mixer", "crane"] as const;

function SitePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0">
      <div className="animate-fade-up overflow-hidden rounded-2xl border border-foreground/10 bg-surface shadow-raised" style={stagger(2, 120)}>
        {/* Window bar */}
        <div className="flex items-center justify-between gap-3 border-b border-foreground/[0.07] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <HardHat className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Sharma Residence</p>
              <p className="flex items-center gap-1 truncate text-xs text-foreground/55">
                <MapPin className="h-3 w-3" aria-hidden /> Kakkanad, Kochi · G+1 · 2,400 sq ft
              </p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> Active
          </span>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-px bg-foreground/[0.07]">
          <div className="bg-surface px-4 py-4 sm:px-5">
            <p className="eyebrow text-foreground/50">Spent</p>
            <p className="font-display mt-1 text-2xl font-semibold sm:text-[1.7rem]">
              <CountUp value={3842600} delay={500} />
            </p>
          </div>
          <div className="bg-surface px-4 py-4 sm:px-5">
            <p className="eyebrow text-foreground/50">Budget left</p>
            <p className="font-display mt-1 text-2xl font-semibold sm:text-[1.7rem]">
              <CountUp value={1657400} delay={650} />
            </p>
          </div>
        </div>
        <div className="border-b border-foreground/[0.07] px-4 pb-4 sm:px-5">
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div className="meter-fill h-full rounded-full bg-brand" style={{ width: "70%" }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-foreground/55">
            <span>70% of ₹55,00,000</span>
            <span className="tabular-nums">₹1,601 / sq ft</span>
          </div>
        </div>

        {/* Today's entries */}
        <div className="px-4 pt-3 sm:px-5">
          <p className="eyebrow text-foreground/50">Today · 30 Oct</p>
        </div>
        <ul className="divide-y divide-foreground/[0.06] px-2 pb-2 sm:px-3 sm:pb-9">
          {sampleEntries.map((entry, i) => (
            <li key={entry.name} className="animate-fade-up flex items-center gap-3 rounded-lg px-2 py-2.5" style={stagger(i + 4, 110)}>
              <Image src={entry.image} alt="" width={44} height={44} className="product-stage h-11 w-11 shrink-0 rounded-lg object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.name}</p>
                <p className="truncate text-xs text-foreground/55 tabular-nums">{entry.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{entry.amount}</p>
                <p className="text-[11px] text-foreground/45">{entry.tag}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating notes around the card */}
      <div className="animate-fade-up absolute -bottom-6 left-5 hidden sm:block xl:-left-10" style={stagger(8, 120)}>
        <div className="float-slow flex items-center gap-2.5 rounded-xl border border-foreground/10 bg-surface px-3.5 py-2.5 shadow-raised">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <ScanLine className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-xs">
            <p className="font-semibold">Bill scanned</p>
            <p className="text-foreground/55">4 fields filled in</p>
          </div>
        </div>
      </div>
      <div className="animate-fade-up absolute -bottom-6 -right-3 hidden sm:block xl:-right-10" style={stagger(9, 120)}>
        <div className="float-slow flex items-center gap-2.5 rounded-xl bg-foreground px-3.5 py-2.5 text-background shadow-raised [animation-delay:-4s]">
          <Users className="h-4 w-4 text-brand" aria-hidden />
          <div className="text-xs">
            <p className="font-semibold tabular-nums">₹12,400 owed</p>
            <p className="opacity-60">6 masons · this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <HeroSkyline />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-[190px] pt-12 sm:pb-[230px] sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-[250px] lg:pt-20">
        <div className="text-center lg:text-left">
          <p className="eyebrow animate-fade-up inline-flex items-center gap-2.5 text-brand">
            <span className="h-px w-6 bg-brand" aria-hidden /> Site accounts for Indian builders
          </p>
          <h1 className="animate-fade-up mt-5 text-[2.6rem] font-bold sm:text-6xl lg:text-[4.4rem]" style={stagger(1, 90)}>
            Every rupee on site, <span className="relative inline-block text-brand">
              accounted&nbsp;for.
              {/* Hand-drawn marker stroke under the words */}
              <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-[0.22em] w-full overflow-visible">
                <path d="M3,9 C60,3 140,2 200,6 S280,10 297,5" pathLength={1} className="marker-draw" />
              </svg>
            </span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-foreground/70 sm:text-lg lg:mx-0" style={stagger(2, 90)}>
            Log cement, steel, wages and machine hours as they happen. BuildLedger keeps the totals, the dues and the budget for every project, on
            your phone.
          </p>
          <div className="animate-fade-up mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start" style={stagger(3, 90)}>
            <Link href="/register" className={`${buttonClass("primary")} h-12 px-6 text-base`}>
              Start your first project <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className={`${buttonClass("secondary")} h-12 px-6 text-base`}>
              Sign in
            </Link>
          </div>
          <dl className="animate-fade-up mx-auto mt-10 grid max-w-md grid-cols-3 divide-x divide-foreground/10 border-y border-foreground/10 py-4 lg:mx-0" style={stagger(4, 90)}>
            {[
              ["₹", "Indian digit grouping"],
              ["sq ft", "Cost per square foot"],
              ["PDF", "Reports to share"],
            ].map(([value, label]) => (
              <div key={label} className="px-2 text-center">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-xl font-semibold">{value}</dd>
                <dd className="mt-0.5 text-[11px] leading-tight text-foreground/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <SitePreview />
      </div>
    </section>
  );
}

function MaterialStrip() {
  const items = [...marquee, ...marquee];
  return (
    <section aria-label="Materials you can log" className="border-y border-foreground/[0.08] bg-surface/70 py-5">
      <div className="marquee overflow-hidden">
        <ul className="marquee-track flex w-max gap-3">
          {items.map(([file, label], i) => (
            <li key={i} aria-hidden={i >= marquee.length} className="flex items-center gap-2.5 rounded-full border border-foreground/[0.08] bg-surface py-1.5 pl-1.5 pr-4">
              <Image src={`/photos/materials/${file}.webp`} alt="" width={32} height={32} className="product-stage h-8 w-8 rounded-full object-contain p-0.5" />
              <span className="whitespace-nowrap text-sm font-medium text-foreground/75">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, index, title, body, className = "", children }: { icon: LucideIcon; index: number; title: string; body: string; className?: string; children?: ReactNode }) {
  return (
    <li data-reveal className={`group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/[0.08] bg-surface p-6 shadow-card transition-colors hover:border-brand/40 sm:p-7 ${className}`} style={stagger(index, 70)}>
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 text-foreground/80 transition-colors group-hover:border-brand/40 group-hover:text-brand">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="eyebrow text-foreground/35">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/65">{body}</p>
      {children}
    </li>
  );
}

const attendance = [
  { name: "Ravi", role: "Mason", days: "PPPHPPA" },
  { name: "Suresh", role: "Helper", days: "PPPPPPA" },
  { name: "Anil", role: "Mason", days: "APPPPHA" },
];

function AttendanceSample() {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-foreground/[0.08] text-xs">
      <div className="grid grid-cols-[1fr_repeat(7,1.5rem)] items-center gap-1 bg-foreground/[0.03] px-3 py-2 font-mono text-[10px] text-foreground/45">
        <span>WORKER</span>
        {"MTWTFSS".split("").map((d, i) => (
          <span key={i} className="text-center">
            {d}
          </span>
        ))}
      </div>
      {attendance.map((w) => (
        <div key={w.name} className="grid grid-cols-[1fr_repeat(7,1.5rem)] items-center gap-1 border-t border-foreground/[0.06] px-3 py-2">
          <span className="truncate">
            <span className="font-medium">{w.name}</span> <span className="text-foreground/45">{w.role}</span>
          </span>
          {w.days.split("").map((d, i) => (
            <span
              key={i}
              title={d === "P" ? "Present" : d === "H" ? "Half day" : "Absent"}
              className={`mx-auto h-4 w-4 rounded ${d === "P" ? "bg-emerald-500/80" : d === "H" ? "bg-[linear-gradient(135deg,var(--color-emerald-500)_50%,transparent_50%)] ring-1 ring-emerald-500/50 ring-inset" : "bg-foreground/[0.07]"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const monthlySpend = [
  ["Jun", 34],
  ["Jul", 52],
  ["Aug", 78],
  ["Sep", 64],
  ["Oct", 92],
] as const;

function SpendSample() {
  return (
    <div className="mt-6 flex items-end gap-6">
      <div className="flex h-32 flex-1 items-end gap-2 border-b border-foreground/10 sm:gap-4">
        {monthlySpend.map(([month, value], i) => (
          <div key={month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div className={`bar-rise w-full max-w-12 rounded-t-md ${i === monthlySpend.length - 1 ? "bg-brand" : "bg-foreground/15"}`} style={{ height: `${value}%`, animationDelay: `${i * 90}ms` }} />
            <span className="pb-1 font-mono text-[10px] text-foreground/45">{month}</span>
          </div>
        ))}
      </div>
      <dl className="hidden shrink-0 space-y-3 text-right sm:block">
        <div>
          <dt className="eyebrow text-foreground/45">This month</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">₹6,48,200</dd>
        </div>
        <div>
          <dt className="eyebrow text-foreground/45">Per sq ft</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">₹1,601</dd>
        </div>
      </dl>
    </div>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div data-reveal className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-brand">What it keeps track of</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Built around how a site actually runs</h2>
        <p className="mt-4 text-foreground/65">Fast to fill in standing on site, clear enough to read in the office.</p>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={Package}
          index={0}
          className="lg:col-span-2"
          title="Material purchases"
          body="Pick the material from pictures, enter quantity and rate, and the total is worked out. Several items from one bill go in together."
        >
          <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
            {(["cement", "steel", "sand", "bricks"] as const).map((m) => (
              <div key={m} className="product-stage aspect-square overflow-hidden rounded-xl">
                <Image src={`/photos/materials/${m}.webp`} alt="" width={140} height={140} className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </FeatureCard>
        <FeatureCard icon={Camera} index={1} title="Scan the bill" body="Photograph a supplier's bill. Material, quantity, rate and date are read on your phone and filled in for you.">
          <div className="relative mt-6 space-y-2 overflow-hidden rounded-xl border border-dashed border-foreground/15 p-4 font-mono text-[11px] text-foreground/60">
            <div className="scan-line" aria-hidden />
            <p className="flex justify-between"><span>OPC 53 GRADE</span><span>120 BAGS</span></p>
            <p className="flex justify-between"><span>RATE</span><span>390.00</span></p>
            <p className="flex justify-between font-semibold text-foreground/80"><span>TOTAL</span><span>46,800.00</span></p>
          </div>
        </FeatureCard>
        <FeatureCard icon={Users} index={2} title="Labour & attendance" body="Mark daily attendance for masons and helpers, set fixed amounts for teams, and see exactly what is still owed.">
          <AttendanceSample />
        </FeatureCard>
        <FeatureCard
          icon={Truck}
          index={3}
          className="lg:col-span-2"
          title="Transport & machinery"
          body="JCB, crane, mixer or tipper: choose it, set hours or a full amount, and it's on the ledger."
        >
          <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
            {vehicles.map((v) => (
              <div key={v} className="product-stage aspect-[4/3] overflow-hidden rounded-xl">
                <Image src={`/photos/vehicles/${v}.webp`} alt="" width={180} height={135} className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </FeatureCard>
        <FeatureCard icon={TrendingUp} index={4} className="lg:col-span-2" title="Reports that answer the owner's questions" body="Budget against actual, spend by material and by month, cost per sq ft, and weekly labour sheets, downloaded as PDF.">
          <SpendSample />
        </FeatureCard>
        <FeatureCard icon={Smartphone} index={5} title="Made for the phone" body="Every page fits a phone screen, so entries get made on site the same day, not remembered a week later." />
      </ul>
    </section>
  );
}

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: HardHat, title: "Add your site", body: "Name, location, built-up area in sq ft and the budget you're working to." },
  { icon: IndianRupee, title: "Log as you go", body: "Materials, wages and machine hours the day they happen. Scan bills to save typing." },
  { icon: FileText, title: "Know where you stand", body: "Spent, owed and left, per project. Share a PDF with the owner whenever they ask." },
];

function Steps() {
  return (
    <section className="border-y border-foreground/[0.08] bg-surface/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div data-reveal>
            <p className="eyebrow text-brand">How it works</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">From first bag of cement to handover</h2>
            <p className="mt-4 max-w-md text-foreground/65">The ledger follows the site through every stage, so the numbers are ready the day the keys change hands.</p>
          </div>
          <div data-reveal className="rounded-2xl border border-foreground/[0.08] bg-surface p-4 shadow-card sm:p-6">
            <HouseBuild />
          </div>
        </div>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} data-reveal className="relative" style={stagger(i, 140)}>
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl font-bold text-brand/90 tabular-nums">{i + 1}</span>
                <span className="step-line h-px flex-1 bg-foreground/15" aria-hidden />
                <Icon className="h-5 w-5 text-foreground/40" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/65">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
      <div data-reveal className="cta-panel relative overflow-hidden rounded-3xl px-6 py-14 text-white sm:px-14 sm:py-16">
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="eyebrow text-orange-300">Free to start</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl">Put your next site on one ledger.</h2>
            <p className="mt-4 text-white/65">Set up a project in a minute and invite your site engineer or the owner to follow along.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/register" className={`${buttonClass("primary")} h-12 px-6 text-base`}>
              Create free account <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-base font-medium text-white transition-colors hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <main className="relative flex-1 overflow-x-clip">
      <LandingBackdrop />
      {/* Positioned after the backdrop so every section paints above it. */}
      <div className="relative">
        <Hero />
        <MaterialStrip />
        <Features />
        <Steps />
        <ClosingCta />
      </div>
    </main>
  );
}
