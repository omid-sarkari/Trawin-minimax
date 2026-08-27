-- ============================================================
-- TRAWIN — Assessment Runtime: minimal invariant migration
--
-- The adaptive/selection tables (exam_selection_configs,
-- question_selection_events, user_skill_states) already exist in the
-- live database (migration add_adaptive_question_engine_state).
--
-- What is genuinely missing for the assessment runtime:
--   1. answers.question_version_id  → pin each answer to the exact
--      question version served (historical reproducibility).
--   2. engine_versions seed         → evaluations.engine_version_id
--      requires an active engine version row; table is empty.
--
-- Fully idempotent: safe to re-run.
-- ============================================================

-- 1) Version pinning -------------------------------------------------
ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS question_version_id bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'answers_question_version_id_fkey'
      AND conrelid = 'public.answers'::regclass
  ) THEN
    ALTER TABLE public.answers
      ADD CONSTRAINT answers_question_version_id_fkey
      FOREIGN KEY (question_version_id)
      REFERENCES public.question_versions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_answers_question_version
  ON public.answers(question_version_id);

-- 2) Active evaluation engine version --------------------------------
INSERT INTO public.engine_versions (version, description, active)
SELECT 'v1.0.0', 'Initial Trawin assessment engine', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.engine_versions WHERE version = 'v1.0.0'
);
