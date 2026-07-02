-- ============================================================
-- SAAHAS ERP - FULL DATABASE MIGRATION
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- It is safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================


-- ============================================================
-- 1. BASE TABLES (init_tables.sql — with corrected monthly_stats schema)
-- ============================================================

-- Profiles (linked to Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users primary key,
  name text,
  role text check (role in ('admin', 'doctor', 'staff')),
  created_at timestamp default now()
);

-- Animals
create table if not exists animals (
  id uuid primary key default gen_random_uuid(),
  animal_id text unique,
  name text,
  species text,
  breed text,
  gender text,
  estimated_age_months int,
  colour text,
  rescue_date date,
  admission_date date,
  rescue_location text,
  current_status text check (current_status in ('critical','moderate','stable','recovered','deceased')),
  category text,
  lss_incharge text,
  ward text check (ward in ('opd','ipd','inhouse')),
  initial_assessment text,
  is_active boolean default true,
  created_at timestamp default now()
);

-- Animal photos
create table if not exists animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  photo_url text,
  uploaded_at timestamp default now()
);

-- Daily observation logs
create table if not exists observation_logs (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  log_date date default current_date,
  weight numeric,
  temperature numeric,
  vomiting boolean,
  eating_status text,
  loose_motion boolean,
  food_given text,
  activity_level text,
  additional_notes text,
  reporter text,
  initial_medical_assessment text,
  updated_by uuid references profiles(id),
  created_at timestamp default now()
);

-- Treatment / medication sheet entries
create table if not exists treatment_entries (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  drug_name text,
  morning_given boolean default false,
  evening_given boolean default false,
  date date default current_date,
  notes text,
  created_at timestamp default now()
);

-- Monthly stats (per-species columns — matches app schema)
create table if not exists monthly_stats (
  id uuid primary key default gen_random_uuid(),
  month text unique,
  admitted_dog int default 0,
  admitted_cat int default 0,
  admitted_cow int default 0,
  admitted_other int default 0,
  released_dog int default 0,
  released_cat int default 0,
  released_cow int default 0,
  released_other int default 0,
  deaths_dog int default 0,
  deaths_cat int default 0,
  deaths_cow int default 0,
  deaths_other int default 0,
  blood_test_dog int default 0,
  blood_test_cat int default 0,
  blood_test_cow int default 0,
  blood_test_other int default 0,
  xray_dog int default 0,
  xray_cat int default 0,
  xray_cow int default 0,
  xray_other int default 0,
  surgery_dog int default 0,
  surgery_cat int default 0,
  surgery_cow int default 0,
  surgery_other int default 0,
  opd_dog int default 0,
  opd_cat int default 0,
  opd_cow int default 0,
  opd_other int default 0,
  rescue_dog int default 0,
  rescue_cat int default 0,
  rescue_cow int default 0,
  rescue_other int default 0,
  updated_at timestamp default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table animals enable row level security;
alter table animal_photos enable row level security;
alter table observation_logs enable row level security;
alter table treatment_entries enable row level security;
alter table monthly_stats enable row level security;

-- RLS policies (allow all authenticated users)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='authenticated_all') then
    create policy "authenticated_all" on profiles for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='animals' and policyname='authenticated_all') then
    create policy "authenticated_all" on animals for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='animal_photos' and policyname='authenticated_all') then
    create policy "authenticated_all" on animal_photos for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='observation_logs' and policyname='authenticated_all') then
    create policy "authenticated_all" on observation_logs for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='treatment_entries' and policyname='authenticated_all') then
    create policy "authenticated_all" on treatment_entries for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='monthly_stats' and policyname='authenticated_all') then
    create policy "authenticated_all" on monthly_stats for all using (auth.role() = 'authenticated');
  end if;
end $$;


-- ============================================================
-- 2. MIGRATIONS (in chronological order)
-- ============================================================

-- 20250618: LSS Incharge + chemo category
alter table animals add column if not exists lss_incharge text;
alter table animals drop constraint if exists animals_category_check;
alter table animals add constraint animals_category_check
  check (category in ('normal','paralysed','blind','neurological','behavioural','senior','disabled','chemo'));

-- 20250618: Observation reporter + initial medical assessment
alter table observation_logs add column if not exists reporter text;
alter table observation_logs add column if not exists initial_medical_assessment text;

-- 20260619: Medical records, treatment sheets, diagnostic reports
create table if not exists medical_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  record_date date not null default current_date,
  doctor_name text not null,
  entry text not null,
  created_at timestamp default now()
);

create table if not exists treatment_sheets (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  reporter_name text not null,
  image_url text not null,
  created_at timestamp default now()
);

create table if not exists animal_reports (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  reporter_name text not null,
  report_type text not null check (report_type in ('x_ray', 'blood_test', 'ultrasound', 'other')),
  custom_report_type text,
  image_url text not null,
  created_at timestamp default now()
);

alter table medical_records enable row level security;
alter table treatment_sheets enable row level security;
alter table animal_reports enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='medical_records' and policyname='authenticated_all') then
    create policy "authenticated_all" on medical_records for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='treatment_sheets' and policyname='authenticated_all') then
    create policy "authenticated_all" on treatment_sheets for all using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='animal_reports' and policyname='authenticated_all') then
    create policy "authenticated_all" on animal_reports for all using (auth.role() = 'authenticated');
  end if;
end $$;

-- 20260619: Reason for admission
alter table animals add column if not exists reason_for_admission text;

-- 20260620: Health info JSON blob
alter table animals add column if not exists health_info jsonb default '{}'::jsonb;

-- 20260620: Recovery photo
alter table animals add column if not exists recovery_photo_url text;

-- 20260620: Requires vet attention flag
alter table animals add column if not exists requires_vet_attention boolean default true;
update animals
set requires_vet_attention = not exists (
  select 1 from medical_records where medical_records.animal_id = animals.id
)
where requires_vet_attention is null;

-- 20260701: Rescuer type + reporter fields + surgeries table
alter table animals add column if not exists rescuer_type text check (rescuer_type in ('Rescued Animal', 'Animal Bought by Reporter'));
alter table animals add column if not exists reporter_name text;
alter table animals add column if not exists reporter_address text;
alter table animals add column if not exists reporter_phone text;
alter table animals add column if not exists reporter_photo_url text;
alter table animals add column if not exists reporter_aadhaar_url text;

create table if not exists surgeries (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  surgery_name text not null,
  surgeon_name text,
  surgery_date date default current_date,
  notes text,
  created_at timestamp default now()
);

alter table surgeries enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='surgeries' and policyname='authenticated_all') then
    create policy "authenticated_all" on surgeries for all using (auth.role() = 'authenticated');
  end if;
end $$;

-- 20260702: Doctor name on surgeries
alter table surgeries add column if not exists doctor_name text;

-- 20260703: Clear category for OPD animals
update animals set category = null where ward = 'opd';

-- 20260705: Reporter detail sheet URL
alter table animals add column if not exists reporter_detail_sheet_url text;


-- ============================================================
-- DONE
-- All tables created and migrations applied.
-- ============================================================
