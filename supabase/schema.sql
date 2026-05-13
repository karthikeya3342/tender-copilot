-- ============================================================
-- TENDER COPILOT — Full Schema + Seed
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. ENUMS
create type public.role as enum ('admin', 'explorer', 'msme');
create type public.tender_status as enum ('active', 'closed', 'draft');

-- 2. PROFILES (mirrors auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       public.role not null default 'explorer',
  created_at timestamptz not null default now()
);

-- 3. MSME PROFILES
create table public.msme_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  company_name     text not null,
  domain_category  text not null,
  turnover_lakhs   numeric(12,2) not null default 0,
  years_in_business integer not null default 0,
  certifications   text[] not null default '{}',
  created_at       timestamptz not null default now(),
  unique(user_id)
);

-- 4. TENDERS
create table public.tenders (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null,
  domain                  text not null,
  estimated_value_lakhs   numeric(12,2) not null,
  startup_exemption       boolean not null default false,
  deadline                date not null,
  issuer                  text not null,
  summary                 text not null,
  requirements_json       jsonb not null default '{}',
  status                  public.tender_status not null default 'active',
  created_at              timestamptz not null default now()
);

-- 5. BOOKMARKS
create table public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tender_id  uuid not null references public.tenders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, tender_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.msme_profiles enable row level security;
alter table public.tenders enable row level security;
alter table public.bookmarks enable row level security;

-- profiles: users read own, admin reads all
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- msme_profiles: own user only
create policy "msme_profiles_select_own" on public.msme_profiles
  for select using (auth.uid() = user_id);

create policy "msme_profiles_insert_own" on public.msme_profiles
  for insert with check (auth.uid() = user_id);

create policy "msme_profiles_update_own" on public.msme_profiles
  for update using (auth.uid() = user_id);

-- tenders: anyone can read active, only admin can insert/update
create policy "tenders_select_active" on public.tenders
  for select using (status = 'active');

create policy "tenders_admin_all" on public.tenders
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- bookmarks: own user only
create policy "bookmarks_select_own" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when new.email = 'karthikeya@askd.in' then 'admin'::public.role
      else 'explorer'::public.role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED DATA — 6 tenders
-- ============================================================

insert into public.tenders (title, domain, estimated_value_lakhs, startup_exemption, deadline, issuer, summary, requirements_json, status) values

(
  'Smart City IoT Infrastructure Deployment',
  'IT & Software',
  250,
  true,
  '2026-06-15',
  'Bangalore Smart City Limited',
  'Deployment of 500+ IoT sensors across city intersections for real-time traffic and environment monitoring. Includes cloud dashboard and mobile app.',
  '{
    "mandatory_docs": ["PAN Card", "GST Registration", "Udyam Certificate", "Technical Proposal"],
    "min_turnover_lakhs": 50,
    "min_years": 2,
    "certifications": ["ISO 9001"],
    "emd_lakhs": 5
  }',
  'active'
),

(
  'e-Governance Portal Development & Maintenance',
  'IT & Software',
  120,
  false,
  '2026-06-30',
  'Karnataka IT Department',
  'Development of citizen-facing portal for 12 government services with multilingual support (Kannada, English, Hindi) and mobile-responsive design.',
  '{
    "mandatory_docs": ["PAN Card", "GST Registration", "Udyam Certificate", "Past Project Proof (3)", "Bank Solvency"],
    "min_turnover_lakhs": 150,
    "min_years": 3,
    "certifications": ["ISO 9001", "ISO 27001"],
    "emd_lakhs": 2.5
  }',
  'active'
),

(
  'Digital Literacy Training Program',
  'Education & Training',
  80,
  true,
  '2026-07-10',
  'Ministry of Electronics & IT',
  'Training 10,000 rural citizens in digital payments, e-services, and cyber safety across 50 villages in Karnataka.',
  '{
    "mandatory_docs": ["PAN Card", "GST Registration", "Udyam Certificate"],
    "min_turnover_lakhs": 20,
    "min_years": 1,
    "certifications": [],
    "emd_lakhs": 1
  }',
  'active'
),

(
  'Hospital Management Software System',
  'IT & Software',
  340,
  false,
  '2026-05-28',
  'NIMHANS Bangalore',
  'Integrated HMS covering OPD, IPD, pharmacy, billing, and ABDM health records for a 600-bed tertiary care hospital.',
  '{
    "mandatory_docs": ["PAN Card", "GST Registration", "Udyam Certificate", "NABH Compliance Proof", "Past Project (Hospital)"],
    "min_turnover_lakhs": 300,
    "min_years": 5,
    "certifications": ["ISO 9001", "ISO 27001"],
    "emd_lakhs": 10
  }',
  'active'
),

(
  'Cybersecurity Audit & Penetration Testing',
  'IT & Software',
  45,
  true,
  '2026-07-05',
  'KSRTC Digital Division',
  'Comprehensive VAPT for 3 web applications, 2 mobile apps, and internal network infrastructure of state transport corporation.',
  '{
    "mandatory_docs": ["PAN Card", "GST Registration", "Udyam Certificate", "CERT-In Empanelment"],
    "min_turnover_lakhs": 30,
    "min_years": 2,
    "certifications": ["ISO 27001"],
    "emd_lakhs": 0.5
  }',
  'active'
),

(
  'Construction of Rural Roads Phase IV',
  'Civil Engineering',
  950,
  false,
  '2026-06-20',
  'PMGSY Karnataka',
  'Construction and maintenance of 85 km rural roads in Tumkur and Chitradurga districts under PMGSY Phase IV.',
  '{
    "mandatory_docs": ["PAN", "GST", "PWD Class-A Registration", "Completion Certificates"],
    "min_turnover_lakhs": 800,
    "min_years": 7,
    "certifications": [],
    "emd_lakhs": 25
  }',
  'active'
);

-- ============================================================
-- MIGRATION: Add extended MSME profile fields
-- Run this separately if schema already applied above
-- ============================================================

-- MIGRATION: Add nit_number to tenders
alter table public.tenders
  add column if not exists nit_number text;

-- MIGRATION: Add extended MSME profile fields
alter table public.msme_profiles
  add column if not exists gst_number           text,
  add column if not exists pan_number           text,
  add column if not exists udyam_number         text,
  add column if not exists phone                text,
  add column if not exists state                text,
  add column if not exists city                 text,
  add column if not exists pincode              text,
  add column if not exists employee_count       integer,
  add column if not exists authorized_name      text,
  add column if not exists authorized_designation text,
  add column if not exists bank_name            text,
  add column if not exists bank_branch          text,
  add column if not exists past_projects        jsonb not null default '[]'::jsonb;
