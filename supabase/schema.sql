-- HRanalysis - Complete Supabase Schema
-- Compatible with current application code (requests, candidates, interviews, approvals, onboarding, employees)

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- =======================
-- Core Requests
-- =======================
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  company_name text default 'البنية الاساسية للمقاولات',
  request_type text not null, -- توظيف / تدريب / تجربة / تقييم
  exact_type text not null,
  department text,
  notes text,
  status text default 'مفتوح',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists request_requirements (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  name text not null,
  category text default 'عام',
  weight numeric not null default 0 check (weight >= 0 and weight <= 100),
  required boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- =======================
-- Candidates
-- =======================
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  share_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  full_name text not null,
  phone text,
  email text,
  city text,
  nationality text default 'سعودي',
  national_id text,
  degree text,
  specialization text,
  university text,
  graduation_year int,
  total_experience_years numeric,
  saudi_experience_years numeric,
  previous_experience text,
  notes text,
  status text default 'جديد',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists candidate_requirement_scores (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  requirement_id uuid not null references request_requirements(id) on delete cascade,
  score numeric not null default 0 check (score >= 0 and score <= 100),
  evidence text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(candidate_id, requirement_id)
);

-- =======================
-- Interviews & Evaluation
-- =======================
create table if not exists candidate_interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  interview_date timestamptz,
  interview_type text default 'تقييم مرحلي',
  interview_platform text default 'Microsoft Teams',
  interview_start_at timestamptz,
  interview_end_at timestamptz,
  teams_scheduling_url text,
  teams_join_url text,
  meeting_status text default 'لم يحدد',
  invitation_message text,
  hr_score numeric default 0,
  engineering_score numeric default 0,
  technical_office_score numeric default 0,
  final_score numeric default 0,
  hr_requirement_scores jsonb default '{}'::jsonb,
  engineering_requirement_scores jsonb default '{}'::jsonb,
  technical_office_requirement_scores jsonb default '{}'::jsonb,
  hr_notes text,
  engineering_notes text,
  technical_office_notes text,
  final_decision text default 'لم يتم اتخاذ القرار',
  general_notes text,
  recommendation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists candidate_evaluation_links (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  request_id uuid references requests(id) on delete cascade,
  stage text not null check (stage in ('hr','specialized','executive','general_manager')),
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

-- =======================
-- Hiring Approvals & Offers
-- =======================
create table if not exists candidate_hiring_approvals (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid unique not null references candidates(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  approval_status text default 'قيد المراجعة',
  final_approval_status text default 'قيد المراجعة',
  evaluation_status text default 'غير مكتمل',
  evaluation_final_score numeric default 0,
  evaluation_hr_score numeric default 0,
  evaluation_specialized_score numeric default 0,
  evaluation_executive_score numeric default 0,
  gm_decision text,
  gm_notes text,
  gm_salary_override text,
  salary text,
  contract_type text default 'دوام كامل',
  offer_token text unique default encode(gen_random_bytes(16), 'hex'),
  offer_status text,
  offer_sent_at timestamptz,
  offer_responded_at timestamptz,
  start_date date,
  notes text,
  job_title text,
  department text,
  project_name text,
  work_location text,
  work_hours text,
  work_days text,
  annual_leave text,
  probation text,
  health_insurance text,
  gosi text,
  bonus text,
  performance_bonus text,
  termination_notice text,
  offer_validity text default '7 أيام',
  issue_date date default current_date,
  offer_number text,
  housing_allowance text,
  transportation_allowance text,
  other_allowances text,
  total_salary text,
  basic_salary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =======================
-- Onboarding
-- =======================
create table if not exists employee_onboarding (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid unique not null references candidates(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  employee_number text,
  job_title text,
  department text,
  project_name text,
  work_location text,
  direct_start_date date,
  actual_join_date date,
  employment_status text default 'قيد التجهيز',
  appointment_type text default 'تعيين جديد',
  salary text,
  contract_type text default 'دوام كامل',
  manager_name text,
  notes text,
  direct_work_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  basic_salary text,
  housing_allowance text,
  transportation_allowance text,
  related_work text,
  appointment_reason text,
  supervisor_notes text,
  hr_notes text,
  status text default 'معتمد',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backward compatibility: candidate_onboarding is an alias / duplicate of employee_onboarding for older code paths
create table if not exists candidate_onboarding (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid unique not null references candidates(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  employee_number text,
  job_title text,
  department text,
  project_name text,
  work_location text,
  actual_join_date date,
  direct_start_date date,
  employment_status text,
  appointment_type text,
  salary text,
  contract_type text,
  manager_name text,
  notes text,
  supervisor_notes text,
  hr_notes text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =======================
-- Employee Records
-- =======================
create table if not exists employee_records (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique,
  full_name text not null,
  nationality text,
  national_id text,
  residency_status text,
  job_title text,
  department text,
  basic_salary numeric,
  housing_allowance numeric,
  transportation_allowance numeric,
  other_allowances numeric,
  total_salary_with_allowances numeric,
  employment_status text,
  hire_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employee_records(id) on delete cascade,
  document_name text not null,
  document_url text,
  created_at timestamptz default now()
);

create table if not exists hr_form_records (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  employee_name text,
  employee_number text,
  department text,
  job_title text,
  status text default 'مسودة',
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =======================
-- Indexes
-- =======================
create index if not exists idx_requests_created on requests(created_at desc);
create index if not exists idx_req_requirements_request on request_requirements(request_id);
create index if not exists idx_candidates_request on candidates(request_id);
create index if not exists idx_candidates_token on candidates(share_token);
create index if not exists idx_candidate_scores_candidate on candidate_requirement_scores(candidate_id);
create index if not exists idx_interviews_candidate on candidate_interviews(candidate_id);
create index if not exists idx_evaluation_links_candidate on candidate_evaluation_links(candidate_id);
create index if not exists idx_evaluation_links_token on candidate_evaluation_links(token);
create index if not exists idx_hiring_approvals_candidate on candidate_hiring_approvals(candidate_id);
create index if not exists idx_hiring_offer_token on candidate_hiring_approvals(offer_token);
create index if not exists idx_onboarding_candidate on employee_onboarding(candidate_id);
create index if not exists idx_employee_records_number on employee_records(employee_number);

-- =======================
-- RLS (Permissive for MVP, tighten before production)
-- =======================
alter table requests enable row level security;
alter table request_requirements enable row level security;
alter table candidates enable row level security;
alter table candidate_requirement_scores enable row level security;
alter table candidate_interviews enable row level security;
alter table candidate_evaluation_links enable row level security;
alter table candidate_hiring_approvals enable row level security;
alter table employee_onboarding enable row level security;
alter table candidate_onboarding enable row level security;
alter table employee_records enable row level security;
alter table employee_documents enable row level security;
alter table hr_form_records enable row level security;

drop policy if exists "public all requests" on requests;
create policy "public all requests" on requests for all using (true) with check (true);

drop policy if exists "public all request_requirements" on request_requirements;
create policy "public all request_requirements" on request_requirements for all using (true) with check (true);

drop policy if exists "public all candidates" on candidates;
create policy "public all candidates" on candidates for all using (true) with check (true);

drop policy if exists "public all candidate_requirement_scores" on candidate_requirement_scores;
create policy "public all candidate_requirement_scores" on candidate_requirement_scores for all using (true) with check (true);

drop policy if exists "public all candidate_interviews" on candidate_interviews;
create policy "public all candidate_interviews" on candidate_interviews for all using (true) with check (true);

drop policy if exists "public all candidate_evaluation_links" on candidate_evaluation_links;
create policy "public all candidate_evaluation_links" on candidate_evaluation_links for all using (true) with check (true);

drop policy if exists "public all candidate_hiring_approvals" on candidate_hiring_approvals;
create policy "public all candidate_hiring_approvals" on candidate_hiring_approvals for all using (true) with check (true);

drop policy if exists "public all employee_onboarding" on employee_onboarding;
create policy "public all employee_onboarding" on employee_onboarding for all using (true) with check (true);

drop policy if exists "public all candidate_onboarding" on candidate_onboarding;
create policy "public all candidate_onboarding" on candidate_onboarding for all using (true) with check (true);

drop policy if exists "public all employee_records" on employee_records;
create policy "public all employee_records" on employee_records for all using (true) with check (true);

drop policy if exists "public all employee_documents" on employee_documents;
create policy "public all employee_documents" on employee_documents for all using (true) with check (true);

drop policy if exists "public all hr_form_records" on hr_form_records;
create policy "public all hr_form_records" on hr_form_records for all using (true) with check (true);

-- =======================
-- Helper Functions
-- =======================

-- Get candidate public form by token
create or replace function get_candidate_public_form(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_candidate candidates%rowtype;
  v_request requests%rowtype;
  v_reqs jsonb;
  v_scores jsonb;
begin
  select * into v_candidate from candidates where share_token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'رابط غير صحيح');
  end if;

  select * into v_request from requests where id = v_candidate.request_id;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.sort_order), '[]'::jsonb) into v_reqs
  from request_requirements r where r.request_id = v_candidate.request_id;

  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) into v_scores
  from candidate_requirement_scores s where s.candidate_id = v_candidate.id;

  return jsonb_build_object(
    'ok', true,
    'candidate', to_jsonb(v_candidate),
    'request', to_jsonb(v_request),
    'requirements', v_reqs,
    'scores', v_scores
  );
end;
$$;

-- Save candidate public form
create or replace function save_candidate_public_form(p_token text, p_candidate jsonb, p_scores jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_candidate candidates%rowtype;
  v_item jsonb;
begin
  select * into v_candidate from candidates where share_token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'رابط غير صحيح');
  end if;

  update candidates set
    full_name = coalesce((p_candidate->>'full_name'), full_name),
    phone = coalesce((p_candidate->>'phone'), phone),
    email = coalesce((p_candidate->>'email'), email),
    city = coalesce((p_candidate->>'city'), city),
    nationality = coalesce((p_candidate->>'nationality'), nationality),
    degree = coalesce((p_candidate->>'degree'), degree),
    specialization = coalesce((p_candidate->>'specialization'), specialization),
    university = coalesce((p_candidate->>'university'), university),
    graduation_year = coalesce(nullif(p_candidate->>'graduation_year','')::int, graduation_year),
    total_experience_years = coalesce(nullif(p_candidate->>'total_experience_years','')::numeric, total_experience_years),
    saudi_experience_years = coalesce(nullif(p_candidate->>'saudi_experience_years','')::numeric, saudi_experience_years),
    previous_experience = coalesce((p_candidate->>'previous_experience'), previous_experience),
    notes = coalesce((p_candidate->>'notes'), notes),
    status = 'أكمل البيانات',
    updated_at = now()
  where id = v_candidate.id;

  -- upsert scores
  for v_item in select * from jsonb_array_elements(coalesce(p_scores, '[]'::jsonb))
  loop
    insert into candidate_requirement_scores (candidate_id, requirement_id, score, evidence)
    values (
      v_candidate.id,
      (v_item->>'requirement_id')::uuid,
      coalesce((v_item->>'score')::numeric, 0),
      (v_item->>'evidence')
    )
    on conflict (candidate_id, requirement_id)
    do update set score = excluded.score, evidence = excluded.evidence, updated_at = now();
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

-- Delete HR request and all related data
create or replace function delete_hr_request(p_request_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from candidate_requirement_scores where candidate_id in (select id from candidates where request_id = p_request_id);
  delete from candidate_interviews where request_id = p_request_id or candidate_id in (select id from candidates where request_id = p_request_id);
  delete from candidate_evaluation_links where request_id = p_request_id;
  delete from candidate_hiring_approvals where request_id = p_request_id or candidate_id in (select id from candidates where request_id = p_request_id);
  delete from employee_onboarding where request_id = p_request_id or candidate_id in (select id from candidates where request_id = p_request_id);
  delete from candidate_onboarding where request_id = p_request_id or candidate_id in (select id from candidates where request_id = p_request_id);
  delete from candidates where request_id = p_request_id;
  delete from request_requirements where request_id = p_request_id;
  delete from requests where id = p_request_id;
end;
$$;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_requests_updated on requests;
create trigger trg_requests_updated before update on requests for each row execute function update_updated_at();

drop trigger if exists trg_candidates_updated on candidates;
create trigger trg_candidates_updated before update on candidates for each row execute function update_updated_at();

drop trigger if exists trg_candidate_scores_updated on candidate_requirement_scores;
create trigger trg_candidate_scores_updated before update on candidate_requirement_scores for each row execute function update_updated_at();

drop trigger if exists trg_interviews_updated on candidate_interviews;
create trigger trg_interviews_updated before update on candidate_interviews for each row execute function update_updated_at();

drop trigger if exists trg_approvals_updated on candidate_hiring_approvals;
create trigger trg_approvals_updated before update on candidate_hiring_approvals for each row execute function update_updated_at();

drop trigger if exists trg_onboarding_updated on employee_onboarding;
create trigger trg_onboarding_updated before update on employee_onboarding for each row execute function update_updated_at();

drop trigger if exists trg_employee_records_updated on employee_records;
create trigger trg_employee_records_updated before update on employee_records for each row execute function update_updated_at();

drop trigger if exists trg_hr_form_updated on hr_form_records;
create trigger trg_hr_form_updated before update on hr_form_records for each row execute function update_updated_at();
