-- File: supabase/migrations/20260822130000_auth_trigger_v3_link_profile.sql
-- Purpose: fix profile linkage discovered by live-schema inspection.
--   The v2 trigger created profiles(id = auth.uid) leaving user_id NULL, while the
--   actual schema links profiles -> users via UNIQUE user_id FK (see dashboard view).
--   v3 inserts users first (RETURNING id) and links the profile properly.
--   Keeps requested behavior: role from metadata, default 'developer', status='active'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'developer');
  v_user_id UUID;
BEGIN
  INSERT INTO public.users (auth_user_id, role, status)
  VALUES (NEW.id, v_role, 'active')
  ON CONFLICT (auth_user_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = now()
  RETURNING id INTO v_user_id;

  INSERT INTO public.profiles (user_id, email, full_name, role_id)
  VALUES (
    v_user_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    (SELECT id FROM public.roles WHERE name = v_role LIMIT 1)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role_id = EXCLUDED.role_id,
        updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
