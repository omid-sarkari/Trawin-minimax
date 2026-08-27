-- File: supabase/migrations/20260822120000_auth_trigger_v2_role_users.sql
-- Purpose: v2 of handle_new_user.
--   1. Honor the role chosen at signup (user metadata: role = developer|company).
--   2. Create the app-level public.users record with status='active'.
-- Note: never edit an applied migration — this replaces the function wholesale.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'developer');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    (SELECT id FROM public.roles WHERE name = v_role LIMIT 1)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (auth_user_id, role, status)
  VALUES (NEW.id, v_role, 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
