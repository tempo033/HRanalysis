create table if not exists public.candidate_interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  request_id uuid not null references public.requests(id) on delete cascade,
  interview_date timestamptz,
  interview_type text not null default 'مقابلة نهائية',
  engineering_score numeric(5,2) not null default 0 check (engineering_score between 0 and 100),
  technical_office_score numeric(5,2) not null default 0 check (technical_office_score between 0 and 100),
  hr_score numeric(5,2) not null default 0 check (hr_score between 0 and 100),
  engineering_notes text,
  technical_office_notes text,
  hr_notes text,
  final_score numeric(5,2) not null default 0 check (final_score between 0 and 100),
  recommendation text not null default 'تحت المراجعة',
  final_decision text not null default 'لم يتم اتخاذ القرار',
  general_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_candidate_interviews_candidate on public.candidate_interviews(candidate_id);
create index if not exists idx_candidate_interviews_request on public.candidate_interviews(request_id);
