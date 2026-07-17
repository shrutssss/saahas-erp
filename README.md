# 🐾 Saahas Animal Shelter Management ERP

A production-grade, full-stack ERP system built for **Saahas Animal Shelter, Pune** — a real NGO managing 50+ rescued animals per month across OPD, IPD, and In-House care units.

Built as a consultancy project with real stakeholders, real deployment, and real daily users.

**Live:** [saahas-erp.vercel.app](https://saahas-erp.vercel.app)

---

## The Problem

Saahas was running their entire shelter operation on handwritten registers and whiteboards — tracking animal admissions, daily medications, vet observations, blood tests, surgeries, and monthly statistics entirely on paper. With 50+ animals admitted monthly across multiple care categories, records were error-prone, unsearchable, and inaccessible remotely.

There was no way to check an animal's medical history without physically being at the shelter, no audit trail of who administered what medication, and no centralized data for management reporting.

---

## The Solution

A mobile-first web ERP that digitizes the complete animal care lifecycle:

**Rescue → Registration → Treatment → Daily Tracking → Recovery → Release/Adoption**

Designed specifically for non-technical shelter staff and volunteers — simple enough that a volunteer with minimal tech literacy can register a new animal and log daily observations from their phone in under 2 minutes.

---

## Features

### 🏠 Dashboard
- Real-time pie chart of total animal distribution by species
- Auto-calculated monthly statistics table (Admitted, Released, Deaths, Blood Tests, X-Rays, Surgeries, OPD, Rescue, Adopted) — broken down by species (Dog/Cat/Cow/Other)
- Manual override for any stat with save tracking
- Past month navigation with saved snapshots
- One-click monthly PDF export for trustee/management reporting

### 🐕 Animal Registration
- Auto-generated unique Animal IDs (species + gender coded, e.g. `DG-M-001`)
- Duplicate name detection with smart suggestions
- Complete intake form: species, breed, gender, age, colour, rescue location, ward assignment, initial medical assessment
- Reporter/rescuer details with photo upload
- Multi-photo upload with Cloudinary CDN (auto-compressed)
- Status chips: Critical / Moderate / Stable

### 📋 Animal Profile (Per-Animal Dedicated Page)
- Complete registration details with edit capability
- Status management: Recovered / Released / Adopted / Deceased
- **Medical Records** — vet entries with date and doctor name
- **Observation Logs** — daily health parameters (weight, temperature, eating status, vomiting, activity level, food given)
- **Treatment Sheets** — photo uploads of handwritten medication sheets
- **Diagnostic Reports** — X-Ray, Blood Test, Ultrasound uploads with type classification
- **Surgery Records** — surgery name, surgeon, date, notes
- Recovery photo upload on discharge
- Complete medical history timeline

### 🏥 Ward Management
- Separate views for OPD, IPD, and In-House animals
- Species-based filtering (Dogs/Cats/Cows/Others)
- Condition filters (Recovered, Paralyzed, Blind, Neurological, Behavioral)
- Search by name or Animal ID
- Status chips with color coding

### 📊 Monthly Stats (Whiteboard Replacement)
- Directly replaces the physical whiteboard the shelter used for monthly tracking
- Auto-populates from live database — zero manual counting
- Each row maps to real database events:
  - Admitted = active IPD + In-House animals
  - Released/Deaths/Adopted = status change events
  - Blood Test/X-Ray = diagnostic report entries
  - Surgery = surgery log entries
  - Rescue = animals with rescuer_type = Rescued Animal
  - OPD = animals in OPD ward

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Vite) | Fast, component-based, mobile-friendly |
| Routing | React Router v6 | Client-side navigation with protected routes |
| Backend/Auth | Supabase (PostgreSQL) | Serverless, built-in auth, Row Level Security |
| Image Storage | Cloudinary | 25GB free CDN, auto-compression on upload |
| Hosting | Vercel | Auto-deploy from GitHub, global CDN |
| Styling | Custom CSS | No UI library — fully hand-crafted mobile-first design |

**No UI library used** — every component, layout, and interaction is custom-built for the specific needs of non-technical shelter staff on mobile devices.

---

## Architecture

```
Mobile Browser (Staff / Vet / Admin)
              ↓
      React SPA (Vercel)
              ↓
   Supabase Auth ←→ JWT Session
              ↓
   PostgreSQL DB (RLS enforced)
        ↓              ↓
  Animal Records    Cloudinary CDN
  Medical Logs      (Photo Storage)
  Monthly Stats
```
**Key architectural decisions:**
- Images upload directly from browser to Cloudinary — never touch the database server, keeping Supabase storage at zero
- Only photo URLs (text strings) stored in PostgreSQL — keeps database lightweight indefinitely
- Row Level Security on every table — data cannot be accessed without valid authenticated session even if API keys are exposed
- Auto-generated database triggers keep `updated_at` timestamps accurate for monthly stat calculations

---

## Database Schema

8 interconnected tables with full referential integrity:

| Table | Purpose |
|---|---|
| `profiles` | Staff accounts with role (admin/doctor/staff) |
| `animals` | Core animal records — 25+ fields covering complete intake info |
| `animal_photos` | Cloudinary URLs for animal intake photos |
| `observation_logs` | Daily health parameter entries per animal |
| `treatment_entries` | Morning/evening medication tracking |
| `treatment_sheets` | Handwritten treatment sheet photo uploads |
| `medical_records` | Vet entries with doctor name and date |
| `animal_reports` | Diagnostic reports (X-Ray/Blood Test/Ultrasound) |
| `surgeries` | Surgery records with surgeon and date |
| `monthly_stats` | Auto-calculated + manually editable monthly KPIs |

Full migration history maintained in `/supabase/migrations/` — 10 migration files tracking every schema change chronologically.

---

## Client Context

**Client:** Saahas Animal Shelter, Akurdi, Pune
**Scale:** 50+ animals admitted monthly, expanding to second branch in Panvel
**Users:** Shelter staff, veterinarians, LSS (Last Stop Shelter) coordinators
**Impact:** Replaced handwritten registers and whiteboards entirely for daily operations

Built through direct stakeholder engagement — requirements gathered from actual shelter staff, vets, and management through in-person meetings. UI decisions made specifically for volunteers with minimal tech literacy using mobile phones in field conditions.

**Infrastructure cost to client: ₹800/year** (domain only) — achieved through strategic selection of free tiers across Vercel, Supabase, and Cloudinary that comfortably handle current and projected growth without paid upgrades for 2+ years.

---

## Engineering Highlights

- **Schema-first development** — maintained a migrations folder with dated SQL files for every database change, enabling full reproducibility and team sync
- **Cloudinary integration** — unsigned direct browser upload with auto-compression preset, reducing average photo size from ~4MB to ~180KB without any client-side compression code
- **Auto-calculating analytics** — monthly stats derived from live database queries across 5 tables with species bucketing, replacing manual whiteboard counting entirely
- **Duplicate ID prevention** — race-condition-safe animal ID generation with existence check before insert and retry on conflict
- **Mobile-first throughout** — 16px minimum font size on all inputs (prevents iOS zoom), 44px minimum touch targets, bottom navigation with floating action button

---

## Local Setup

```bash
git clone https://github.com/shrutssss/saahas-erp.git
cd saahas-erp
npm install
```

Create `.env`:
VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_ANON_KEY=your_anon_key

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name

VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

```bash
npm run dev
```

Run `/supabase/migrations/` files in order in Supabase SQL Editor to set up the database schema.

---

## What's Next

- Monthly PDF export for management reporting
- Panvel branch onboarding (multi-location support)
- Donation management module
- Audit logging for compliance
- PWA support for home screen install and partial offline capability

---

*Built with React, Supabase, Cloudinary, and Vercel. Designed for real users solving a real problem.*
