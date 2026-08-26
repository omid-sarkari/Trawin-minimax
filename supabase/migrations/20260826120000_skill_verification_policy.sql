-- ============================================================
-- TRAWIN — Skill Verification Policy via the ENGINE tables
--
-- The decision engine (evaluation_rules + rule_versions + engine_versions)
-- decides WHAT may enter a resume. This seeds the first real policy:
-- a skill is only "verified" after substantial evidence — never one or two
-- questions (manager directive: ≥200 graded questions, multiple completed
-- exams, several shipped projects).
--
-- Every admin edit appends a NEW rule_version (history preserved).
-- Fully idempotent.
-- ============================================================

INSERT INTO public.evaluation_rules (name, description, active)
SELECT 'skill_verification',
       'حداقل شواهد لازم برای تأیید یک مهارت در رزومه — قابل ویرایش از پنل ادمین؛ هر تغییر نسخه جدید ثبت می‌کند.',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM public.evaluation_rules WHERE name = 'skill_verification'
);

-- Latest active conditions for the rule (v1 defaults = manager minimums).
INSERT INTO public.rule_versions (rule_id, version, conditions, actions)
SELECT r.id,
       1,
       '{
         "verified": {
           "min_graded_questions": 200,
           "min_completed_exams": 5,
           "min_projects": 3,
           "min_score": 70
         },
         "emerging": {
           "min_graded_questions": 30,
           "min_completed_exams": 1,
           "min_score": 50
         }
       }'::jsonb,
       '{
         "levels": {
           "none":     { "label": "بدون شواهد کافی", "resume_badge": false },
           "emerging": { "label": "در حال شکل‌گیری", "resume_badge": false },
           "verified": { "label": "تأییدشده",        "resume_badge": true },
           "expert":   { "label": "تأییدشده · پیشرفته", "resume_badge": true }
         }
       }'::jsonb
FROM public.evaluation_rules r
WHERE r.name = 'skill_verification'
  AND NOT EXISTS (
    SELECT 1 FROM public.rule_versions rv WHERE rv.rule_id = r.id
  );

CREATE INDEX IF NOT EXISTS idx_rule_versions_rule ON public.rule_versions(rule_id, version DESC);
