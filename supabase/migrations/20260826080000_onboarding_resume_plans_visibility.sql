-- ============================================================
-- TRAWIN — Onboarding + Living Resume + Plans + Visibility
-- (p3.md §28 minimal migration — all additive, zero historical impact)
--
-- 1. profiles extension      → onboarding state + professional fields
-- 2. plans / user_plans      → smallest entitlement abstraction (§30);
--                              real billing connects later by writing
--                              user_plans only.
-- 3. resume_visibility_rules → data-driven admin visibility controls
--                              (§11/§13/§35) enforced server-side.
-- 4. developer_resume_sections → per-user custom resume content
--                              (projects/experience/education/…),
--                              toggleable, manageable by developer+admin.
-- 5. case-insensitive unique username index.
--
-- Fully idempotent: safe to re-run.
-- ============================================================

-- 1) profiles extension -------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS work_preference text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_technology_id bigint REFERENCES public.technologies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_data jsonb NOT NULL DEFAULT '{}';

-- 2) plans + user_plans ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (code IN ('free','pro')),
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plans (code, name, description)
SELECT 'free', 'Free', 'پلن پایه تراوین'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE code = 'free');

INSERT INTO public.plans (code, name, description)
SELECT 'pro', 'Pro', 'دسترسی پیشرفته رزومه و تحلیل‌ها'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE code = 'pro');

CREATE TABLE IF NOT EXISTS public.user_plans (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id bigint NOT NULL REFERENCES public.plans(id),
  granted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_plans_plan ON public.user_plans(plan_id);

-- 3) resume visibility rules ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_visibility_rules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  view_type text NOT NULL CHECK (view_type IN ('developer','company','pro')),
  section_key text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (view_type, section_key)
);

INSERT INTO public.resume_visibility_rules (view_type, section_key, label, enabled, sort_order)
SELECT v.view_type, v.section_key, v.label, v.enabled, v.sort_order
FROM (VALUES
  -- Developer view (own resume)
  ('developer','profile','اطلاعات پروفایل',true,10),
  ('developer','bio','بیوگرافی',true,20),
  ('developer','verified_skills','مهارت‌های تأییدشده',true,30),
  ('developer','assessments','تاریخچه آزمون‌ها',true,40),
  ('developer','coding_evidence','شواهد کدنویسی',true,50),
  ('developer','sections_custom','بخش‌های سفارشی',true,60),
  ('developer','analytics_detailed','تحلیل تفصیلی',true,70),
  -- Company view (hiring profile)
  ('company','profile','پروفایل حرفه‌ای',true,10),
  ('company','headline','تیتر حرفه‌ای',true,20),
  ('company','verified_skills','مهارت‌های تأییدشده',true,30),
  ('company','assessments_summary','خلاصه آزمون‌ها',true,40),
  ('company','coding_evidence','شواهد کدنویسی',true,50),
  ('company','sections_custom','بخش‌های سفارشی',true,60),
  ('company','contact_info','اطلاعات تماس',false,70),
  ('company','private_analytics','تحلیل خصوصی',false,80),
  ('company','behavior_signals','سیگنال‌های رفتاری داخلی',false,90),
  -- Pro capabilities
  ('pro','advanced_analytics','تحلیل پیشرفته مهارت',true,10),
  ('pro','rich_sections','بخش‌های غنی رزومه',true,20),
  ('pro','advanced_insights','بینش‌های پیشرفته',true,30)
) AS v(view_type, section_key, label, enabled, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.resume_visibility_rules r
  WHERE r.view_type = v.view_type AND r.section_key = v.section_key
);

-- 4) per-user custom resume sections --------------------------------------
CREATE TABLE IF NOT EXISTS public.developer_resume_sections (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('project','experience','education','achievement','competition','certification','link','custom')),
  title text NOT NULL,
  subtitle text,
  content jsonb NOT NULL DEFAULT '{}',
  is_visible boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  managed_by text NOT NULL DEFAULT 'developer' CHECK (managed_by IN ('developer','admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_sections_user ON public.developer_resume_sections(user_id, display_order);

-- 5) case-insensitive username uniqueness ---------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON public.users (lower(username))
  WHERE username IS NOT NULL;
