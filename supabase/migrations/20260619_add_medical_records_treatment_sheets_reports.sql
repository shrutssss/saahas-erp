-- Medical records for animal profile
create table if not exists medical_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  record_date date not null default current_date,
  doctor_name text not null,
  entry text not null,
  created_at timestamp default now()
);

-- Treatment sheet image uploads
create table if not exists treatment_sheets (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animals(id) on delete cascade,
  reporter_name text not null,
  image_url text not null,
  created_at timestamp default now()
);

-- Diagnostic report uploads
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

create policy "authenticated_all" on medical_records for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on treatment_sheets for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on animal_reports for all using (auth.role() = 'authenticated');
