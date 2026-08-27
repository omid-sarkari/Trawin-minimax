-- File: supabase/migrations/20260822140000_admin_bulk_import.sql
-- Purpose:
--   1. Promote the founder account to role='admin' (data seed, not logic).
--   2. Transactional bulk question import RPC for the admin dashboard.
--      Creates questions + version 1 + skill weights + tag map in ONE transaction.
--      Execution is restricted to service_role (Next.js server calls it AFTER
--      verifying the caller's admin session); anon/authenticated are revoked.

UPDATE public.users
SET role = 'admin', updated_at = now()
WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'rors7371@gmail.com'
);

CREATE OR REPLACE FUNCTION public.admin_bulk_import_questions(batch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_item        jsonb;
  v_question_id bigint;
  v_slug        text;
  v_type        text;
  v_difficulty  smallint;
  v_count       int  := 0;
  v_ids         jsonb := '[]'::jsonb;
BEGIN
  IF jsonb_typeof(batch) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'batch must be a JSON array';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(batch)
  LOOP
    v_slug := NULLIF(trim(COALESCE(v_item->>'slug', '')), '');
    IF v_slug IS NULL OR char_length(v_slug) < 3 THEN
      RAISE EXCEPTION 'row %: invalid slug', v_count + 1;
    END IF;

    v_type := COALESCE(v_item->>'type', 'multiple_choice');
    IF v_type NOT IN ('multiple_choice', 'fill_blank', 'coding', 'open_ended', 'debugging') THEN
      RAISE EXCEPTION 'row %: invalid question type %', v_count + 1, v_type;
    END IF;

    v_difficulty := COALESCE((v_item->>'difficulty')::smallint, 3);
    IF v_difficulty < 1 OR v_difficulty > 5 THEN
      RAISE EXCEPTION 'row %: difficulty must be 1..5', v_count + 1;
    END IF;

    INSERT INTO public.questions (slug, type, difficulty, status)
    VALUES (v_slug, v_type, v_difficulty, 'draft')
    RETURNING id INTO v_question_id;

    INSERT INTO public.question_versions (question_id, version, title, description, content, test_cases, language)
    VALUES (
      v_question_id,
      1,
      COALESCE(NULLIF(v_item->>'title', ''), v_slug),
      v_item->>'description',
      COALESCE(v_item->'content', '{}'::jsonb),
      v_item->'test_cases',
      v_item->>'language'
    );

    IF jsonb_typeof(v_item->'skill_weights') = 'object' THEN
      INSERT INTO public.question_skills (question_id, skill_id, weight)
      SELECT v_question_id,
             (key)::int,
             GREATEST(0::numeric, LEAST(1::numeric, (value)::numeric))
      FROM jsonb_each_text(v_item->'skill_weights');
    END IF;

    IF jsonb_typeof(v_item->'tag_ids') = 'array' THEN
      INSERT INTO public.question_tag_map (question_id, tag_id)
      SELECT v_question_id, (t)::int
      FROM jsonb_array_elements_text(v_item->'tag_ids') AS t;
    END IF;

    v_ids   := v_ids || to_jsonb(v_question_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('imported', v_count, 'question_ids', v_ids);
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_bulk_import_questions(jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_import_questions(jsonb) TO service_role;
