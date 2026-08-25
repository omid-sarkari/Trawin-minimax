======================================================================
TRAWIN — FULL CODEBASE / DATABASE CONSISTENCY AUDIT + SAFE MODERNIZATION
======================================================================

ROLE
You are the primary coding agent for the Trawin project.

You are working inside the EXISTING Trawin repository.

This task is NOT:
- a blind refactor
- a redesign
- a rewrite
- an architecture replacement
- a "change everything to latest" task

This task IS:

1. Inspect the CURRENT repository state completely.
2. Inspect the CURRENT live Supabase schema/state.
3. Inspect the project memory log and architectural documents.
4. Inspect the ENTIRE Admin implementation.
5. Verify whether each known issue still exists.
6. Fix ONLY issues that are actually still present.
7. Modernize outdated platform/tooling conventions where justified.
8. Preserve all working behavior.
9. Preserve database contracts.
10. Preserve references across the entire codebase.
11. After ANY rename, verify ALL usages across the repository.
12. Run full verification after every significant change.

IMPORTANT:

Do NOT assume that an issue listed below still exists.

It may already have been fixed after the previous analysis.

FIRST VERIFY.
THEN DECIDE.
THEN CHANGE ONLY IF NECESSARY.

======================================================================
0. SOURCE OF TRUTH PRIORITY
======================================================================

Use this priority order when sources disagree:

1. CURRENT LIVE SUPABASE DATABASE
2. CURRENT CHECKED-OUT GIT BRANCH / HEAD
3. CURRENT APPLICATION CODE
4. CURRENT migrations in repository
5. memory-don.md / project memory
6. Dash.md / Sb.md / architecture documents
7. Older README/history/prompts

Project memory is IMPORTANT but is NOT the final source of truth.

Do NOT blindly trust:
- previous AI analysis
- previous prompts
- README status checklists
- old memory entries

Use them as historical context.

======================================================================
1. CURRENT BRANCH
======================================================================

The repository under review is:

omid-sarkari/Trawin-minimax

The current branch intended as the reference branch is:

ci/add-workflow-behavior-intel

Reference HEAD previously identified:

e5dcab62ae3acba780bac3fbcc69db95a83f967a

Commit:

feat(admin): update admin panel, fix bugs, and add field descriptions

IMPORTANT:

Before making any change:

1. Confirm current branch.
2. Confirm current HEAD.
3. Confirm whether HEAD is newer than the referenced commit.
4. If it is newer, use the newer HEAD as truth.
5. DO NOT reset or checkout another branch.
6. Do NOT modify main.
7. Do NOT cherry-pick unrelated historical changes.

======================================================================
2. READ PROJECT MEMORY COMPLETELY
======================================================================

Find the project's memory log in the repository root.

The file currently known as:

memory-don.md

MAY have a different filename.

Find it.

Read the ENTIRE file.

Do NOT only read the first section.

This file is important because the coding AI continuously updates it with:
- actions performed
- bugs discovered
- migrations created
- decisions
- fixes
- verification results
- pending tasks
- architectural decisions

Use it as project history.

BUT:

Never assume a memory entry is still current.

For every claim that matters, verify it against:
- current source code
- current database
- current git state

======================================================================
3. READ ALL MAJOR PROJECT CONTEXT FILES
======================================================================

Read completely where available:

- memory-don.md (or current equivalent)
- TRAWIN_MASTER_CONTEXT.md
- Dash.md
- Sb.md
- README.md
- BRANCH_README.md
- AGENTS.md
- package.json
- package-lock.json
- tsconfig.json
- next.config.ts
- eslint.config.*
- .env.example

Do NOT treat documentation as authoritative over executable code.

Use it to understand intent.

======================================================================
4. FULL REPOSITORY INSPECTION
======================================================================

Inspect the complete repository tree.

Do not only inspect src/app.

Inspect:

src/
packages/
supabase/
public/
.github/
configuration files
scripts
tests
generated types
service layers
adapters
API routes
database migrations
documentation
memory files

Pay special attention to:
- duplicated implementations
- dead code
- legacy directories
- duplicate type definitions
- old architecture remnants
- unused files
- stale generated files
- conflicting contracts

Do NOT delete anything simply because it "looks old".

First prove it is dead/unreferenced.

======================================================================
5. VERY IMPORTANT — DO NOT TRUST PREVIOUS BUG REPORTS
======================================================================

The previous audit identified possible issues.

YOU MUST RECHECK EACH ONE.

For every issue:

STEP A:
Inspect current source.

STEP B:
Search all references/usages.

STEP C:
Inspect relevant database schema / constraints / policies.

STEP D:
Determine:
- STILL BROKEN
- ALREADY FIXED
- INTENTIONAL DESIGN
- PARTIALLY FIXED
- FALSE POSITIVE

STEP E:
Only if STILL BROKEN:
fix it.

At the end, report each item with one of:

[FIXED]
[ALREADY FIXED]
[VALID DESIGN]
[NOT ACTUALLY A BUG]
[REQUIRES FUTURE FEATURE]

======================================================================
6. ADMIN DASHBOARD — COMPLETE CODE AUDIT
======================================================================

Read EVERY Admin file.

At minimum inspect:

src/app/admin/
src/app/api/admin/
src/components/admin/
src/lib/admin/
src/services/
all related auth/guard files

Current known routes include:

/admin
/admin/questions
/admin/questions/new
/admin/questions/[id]
/admin/bulk-import
/admin/content
/admin/exams
/admin/users

And APIs around:

bootstrap
questions
questions/bulk
technologies
skills
tags
exams
users

DO NOT assume these are the complete set.

Find all Admin routes yourself.

======================================================================
7. ADMIN ↔ DATABASE CONSISTENCY
======================================================================

For EVERY Admin operation, map:

UI
→ API
→ service/helper
→ Supabase table/function
→ constraints
→ foreign keys
→ RLS / server authorization

Create an internal operation map such as:

Create Question:
questions
→ question_versions
→ question_skills
→ question_tag_map

Bulk Import:
admin_bulk_import_questions()
→ questions
→ question_versions
→ question_skills
→ question_tag_map

Create Technology:
technologies

Create Skill:
skills

Create Tag:
question_tags

Create Exam:
exams

Users:
users
+ authentication state
+ role enforcement

Then verify EVERY mapping.

======================================================================
8. CRITICAL ISSUE #1 — TECHNOLOGY → SKILL INTEGRITY
======================================================================

Previous audit suspected:

Frontend:
Technology
→ Skill filtered by technology_id

BUT backend:
may accept arbitrary skill_id without verifying that the skill belongs to the selected technology.

VERIFY THIS.

If a question conceptually has:

Technology = React
Skill = JavaScript Basics

the system must reject the invalid combination.

IMPORTANT:

Do not add technology_id to questions merely because it makes the UI easier.

First inspect the real schema.

If technology is intentionally derived through Skill:

Question
→ Question Skill
→ Skill
→ Technology

then preserve that architecture.

The invariant must simply be enforced.

Potentially enforce:

selected technology
must match
skill.technology_id

and/or enforce appropriate database constraints where practical.

Do NOT duplicate relationships unnecessarily.

======================================================================
9. CRITICAL ISSUE #2 — MCQ EXACTLY ONE CORRECT ANSWER
======================================================================

Inspect:

src/lib/admin/question-contracts.ts

and ALL other MCQ validators.

Verify:

multiple_choice

requires:

- options exists
- minimum valid option count according to current product rules
- option IDs are valid and unique
- option text exists
- EXACTLY ONE option has is_correct = true

Do NOT accept:

A=true
B=true

unless the product explicitly changes to multiple-correct questions.

Create Question validation and Bulk Import validation MUST use consistent rules.

Avoid duplicated validator logic where practical.

======================================================================
10. CRITICAL ISSUE #3 — BULK IMPORT VALIDATION
======================================================================

Bulk import has:

Preview
→ Commit

and transactional RPC.

Preserve atomicity.

VERIFY that the bulk path and normal single-question path enforce compatible validation.

Check:

slug
type
difficulty
title
content
test_cases
language
skill_weights
tag_ids

and question-type-specific contracts.

Do NOT rely only on browser validation.

The server-side commit path MUST not be able to create structurally invalid content merely because the frontend was bypassed.

However:

Do NOT duplicate the entire application schema in PL/pgSQL unless necessary.

Prefer one authoritative contract and secure server-side validation.

======================================================================
11. CRITICAL ISSUE #4 — ACTIVE CONTENT FILTERING
======================================================================

Previous audit suspected bootstrap endpoints may return:

inactive technologies
inactive skills
inactive tags

Verify current behavior.

Requirements:

- Existing historical data must remain intact.
- Inactive technologies/skills must remain queryable where needed for history.
- New content creation should normally use active entities.
- Existing published questions should not silently break.

If filtering is needed:

apply it to content-creation selectors.

Do NOT globally hide inactive rows from historical/admin reporting where they are still meaningful.

======================================================================
12. CRITICAL ISSUE #5 — QUESTION VERSIONING
======================================================================

Inspect the current versioning implementation.

The intended model is:

questions
=
stable question identity

question_versions
=
content/version history

Verify:

- version 1 creation
- future version creation
- old versions remain immutable if intended
- latest version is resolved correctly
- question list shows latest version correctly
- details page shows complete history

If version editing is not implemented:

DO NOT casually introduce it unless this task explicitly requires it.

Report it as:

[REQUIRES FUTURE FEATURE]

unless you find that the current UI falsely implies a feature exists.

======================================================================
13. CRITICAL ISSUE #6 — DUPLICATE QUESTION ATOMICITY
======================================================================

Inspect Duplicate Question.

If it performs:

question
→ version
→ skills
→ tags

through multiple independent writes:

determine whether partial failure can create corrupted/incomplete data.

If genuinely unsafe:

fix it using a safe transactional/server-side mechanism.

Do NOT overengineer.

Preserve existing behavior.

======================================================================
14. RBAC / ADMIN AUTHORIZATION
======================================================================

Inspect ALL admin authorization layers:

- middleware/proxy
- admin layout
- assertAdmin
- API routes
- service-role usage
- public.users.role
- roles
- permissions
- user_roles
- role_permissions

IMPORTANT:

There must not be conflicting Admin authorization systems.

If current architecture intentionally uses:

allowlist
OR
database admin role

determine whether this is intentional bootstrap behavior.

If an email allowlist exists for bootstrapping, preserve it only if still needed.

Do NOT automatically delete it.

But ensure:

- browser cannot self-promote
- API cannot trust client role
- service role is never exposed
- self-demotion/self-lockout rules remain correct
- admin mutations are server-side

======================================================================
15. SERVICE ROLE SECURITY
======================================================================

Verify every use of:

SUPABASE_SERVICE_ROLE_KEY

Requirements:

- server only
- never NEXT_PUBLIC_
- never sent to browser
- never embedded in client bundle
- never logged
- never exposed through API response

Keep service-role operations isolated.

======================================================================
16. JUDGE0 ARCHITECTURE
======================================================================

IMPORTANT PRODUCT DECISION:

Judge0 is NOT the whole assessment engine.

Judge0 is a code execution provider.

Use Judge0 ONLY for:

- coding questions
- debugging questions
- coding contests
- team coding competitions
- any future feature that genuinely requires code execution

DO NOT use Judge0 for:

- multiple choice
- fill in the blank
- ordinary open-ended questions
- static informational content

Desired architecture:

Assessment Engine
|
+-- MCQ evaluator
+-- Fill Blank evaluator
+-- Open-ended evaluator
|
+-- Code evaluator
      |
      +-- Judge0 provider

Judge0 must remain replaceable.

======================================================================
17. JUDGE0 ENVIRONMENT CONFIGURATION
======================================================================

Use environment variables.

Current contract includes:

JUDGE0_URL
JUDGE0_AUTH_TOKEN

VERIFY exact current variable names in the repository.

Requirements:

- no hardcoded URL
- no hardcoded token
- no fallback secret
- no mock credential in production
- no client-side exposure
- if required configuration is absent, code execution must fail clearly or be disabled safely

Do not make the rest of the assessment engine depend on Judge0.

Architecture should allow:

Judge0 Cloud now
→ private Judge0/VPS later

without rewriting assessment logic.

======================================================================
18. NEXT.JS VERSION / MODERNIZATION
======================================================================

IMPORTANT:

Do NOT assume "latest" blindly.

Inspect the CURRENT installed Next.js version first.

Current project is expected to use Next.js 16.x.

Official Next.js 16 changes include:

- Node.js >= 20.9
- Turbopack default
- middleware convention deprecated
- middleware renamed to proxy
- proxy function name should be proxy

Official references:
https://nextjs.org/docs/app/guides/upgrading/version-16
https://nextjs.org/docs/app/getting-started/proxy

VERIFY current repository against these rules.

======================================================================
19. MIDDLEWARE vs PROXY — VERY IMPORTANT
======================================================================

Do NOT misunderstand this.

"middleware.ts" here refers to the Next.js application routing/request layer.

It is NOT:
- Supabase PostgreSQL middleware
- RLS
- database middleware
- Supabase Edge middleware

Next.js 16 renamed the application convention:

middleware.ts
→
proxy.ts

and:

middleware()
→
proxy()

The functionality is conceptually the request proxy boundary.

If the current project is on Next.js 16 and still uses deprecated middleware convention:

1. VERIFY whether migration is safe.
2. Search ALL references.
3. Rename file if needed.
4. Rename export.
5. Update configuration references if any.
6. Verify no imports/references remain.
7. Run TypeScript.
8. Run build.
9. Run tests.

IMPORTANT:

Do NOT treat Proxy as the complete authorization layer.

Authorization must remain enforced server-side.

Official Next.js guidance explicitly says Proxy should not become the full session/authorization solution.

======================================================================
20. NODE.JS MODERNIZATION
======================================================================

Inspect:

package.json
package-lock.json
CI workflow
Vercel configuration
engines
development assumptions
tooling

Previous project state used Node 18 in CI.

Verify whether that is still true.

Next.js 16 requires Node 20.9+.

Current Node release status:
- Node 24 = LTS
- Node 26 = Current

Production preference:
Node 24 LTS

Do NOT simply choose Node 26 because it is newer.

Use:

Latest stable ecosystem-supported LTS

for production unless a project dependency explicitly requires otherwise.

If upgrading Node:
- update CI
- update docs
- add package.json engines if appropriate
- update .nvmrc / .node-version if project uses one
- verify Vercel compatibility
- update lock/install behavior if required

Search for all references to Node version.

======================================================================
21. TYPESCRIPT MODERNIZATION
======================================================================

Inspect current TypeScript version.

Current project historically used:

TypeScript 5.9.x

TypeScript 6.0 is now available.

Do NOT blindly upgrade.

First inspect:

- tsconfig.json
- compilerOptions
- deprecated settings
- package compatibility
- generated Supabase types
- behavior-intelligence package
- Next.js
- ESLint
- build scripts

If TypeScript 6 is compatible:

1. upgrade
2. run tsc
3. run build
4. run tests
5. fix deprecations/errors only where necessary

If TypeScript 6 causes meaningful compatibility regressions:

KEEP 5.9.x

and report:

[DEFERRED FOR COMPATIBILITY]

Do not force the upgrade.

======================================================================
22. NEXT.JS + REACT VERSION REVIEW
======================================================================

Inspect actual installed versions.

Do not rely on memory.

For upgrades:
- verify latest stable version
- inspect official Next.js upgrade notes
- inspect dependency compatibility
- use official codemods when appropriate
- avoid canary/beta unless explicitly required

Do NOT upgrade a framework package merely for vanity version numbers.

The goal is:

current + supported + stable + compatible.

======================================================================
23. GENERATED DATABASE TYPES
======================================================================

Inspect:

src/types/database.ts

Determine whether it is generated or partially hand-maintained.

If generated:

do NOT manually edit it.

Regenerate from the CURRENT linked Supabase project when appropriate.

Then search for type drift elsewhere.

Especially inspect:

src/types/index.ts

for old domain types that disagree with the real database/application contract.

Known historical drift included question types such as:

code
essay

while current question contract uses:

coding
open_ended
debugging

VERIFY CURRENT STATE BEFORE CHANGING.

======================================================================
24. SEARCH FOR ALL TYPE / CONTRACT DUPLICATION
======================================================================

Search for:

QuestionType
QuestionStatus
Difficulty
UserRole
Exam
CodingEvent
QuestionVersionContent
etc.

Find:
- duplicate definitions
- stale types
- old aliases
- legacy contracts

Do NOT delete duplicate definitions automatically.

Determine whether they are:
- imported
- exported
- runtime-used
- package-local
- legacy but harmless

If a rename is required:

UPDATE EVERY REFERENCE.

======================================================================
25. RENAME SAFETY RULE
======================================================================

This rule is MANDATORY.

If you rename ANYTHING:

- file
- folder
- exported function
- route
- TypeScript type
- interface
- environment variable
- database function
- database column
- service class
- package name

then immediately:

1. Search entire repository for old name.
2. Search entire repository for new name.
3. Check imports.
4. Check dynamic references.
5. Check strings.
6. Check route references.
7. Check documentation.
8. Check tests.
9. Check CI.
10. Check environment files.
11. Check Supabase functions/migrations if relevant.

Do NOT leave half-migrated names.

======================================================================
26. DATABASE RENAMES
======================================================================

If changing a database identifier:

DO NOT simply rename it in source code.

First identify:
- all foreign keys
- policies
- functions
- triggers
- views
- RPC calls
- generated types
- migrations
- application code

Use a migration when required.

Never modify an already-applied migration to hide history.

Create a new migration.

======================================================================
27. RLS / POLICY REVIEW
======================================================================

Verify Admin APIs do not accidentally assume RLS when using service-role.

Verify ordinary user operations still rely on RLS where intended.

Look for:

auth.uid()

versus

public.users.id

versus

public.users.auth_user_id

This project intentionally separates:
Supabase Auth identity
from
application user identity.

Do NOT collapse them.

Whenever the application needs public.users.id:

use the proper mapping/helper.

Do not casually use auth.uid() as a substitute.

======================================================================
28. CHECK ALL USER ID MAPPING
======================================================================

Current intended identity model:

auth.users.id
      ↓
public.users.auth_user_id
      ↓
public.users.id
      ↓
application foreign keys

Verify every Admin/Assessment/Coding operation follows the correct mapping.

This is especially important for:

- answers
- exam_sessions
- coding_sessions
- code_submissions
- evaluations
- resumes
- applications
- audit logs

======================================================================
29. EXAM SYSTEM
======================================================================

Do not build the runtime yet unless explicitly requested.

For this task, only verify the current state.

Inspect:

exams
exam_questions
exam_sessions
answers
answer_evaluations
evaluations
skill_scores

Determine:

- what is already implemented
- what is only schema
- what Admin currently supports
- what is missing

Do not claim Exam Runtime exists if only Exam CRUD exists.

======================================================================
30. QUALITY BAR
======================================================================

After changes:

Run:

- TypeScript type check
- production build
- tests
- lint if configured
- repository search for renamed identifiers
- relevant SQL/static verification

If the project has CI scripts, run the equivalent commands.

Do not say "build passed" unless you actually ran it.

======================================================================
31. GIT SAFETY
======================================================================

Before editing:

record:
- branch
- commit
- working tree status

After editing:

show:
- changed files
- why each changed
- migration files created
- package versions changed
- environment variables changed
- tests run
- build result

Do not modify unrelated files.

======================================================================
32. CHANGE POLICY
======================================================================

For every proposed change:

FIRST ASK INTERNALLY:

Is this:
A) required?
B) verified?
C) compatible?
D) safe?
E) actually missing?

If any answer is no:

do not change it.

======================================================================
33. VERY IMPORTANT — DO NOT FIGHT THE EXISTING ARCHITECTURE
======================================================================

Do NOT replace working design merely because you prefer another pattern.

Examples:

Do NOT replace JSONB MCQ with a new question_options table unless absolutely necessary.

Do NOT replace the current technology → skill → question relationship with a parallel hierarchy.

Do NOT redesign the Assessment Engine from scratch.

Do NOT introduce unnecessary dependencies.

Do NOT replace Supabase.

Do NOT replace Next.js.

Do NOT replace the Behavior Intelligence package.

Do NOT replace the Judge0 provider abstraction.

Improve the existing architecture.

======================================================================
34. DOCUMENTATION / MEMORY UPDATE
======================================================================

After successful fixes:

Update the project memory file:

memory-don.md

with:

- what was inspected
- what was still broken
- what was already fixed
- what was changed
- why
- tests/build results
- remaining technical debt
- next logical phase

Do NOT rewrite the entire historical memory.

Append a new dated section.

Also update documentation only when required by an actual change.

======================================================================
35. FINAL REPORT FORMAT
======================================================================

At the end, produce a report with:

A. VERIFIED CURRENT STATE

B. ALREADY FIXED ISSUES

C. ISSUES STILL FOUND

D. FIXES APPLIED

E. FILES CHANGED

F. DATABASE CHANGES
   - migrations
   - functions
   - policies

G. PACKAGE / RUNTIME CHANGES
   - Node
   - TypeScript
   - Next.js
   - React
   - other packages

H. ENVIRONMENT CHANGES

I. TESTS

J. BUILD

K. REMAINING TECHNICAL DEBT

L. NEXT RECOMMENDED PHASE

======================================================================
36. FINAL NON-NEGOTIABLE RULE
======================================================================

NEVER change the project because a previous AI told you to.

NEVER refuse to change the project because a previous AI said it was correct.

VERIFY EVERYTHING.

The current code + current database + current official framework documentation
must determine the truth.

======================================================================
TASK START
======================================================================

START NOW.

First:
- inspect branch and HEAD
- inspect repository tree
- find and fully read memory-don.md
- inspect current package versions
- inspect Next.js runtime conventions
- inspect entire Admin implementation
- inspect relevant Supabase schema
- inspect current migrations
- inspect authentication and authorization
- inspect question contracts
- inspect Judge0 integration status
- inspect CI/runtime versions

THEN:

Re-evaluate every known issue.

Only after verification should you edit anything.

Do not skip verification.

Do not assume previous analysis is still current.

======================================================================