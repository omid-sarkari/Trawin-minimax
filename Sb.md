IMPORTANT — READ THIS BEFORE MAKING ANY CODE CHANGES

We are building the Trawin project and the Supabase database is already configured.

I need you to treat the CURRENT Supabase database schema as the source of truth.

Do NOT assume your previous database schema.
Do NOT recreate tables blindly.
Do NOT invent columns.
Do NOT change the existing architecture just to make your code easier.

==================================================
CURRENT SUPABASE PROJECT
==================================================

Supabase project:
rnckgzjcmoipuviqoquj

Supabase CLI is already installed and available in the terminal/Termux environment.

The current application-level user architecture is based on:

auth.users
    ↓
public.users
    ↓
application tables

The public.users table is the main application-level user table.

Many existing application tables reference public.users.id, including things such as:

- applications.user_id
- code_submissions.user_id
- coding_sessions.user_id
- company_members.user_id
- evaluations.user_id
- exam_sessions.user_id

Therefore:

public.users.id is the application's canonical user ID.

Do NOT replace this architecture with auth.users.id as the application's user ID.

public.users.auth_user_id is the relationship between the Supabase Auth user and the application-level user.

==================================================
ROLES
==================================================

The current public.roles table contains:

1 = developer
2 = company
3 = admin

The signup system is intended to support at least:

developer
company

with developer as the default role when no role is supplied.

==================================================
THE AUTH TRIGGER REQUIREMENT
==================================================

You previously requested this exact behavior:

When a new user is inserted into auth.users:

1. Read the signup metadata:
   raw_user_meta_data->>'role'

2. If role is empty/null, default to:
   developer

3. Create the user's public profile.

4. Create the application-level public.users record with:
   auth_user_id = auth.users.id
   role = selected role
   status = 'active'

5. The operation must happen automatically through an AFTER INSERT trigger on auth.users.

The intended function is:

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

IMPORTANT:
The above is the requested application behavior.

However, the CURRENT DATABASE schema is the source of truth.

If the existing schema required additional compatibility columns/constraints for this exact requested function, those compatibility changes have already been made deliberately.

Do NOT redesign the requested behavior.
Build the application against the current database.

==================================================
IMPORTANT DATABASE STATE
==================================================

The database was inspected before implementing the auth trigger.

The original requested trigger referenced:

public.profiles.email
public.profiles.full_name
public.profiles.role_id

and:

public.users.auth_user_id
public.users.role
public.users.status

The database was adjusted so the requested trigger logic could be implemented without changing its intended behavior.

In particular, the profile fields required by the requested function were made available.

Therefore, do NOT "fix" the trigger by replacing the requested architecture with a different users/profiles architecture.

If you need to know the exact current schema, query Supabase directly.

==================================================
DATABASE TYPES — VERY IMPORTANT
==================================================

There is a generated file in the project called:

database.types.ts

DO NOT trust the existing generated database.types.ts as the final source of truth.

The Supabase CLI is installed and available in the terminal/Termux.

Before continuing development:

1. Remove the existing generated database.types.ts.
2. Regenerate it directly from the CURRENT linked Supabase database using the Supabase CLI.

Use the appropriate linked-project command, for example:

supabase gen types typescript --linked > database.types.ts

If the project is not currently linked, inspect the Supabase CLI state first and link the existing project rather than creating another project.

After regeneration:

3. Read the ENTIRE newly generated database.types.ts.
4. Do not only read the first part of the file.
5. Use the regenerated types as the TypeScript representation of the CURRENT database schema.
6. If the generated file differs from assumptions in the existing application code, adapt the application code to the actual database schema instead of changing the database blindly.

==================================================
CRITICAL DEVELOPMENT RULE
==================================================

From this point forward:

DATABASE → source of truth
database.types.ts → generated representation of the database
application code → must conform to both

Do NOT modify database tables simply because existing application code expects a different schema.

Before modifying any table, inspect:

- columns
- primary keys
- foreign keys
- unique constraints
- nullability
- defaults
- enums/types
- RLS policies
- triggers
- functions
- views

Especially inspect:

public.users
public.profiles
public.roles
auth.users

and their relationships.

==================================================
AUTH USER FLOW WE EXPECT
==================================================

The intended signup flow is:

Supabase Auth signup
        ↓
auth.users INSERT
        ↓
on_auth_user_created trigger
        ↓
handle_new_user()
        ↓
public.users
        ↓
public.profiles

The application must then use:

public.users.id

as the canonical application-level user ID when interacting with application tables.

Do NOT randomly use auth.users.id as user_id in application tables that reference public.users.id.

auth.users.id should be treated as the Supabase Auth identity.

public.users.id should be treated as the Trawin application identity.

==================================================
BEFORE WRITING MORE CODE
==================================================

First inspect the live Supabase schema and regenerate database.types.ts.

Then verify that the auth trigger/function currently installed in Supabase matches the intended behavior above.

Then inspect the existing codebase for any places where:

auth.users.id

is incorrectly being used where:

public.users.id

is required.

Do not make speculative migrations.

Do not duplicate tables.

Do not create a second user system.

Do not delete existing production data.

Do not replace existing migrations blindly.

Do not change the architecture without first verifying the current schema.

The goal is simple:

BUILD THE APPLICATION AGAINST THE DATABASE THAT ACTUALLY EXISTS.

==================================================
FINAL REQUIREMENT
==================================================

After regenerating database.types.ts and inspecting the complete file, summarize:

1. Current users/profiles/roles architecture
2. Current auth trigger behavior
3. Exact relationship between auth.users → users → profiles
4. Which ID the application must use as user_id
5. Any schema/code mismatch you discover
6. Any change you made

Do not claim something was fixed unless you actually verified it.