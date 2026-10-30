import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What BuildLedger stores about you and your sites, why, who can see it, and how to delete it.",
};

const LAST_UPDATED = "30 October 2026";
/** Who answers privacy questions. Fill in before going live; the page says so while it's empty. */
const CONTACT_EMAIL = "";

const sections = [
  { id: "summary", title: "In short" },
  { id: "collect", title: "What we collect" },
  { id: "use", title: "How we use it" },
  { id: "scanning", title: "Bill scanning and PDFs" },
  { id: "sharing", title: "Who can see your data" },
  { id: "others", title: "Information about other people" },
  { id: "cookies", title: "Cookies" },
  { id: "storage", title: "Where it's stored and how it's protected" },
  { id: "retention", title: "How long we keep it" },
  { id: "rights", title: "Your choices and rights" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-foreground/[0.08] pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/75 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <PageHeader icon={ShieldCheck} title="Privacy policy" description={`How BuildLedger handles your account and site records. Last updated ${LAST_UPDATED}.`} />

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* Contents: a sticky list on wide screens, a plain list on phones */}
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow text-foreground/45">On this page</p>
            <ol className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 text-foreground/65 transition-colors hover:text-brand">
                    <span className="w-5 shrink-0 font-mono text-xs leading-5 text-foreground/35">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 space-y-10 rounded-2xl border border-foreground/[0.08] bg-surface p-6 shadow-card sm:p-10">
            <Section id="summary" title="In short">
              <ul>
                <li>We store what you put into BuildLedger: your account details and the records for your sites.</li>
                <li>We use it only to run the app for you and the people you invite. No ads, no selling data, no tracking or analytics.</li>
                <li>Bills are read on your own device when you scan them. PDF reports are also made on your device.</li>
                <li>You can delete a project or your whole account from inside the app, and the data goes with it.</li>
              </ul>
            </Section>

            <Section id="collect" title="What we collect">
              <p>
                <strong>Your account.</strong> Your name, email address, and, if you add them, your phone number, location and profile photo. Your password is
                never stored as you typed it; we keep only a one-way scrypt hash of it.
              </p>
              <p>
                <strong>Your site records.</strong> Everything you enter for a project: its name, location, type, area and budget; material purchases;
                labour, workers, wages and attendance; transport and machinery; daily site logs; and any bills, photos or other files you upload.
              </p>
              <p>
                <strong>Invitations.</strong> When you invite someone to a project, we store their email address and the role you gave them so they can join.
              </p>
              <p>
                <strong>Sign-in sessions.</strong> When you sign in we create a session that keeps you signed in on that browser. We store a hashed copy of
                its token and when it expires, never the token itself.
              </p>
              <p>
                <strong>Technical logs.</strong> Like most websites, the servers that run BuildLedger may record basic request logs, such as IP address,
                browser type and time of request, to keep the service running and secure.
              </p>
            </Section>

            <Section id="use" title="How we use it">
              <ul>
                <li>To sign you in and keep your account secure.</li>
                <li>To store, total and report on your site records: spend, dues, budgets, cost per sq ft and the like.</li>
                <li>To show a project to the team members you invite, according to the role you give them.</li>
                <li>To fix problems and protect the service from misuse.</li>
              </ul>
              <p>We don&apos;t use your data for advertising, we don&apos;t sell or rent it, and we don&apos;t build profiles of you.</p>
            </Section>

            <Section id="scanning" title="Bill scanning and PDFs">
              <p>
                When you use <strong>Scan bill</strong>, the image is read by text-recognition software running in your own browser. The image is not sent to
                us or to anyone else to be read. To do this, your browser downloads the recognition software and its English language data from a public
                code delivery network (jsDelivr), the same way it loads parts of many websites.
              </p>
              <p>
                If you attach the bill or photo to an entry, it is then uploaded and stored with that project, like any other file you add.
              </p>
              <p>PDF reports are put together in your browser from data you can already see; downloading one doesn&apos;t send anything new to us.</p>
            </Section>

            <Section id="sharing" title="Who can see your data">
              <ul>
                <li>
                  <strong>People you invite.</strong> Members of a project can see that project&apos;s records. Editors can change them; viewers can only read
                  them. They can&apos;t see your other projects.
                </li>
                <li>
                  <strong>Service providers.</strong> Your data is stored with Supabase, which provides our database and file storage, and the app runs on a
                  hosting provider. They process data only to provide these services to us.
                </li>
                <li>
                  <strong>When the law requires it.</strong> We may disclose information if we are legally required to, for example by a court order.
                </li>
              </ul>
              <p>We don&apos;t share your data with anyone else.</p>
            </Section>

            <Section id="others" title="Information about other people">
              <p>
                Site records often include details about other people, such as workers&apos; names, wages and attendance, or the names of suppliers and
                transport owners. If you add this information, please make sure you have a genuine reason to record it, keep it to what you need for paying
                and accounting, and remove it when you no longer need it.
              </p>
            </Section>

            <Section id="cookies" title="Cookies">
              <p>
                BuildLedger uses a single cookie, <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[13px]">builder_session</code>,
                to keep you signed in. It can&apos;t be read by scripts on the page, is sent only over secure connections in production, and expires after 7
                days. Signing out removes it.
              </p>
              <p>We don&apos;t use advertising, analytics or tracking cookies, so there&apos;s nothing to opt out of.</p>
            </Section>

            <Section id="storage" title="Where it's stored and how it's protected">
              <ul>
                <li>Your data is stored in Supabase&apos;s data centre in Mumbai, India.</li>
                <li>Uploaded files and profile photos are kept in private storage, available only through the app to people allowed to see them.</li>
                <li>Passwords are hashed with scrypt. Resetting your password signs you out on every device.</li>
                <li>Connections to the app are encrypted with HTTPS.</li>
              </ul>
              <p>No system is perfectly secure, but we take reasonable steps to protect your information and keep access to it limited.</p>
            </Section>

            <Section id="retention" title="How long we keep it">
              <ul>
                <li>Your account and projects are kept for as long as your account exists.</li>
                <li>
                  <strong>Deleting a project</strong> removes its entries, uploaded files and pending invitations.
                </li>
                <li>
                  <strong>Deleting your account</strong> removes your profile and photo, signs you out everywhere, deletes every project you own with all its
                  data, removes invitations sent to your email, and ends your access to projects others shared with you.
                </li>
                <li>Expired sign-in sessions are cleared out automatically.</li>
                <li>Deleted data may remain in our providers&apos; routine backups for a limited time before it is overwritten.</li>
              </ul>
            </Section>

            <Section id="rights" title="Your choices and rights">
              <ul>
                <li>
                  <strong>See and correct</strong> your details any time on your{" "}
                  <Link href="/profile" className="font-medium text-brand hover:underline">
                    profile
                  </Link>
                  .
                </li>
                <li>
                  <strong>Take a copy</strong> of your site records by downloading PDF reports from each project.
                </li>
                <li>
                  <strong>Delete</strong> projects from their settings, or your whole account from your profile.
                </li>
              </ul>
              <p>
                If you are in India, the Digital Personal Data Protection Act, 2023 gives you the right to ask about, correct and erase your personal data, and
                to raise a grievance about how it is handled. You can use the options above or contact us.
              </p>
            </Section>

            <Section id="children" title="Children">
              <p>BuildLedger is meant for people running construction work and is not intended for anyone under 18.</p>
            </Section>

            <Section id="changes" title="Changes to this policy">
              <p>
                If we change how we handle your data, we&apos;ll update this page and the date at the top. If the change is significant, we&apos;ll also let you
                know in the app.
              </p>
            </Section>

            <Section id="contact" title="Contact">
              {CONTACT_EMAIL ? (
                <p>
                  For privacy questions, data requests or complaints, email{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              ) : (
                <p className="rounded-xl border border-dashed border-brand/40 bg-brand-soft px-4 py-3 text-foreground/80">
                  A contact email for privacy questions and data requests will be added here before BuildLedger goes live. Until then, you can manage or
                  delete your data yourself from your profile.
                </p>
              )}
            </Section>
          </article>
        </div>
      </main>
    </>
  );
}
