# BuildLedger

A responsive web app for tracking construction project costs: material purchases, labour and attendance, transport and machinery, daily site logs, bills and photos, team members and reports. Amounts are in ₹ INR (Indian digit grouping), areas in sq ft.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript and Tailwind CSS 4.

## Design

Construction-orange brand with colour-coded sections (`src/app/globals.css` tokens, `src/components/ui/primitives.tsx`), icons from lucide-react, and light entrance animations (`animate-fade-up`, `lift`, skeleton loaders) that switch off for users who prefer reduced motion. Every page has a site footer (`src/components/layout/SiteFooter.tsx`).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

All data is stored in **Supabase** (project `buildledger-web`): Postgres tables `users`, `sessions`, `reset_tokens`, `projects`, `invites`, `records` (every ledger; fields in a `data` JSON column) and `attachments`, plus private Storage buckets `uploads` (bills/photos) and `avatars` (profile photos).

Setup: put the project URL and **secret** key in `.env.local` (see the comments there), then restart `npm run dev`:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Only the Next.js server talks to Supabase (`src/lib/server/supabase.ts`). Row-level security is on with no policies, so the public/publishable key can't read or write anything. Logins still use the app's own password hashing and session cookie.

To copy old local data (`.data/`) into Supabase: `node --env-file=.env.local scripts/migrate-to-supabase.mjs` (safe to re-run; `.data/` is left untouched).

## Features

| Section | Path | What it does |
| --- | --- | --- |
| Dashboard | `/` | All your projects with spend vs budget and money owed to workers (landing page when signed out) |
| Overview | `/projects/[id]` | Total cost, budget left, cost per sq ft, worker dues, recent material purchases, spend by category, latest log |
| Materials | `…/materials` | Material purchases: shop-style picker (picture cards with − / + that fill the form), unit, quantity, price per unit → total, payment mode (UPI / Cash / Net banking / Cheque). **Scan bill** fills the form; choosing a material sets its unit; "Other" is typed into the same box. Payment status Paid in advance / Paid / **Part paid** (amount paid → balance due) / Due; the outstanding total is shown |
| Labour | `…/labour` | Workers (paid a daily wage by attendance, P / ½ / A) and teams (paid a fixed amount); amount paid and due |
| Transport | `…/transport` | Vehicles and machinery hired (JCB, Hitachi, crane, truck, tractor, mixer, roller, tanker, other) with a picture picker (− hours +), name of the transport, **per hour** (hours × rate) or **full amount**; "Other" is typed into the same box; Part paid shows the balance due and the outstanding total |
| Daily log | `…/daily-log` | Work done, weather, issues, site photos |
| Bills & photos | `…/files` | Upload or take photos of bills/receipts/site; gallery with filters |
| Team | `…/team` | Invite people by email as editor or viewer |
| Reports | `…/reports` | Totals, spend by category and month, a **Today / Weekly / Monthly / Day 1 to today** report for any date (materials, labour, transport, payments, outstanding dues, bills marked due) with **Download PDF** and one-click PDFs for today, this week, this month and day 1 to today, and every list as a PDF table |
| Settings | `…/settings` | Edit project details; owner can delete the project |

### How the numbers work

- **Total cost** = material purchases + labour + transport. Spend by category shows each material type, labour, and transport & machinery.
- **Worker / team due** = wages earned (or team amount) − "Amount paid" on the worker form. Shown in the worker list's Due column.
- **Material total** = quantity × price per unit, calculated on the server (the client's value is ignored).

### Bill scanning

- **Scan bill** opens the phone camera and attaches the photo. On the Materials page the photo is also read with OCR ([tesseract.js](https://github.com/naptha/tesseract.js), English, in the browser, so the image stays on the device) and the form is filled from the bill: material, quantity, unit, rate and bill date (`src/lib/material-parse.ts`). The first scan downloads the reader (~15 MB, then cached). Works best on clear photos of printed bills; handwritten bills usually need manual entry.
- Spoken materials like "cement 50 bags at 380 rupees per bag" or "sand 3 loads total 36,000" fill material, quantity, unit and price per unit.

### Access

- The project creator is the **owner**. Invited emails become **editors** (add/edit entries) or **viewers** (read and export only) when they sign in with that email.
- Only owners can invite people or delete the project. Everything is checked on the server; people without access get a 404.

### Payment status

Material, labour (worker/team) and transport forms have **Payment mode** (UPI, Cash, Net banking, Cheque) and **Payment status** (Paid in advance, Paid (default) or Due) choices, in a Payment panel. Form fields are grouped into numbered panels (Details, Charges, Payment / Wages & payment). Lists show it as a coloured badge, and reports show a Status column and the total of material and transport bills marked Due.

### PDFs

Reports and list exports are built in the browser with jsPDF (`src/lib/pdf.ts`, `src/lib/period-report.ts`). The PDF font has no ₹ sign, so PDFs show amounts as "Rs.". Dues in a report are worked out as of the period's last day, or today if the period hasn't ended.

## Authentication & onboarding

Login, register, forgot password and reset password are at `/login`, `/register`, `/forgot-password` and `/reset-password`. Passwords are hashed with scrypt; sessions use an httpOnly cookie. Reset links and invites are logged to the server console because there is no email service yet.

**Profile** (`/profile`, open it from your name in the header): add a profile photo (click the avatar; it is cropped to a square and also shown in the header), and one form with first name, last name, phone number, email, location and password, saved together. Leave password blank to keep it. Changing the email or password asks for the current password; project invites follow the new email and a new password signs out other devices. **Delete account** (bottom of the form) asks for your password and typing DELETE; projects you own are deleted with all their data. Accounts created before this form had their name split into first and last name at the first space.

New accounts go through `/onboarding`: Welcome → Create project (name, location, type) → Budget & timeline → Invite team.

## Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard / landing
│   ├── (auth)/                     # login, register, forgot/reset password
│   ├── onboarding/                 # 4-step onboarding
│   ├── projects/new/               # New project
│   ├── projects/[projectId]/       # Project sections (see table above)
│   └── api/
│       ├── auth/                   # Auth endpoints
│       ├── onboarding/complete/
│       └── projects/[projectId]/
│           ├── records/[collection]/   # Generic CRUD for every ledger
│           ├── attendance/             # Save a day's attendance sheet
│           ├── files/                  # Upload / list / serve / delete attachments
│           ├── export/[collection]/    # PDF download
│           └── invites/
├── components/                     # records (generic form + table), charts, labour, files, team, ui …
└── lib/
    ├── collections.ts              # Field definitions for every ledger: drives forms, tables, validation and PDF
    ├── ledger.ts                   # Totals, dues, stock, by-category and by-month calculations
    ├── material-parse.ts           # Bill OCR text → material fields
    ├── format.ts                   # ₹ / date formatting
    ├── validation.ts
    └── server/                     # Supabase stores, access control, sessions, crypto
```

### Adding a field or a new ledger

Add the field to its collection in `src/lib/collections.ts`. The form, table, server validation and PDF download pick it up automatically. A new collection also needs a page that renders `<RecordManager collection="…" />`.
