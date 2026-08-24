به‌مدت 49s پردازش کرد

آره. این بار از خود Supabase + migration history بررسی کردم و می‌توانم با اطمینان بگویم چه چیزی واقعاً ساخته شده و چه چیزی هنوز ساخته نشده.

نکته مهم: در حال حاضر جدول questions خالی است؛ یعنی موتور سؤال ساخته شده، ولی هنوز سؤال واقعی داخلش Seed نشده. همین‌طور question_versions و question_skills هم برای داده‌های سؤال آماده‌اند.

1. تکنولوژی‌ها — technologies

الان دقیقاً ۷ تکنولوژی داریم:

#	نام	نوع

1	JavaScript	Language
2	TypeScript	Language
3	HTML	Markup
4	CSS	Styling
5	Tailwind CSS	Styling
6	React	Framework
7	Next.js	Framework


پس بله؛ چیزی که گفتی دقیقاً در دیتابیس ساخته شده.


---

2. مهارت‌های هر تکنولوژی — skills

برای هر Technology یک لایه Skill ساخته‌ایم.

JavaScript

JavaScript Basics

Async JavaScript


TypeScript

TypeScript Basics


HTML

HTML Structure


CSS

CSS Layout


Tailwind CSS

Tailwind CSS Components


React

React Components

React Hooks


Next.js

Next.js Routing


یعنی معماری این است:

Technology
    ↓
Skills
    ↓
Questions

و نکته خیلی خوبش این است که skills.parent_id داریم؛ یعنی سیستم از همین الان قابلیت Skill Hierarchy دارد.


---

3. خود سؤال — questions

این جدول هسته سؤال است.

هر Question دارد:

id
slug
type
difficulty
status
created_at
updated_at

Difficulty

اینجا خیلی مهم است:

difficulty = 1 تا 5

یعنی ما ۵ سطح سختی ساخته‌ایم:

1 = خیلی ساده
2 = ساده
3 = متوسط
4 = سخت
5 = خیلی سخت

البته خود دیتابیس فقط می‌گوید مقدار باید بین 1 تا 5 باشد؛ معنای دقیق متنی بالا هنوز به‌صورت constraint در دیتابیس تعریف نشده.


---

4. نوع سؤال — questions.type

۵ نوع سؤال را از قبل طراحی کرده‌ایم:

multiple_choice
fill_blank
coding
open_ended
debugging

یعنی سیستم فقط چهارگزینه‌ای نیست.

داریم:

1. Multiple Choice

سؤال چندگزینه‌ای.

2. Fill Blank

جای خالی.

3. Coding

سؤال برنامه‌نویسی واقعی.

4. Open Ended

پاسخ تشریحی/باز.

5. Debugging

کد خراب داده می‌شود و کاربر باید مشکل را پیدا/حل کند.


---

5. نکته خیلی مهم درباره Coding

این همان چیزی است که خودت الان متوجهش شدی:

Coding یک مسیر جدا دارد.

یعنی:

Question
   │
   ├── Multiple Choice
   ├── Fill Blank
   ├── Open Ended
   ├── Debugging
   │
   └── Coding
          ↓
   code_submissions
          ↓
   execution_results
          ↓
   code_similarity_reports

برای Coding حتی coding_sessions هم داریم:

coding_sessions

که به:

رفتار کاربر

Editor Events

Snapshots

Coding Events

Clipboard Markers

AI Detection

Code Metrics


وصل شده.

یعنی Coding Engine عملاً یک سیستم جدا از سؤال‌های معمولی است.


---

6. نسخه سؤال — question_versions

این یکی خیلی مهم است.

ما سؤال را مستقیماً با متن ثابت ذخیره نکرده‌ایم.

داریم:

questions
   ↓
question_versions

هر Version شامل:

title

description

content → JSONB

test_cases → JSONB

language

version


است.

پس می‌توانیم مثلاً:

Question #15
 ├── Version 1
 ├── Version 2
 └── Version 3

داشته باشیم.

این برای versioned question engine خیلی خوب است.


---

7. ارتباط سؤال با Skill — question_skills

این قسمت دقیقاً برای همان چیزی است که قبلاً درباره تشخیص سطح مهارت کاربر طراحی کرده بودیم.

هر سؤال می‌تواند به چند Skill وصل شود:

Question
   ├── JavaScript Basics
   ├── Async JavaScript
   └── ...

و مهم‌تر:

weight

هم دارد.

پس یک سؤال می‌تواند مثلاً:

JavaScript Basics = 0.7
Async JavaScript = 0.3

وزن داشته باشد.

این یعنی سؤال فقط «درست/غلط» نیست؛ می‌تواند روی پروفایل مهارتی کاربر اثر بگذارد.


---

8. Tag سیستم — question_tags

برای سؤال‌ها Tag هم داریم:

question_tags

و رابطه:

question_tag_map

پس:

Question
   ↓
Tags

مثلاً در آینده:

arrays
async
hooks
routing
dom
flexbox

و غیره.


---

9. Template سیستم — question_templates

این هم خیلی مهم است.

الان ۳ Template Seed شده:

Template	نوع

Multiple Choice Template	multiple_choice
Coding Challenge Template	coding
Debugging Template	debugging


یعنی Question Engine از ابتدا Template-driven طراحی شده.

Schema هم JSONB است، بنابراین قالب سؤال می‌تواند قابل توسعه باشد.


---

10. آیا ۴ گزینه‌ای دقیقاً ساخته‌ایم؟

اینجا باید دقیق باشم:

جدول مستقلی مثل question_options در schema فعلی وجود ندارد.

یعنی من نمی‌توانم بگویم:

> «برای چهارگزینه‌ای جدول A,B,C,D ساخته‌ایم.»



چنین چیزی در دیتابیس فعلی نیست.

در عوض question_versions.content از نوع JSONB است و Template مربوط به Multiple Choice هم داریم.

پس احتمالاً گزینه‌های Multiple Choice قرار است داخل content نگهداری شوند.

اما چون هیچ Question واقعی فعلاً وجود ندارد، هنوز یک نمونه واقعی از JSON گزینه‌های چهارگزینه‌ای در دیتابیس نداریم که بگوییم دقیقاً ساختارش چیست.

این را عمداً شفاف می‌گویم چون تو گفتی ۱۰۰٪ مطمئن شو.


---

11. Exam — exams

آزمون از سؤال جداست.

exams شامل:

Track

عنوان

توضیحات

مدت آزمون

engine_version

وضعیت


است.

و وضعیت‌ها:

draft
published
archived
closed


---

12. سؤال‌های داخل آزمون — exam_questions

این جدول می‌گوید:

کدام سؤال
داخل کدام آزمون
با چه ترتیبی
و با چه وزنی

دارد:

exam_id
question_id
question_order
weight

پس می‌توانیم مثلاً:

Exam
 ├── Q1 → weight 1
 ├── Q2 → weight 2
 ├── Q3 → weight 1
 └── Q4 → weight 3

داشته باشیم.


---

13. اجرای آزمون — exam_sessions

این خود آزمون نیست.

یک instance از اجرای آزمون توسط یک User است.

مثلاً:

Omid
   ↓
JavaScript Assessment
   ↓
Exam Session #XYZ

و وضعیت‌ها:

started
submitted
evaluating
completed
cancelled

همچنین:

started_at
finished_at
score

دارد.


---

14. پاسخ کاربر — answers

هر پاسخ:

session_id
question_id
answer_data
is_correct
time_spent_seconds

دارد.

یعنی ما علاوه بر درست/غلط، زمان صرف‌شده برای سؤال را هم نگه می‌داریم.

و answer_data هم JSONB است، بنابراین برای انواع مختلف سؤال انعطاف‌پذیر است.


---

15. ارزیابی پاسخ — answer_evaluations

این لایه بعد از Answer قرار گرفته:

Answer
   ↓
Answer Evaluation

دارای:

evaluator_type
result JSONB

است.

پس می‌توانیم evaluatorهای مختلف داشته باشیم.


---

16. Evaluation کلی — evaluations

اینجا نتیجه کلی ارزیابی کاربر ذخیره می‌شود:

overall_score
level
confidence
engine_version

و Level فعلی:

junior
mid
senior
expert

است.


---

17. Skill Score — skill_scores

این قسمت برای Trawin بسیار مهم است.

به‌جای اینکه فقط بگوییم:

> «امتیاز کاربر ۸۲ شد»



می‌توانیم بگوییم:

JavaScript Basics → 91
Async JavaScript → 72
React Hooks → 84
Next.js Routing → 63

چون:

evaluation
    ↓
skill_scores
    ↓
skill

داریم.

و هر Skill Score همچنین:

score
confidence
metadata

دارد.


---

18. Skill Level

جدول:

skill_levels

ساخته شده و برای سطح‌بندی Skill طراحی شده.

همچنین:

skill_relations

داریم.

این یعنی سیستم می‌تواند رابطه‌هایی مثل:

JavaScript Basics
       ↓
Async JavaScript

یا در آینده:

React Basics
       ↓
React Hooks

را مدل کند.

relation_type هم دارد و مقدار پیش‌فرضش:

requires

است.


---

19. Track

tracks

لایه بالاتر از Technology است.

و:

track_technologies

مشخص می‌کند یک Track چه تکنولوژی‌هایی دارد و برای هرکدام:

priority
weight

داریم.

پس معماری می‌تواند این باشد:

Track
 ↓
Technology
 ↓
Skill
 ↓
Question
 ↓
Exam


---

جمع‌بندی معماری سؤال Trawin

چیزی که واقعاً الان در دیتابیس ساخته‌ایم این است:

TRACK
                      │
                      ▼
                TECHNOLOGIES
                      │
                      ▼
                    SKILLS
                  ↙   ↓   ↘
             Relations  Levels
                      │
                      ▼
                  QUESTIONS
                ↙     ↓      ↘
        Versions    Skills    Tags
           │
           ▼
        Templates
           │
           ▼
          EXAM
           │
           ▼
     EXAM_QUESTIONS
           │
           ▼
      EXAM_SESSION
           │
           ▼
         ANSWERS
           │
           ▼
  ANSWER_EVALUATIONS
           │
           ▼
      EVALUATIONS
           │
           ▼
      SKILL_SCORES

و برای کدنویسی:

QUESTION(type=coding)
        │
        ▼
 CODE_SUBMISSIONS
        │
        ├── EXECUTION_RESULTS
        │
        └── CODE_SIMILARITY_REPORTS
        │
        ▼
 CODING_SESSION
        │
        ├── EDITOR_EVENTS
        ├── CODING_EVENTS
        ├── CODING_SNAPSHOTS
        ├── CLIPBOARD_MARKERS
        ├── CODE_METRICS
        └── AI_DETECTION_RESULTS

و وضعیت واقعی الان

ساختار موتور سؤال و ارزیابی: ساخته شده ✅

۷ تکنولوژی موردنظر تو: ساخته شده ✅

Skillهای اولیه: ساخته شده ✅

Difficulty 1–5: ساخته شده ✅

۵ نوع سؤال: ساخته شده ✅

Question Versioning: ساخته شده ✅

Skill Mapping + Weight: ساخته شده ✅

Tag System: ساخته شده ✅

Question Templates: ساخته شده ✅

Exam Engine: ساخته شده ✅

Exam Session: ساخته شده ✅

Answer + Time Tracking: ساخته شده ✅

Answer Evaluation: ساخته شده ✅

Overall Evaluation + Confidence + Level: ساخته شده ✅

Per-Skill Scoring: ساخته شده ✅

Coding Engine جدا: ساخته شده ✅

JavaScript / TypeScript / HTML / CSS / Tailwind / React / Next.js: همگی در technologies هستند ✅

اما دو نکته هنوز باید حواسمان باشد:

1. خود Questionها هنوز Seed نشده‌اند؛ questions الان ۰ رکورد دارد.


2. ساختار دقیق گزینه‌های ۴گزینه‌ای هنوز با داده واقعی اثبات نشده؛ چون جدول question_options نداریم و هنوز سؤال Multiple Choice واقعی هم نداریم. فعلاً زیرساختش question_versions.content JSONB + Multiple Choice Template است.



این دو مورد را نباید با «ساخته شدن موتور» اشتباه بگیریم. موتور ساخته شده؛ محتوای واقعی سؤال و قرارداد دقیق JSON گزینه‌ها بعدا باید تکمیل/تعریف شود.





promt for ai:



============================================================
TRAWIN — ADMIN DASHBOARD / QUESTION & ASSESSMENT MANAGEMENT
============================================================

IMPORTANT:
You are building an ADMIN dashboard for the existing Trawin project.

The CURRENT Supabase PostgreSQL database is the source of truth.

Do NOT invent a new question architecture.
Do NOT create duplicate tables.
Do NOT hardcode technology/framework/skill IDs.
Do NOT assume that the current list of technologies will remain unchanged.

The admin UI must dynamically read the current database and write back to the correct existing tables.

============================================================
1. CURRENT DATABASE ARCHITECTURE
============================================================

The current question/assessment architecture contains these major entities:

TECHNOLOGY
    ↓
SKILL
    ↓
QUESTION
    ↓
QUESTION VERSION
    ↓
EXAM
    ↓
EXAM QUESTION
    ↓
EXAM SESSION
    ↓
ANSWER
    ↓
ANSWER EVALUATION
    ↓
EVALUATION
    ↓
SKILL SCORE


There is also a separate coding pipeline:

QUESTION(type=coding)
    ↓
CODE SUBMISSION
    ↓
EXECUTION RESULTS
    ↓
CODE SIMILARITY / CODE ANALYSIS
    ↓
CODING SESSION / TELEMETRY


Do not merge the coding system with the ordinary question system.

============================================================
2. TECHNOLOGIES
============================================================

Existing table:

public.technologies

Columns:

id
slug
name
category
active
created_at

Current seed data:

1 = JavaScript
2 = TypeScript
3 = HTML
4 = CSS
5 = Tailwind CSS
6 = React
7 = Next.js

Categories currently include:

language
markup
styling
framework

IMPORTANT:

These are NOT hardcoded constants in the frontend.

The admin dashboard must always query:

public.technologies

and display active technologies dynamically.

If an administrator adds a new technology later, it must automatically appear in the question-management UI.

Never write:

if technology === "React" ...

Never hardcode:

technology_id = 6

Always use the database ID returned by the query.

============================================================
3. TECHNOLOGY MANAGEMENT
============================================================

The admin must have a Technology Management section.

Admin must be able to:

- list technologies
- search technologies
- create technology
- edit technology
- activate/deactivate technology

Create form:

name
slug
category
active

Validate slug uniqueness.

Do NOT delete technologies by default.

Prefer soft deactivation using:

active = false

because existing skills/questions may reference the technology.

When a technology is deactivated:

- existing questions must NOT be deleted
- existing skills must NOT be deleted
- historical evaluations must NOT be modified

The technology simply becomes unavailable for new content selection.

============================================================
4. SKILLS
============================================================

Existing table:

public.skills

Columns:

id
technology_id
parent_id
slug
name
active

Current skills:

JavaScript:
- JavaScript Basics
- Async JavaScript

TypeScript:
- TypeScript Basics

HTML:
- HTML Structure

CSS:
- CSS Layout

Tailwind CSS:
- Tailwind CSS Components

React:
- React Components
- React Hooks

Next.js:
- Next.js Routing

IMPORTANT:

Skills belong to technologies.

The admin UI must therefore behave hierarchically:

Technology
    ↓
Skills

When admin selects:

React

the skill selector must dynamically load:

React Components
React Hooks

Do not show unrelated skills.

When admin creates a new skill:

- select technology dynamically
- optionally select parent skill
- enter name
- enter slug
- active/inactive

Do not hardcode technology IDs or skill IDs.

============================================================
5. QUESTION TABLE
============================================================

Existing table:

public.questions

Columns:

id
slug
type
difficulty
status
created_at
updated_at

Question difficulty is currently represented as:

smallint

with the intended range:

1–5

The admin UI should present this as:

1 — Very Easy
2 — Easy
3 — Medium
4 — Hard
5 — Very Hard

Do NOT store these English labels instead of the numeric value.

Store the numeric difficulty.

The UI can translate the numeric value into a human-readable label.

Question status currently defaults to:

draft

The admin UI should support the database's actual status model rather than inventing a different status system.

============================================================
6. QUESTION TYPES
============================================================

Current question type architecture supports:

multiple_choice
fill_blank
coding
open_ended
debugging

The form MUST change dynamically according to question type.

DO NOT build one giant form with every field visible at once.

Example:

If type = multiple_choice:

show multiple-choice editor.

If type = coding:

show coding-specific editor.

If type = debugging:

show debugging-specific editor.

If type = fill_blank:

show fill-blank editor.

If type = open_ended:

show open-ended editor.

This is critical.

============================================================
7. QUESTION VERSIONING
============================================================

Existing table:

public.question_versions

Columns:

id
question_id
version
title
description
content JSONB
test_cases JSONB
language
created_at

A question has versions.

Therefore:

questions = stable question identity

question_versions = actual content/version

Do NOT put all question content directly into public.questions.

When creating a new question:

1. Create the question record.
2. Create version 1 in question_versions.
3. Connect the question to its skills.
4. Connect tags if applicable.

When editing an existing question:

DO NOT silently destroy the previous version if the system expects versioning.

Create a new version when the content is materially changed.

The admin UI should show:

Version 1
Version 2
Version 3
...

and allow viewing previous versions.

============================================================
8. MULTIPLE CHOICE
============================================================

There is currently NO separate question_options table.

The database currently provides:

question_versions.content JSONB

and:

question_templates

with:

Multiple Choice Template
type = multiple_choice

Therefore, do NOT create a new question_options table just for the admin dashboard.

The multiple-choice editor should store its structured data inside:

question_versions.content

The exact JSON contract should be centralized in the application.

Recommended conceptual structure:

{
  "question": "...",
  "options": [
    {
      "id": "A",
      "text": "...",
      "is_correct": false
    },
    {
      "id": "B",
      "text": "...",
      "is_correct": true
    },
    {
      "id": "C",
      "text": "...",
      "is_correct": false
    },
    {
      "id": "D",
      "text": "...",
      "is_correct": false
    }
  ],
  "explanation": "..."
}

IMPORTANT:

Do not assume that exactly four options must always exist unless the product specification requires that.

The UI should support a configurable number of options, while the default multiple-choice experience can start with 4.

The correct answer must be represented explicitly.

Never rely on the option's array position alone.

============================================================
9. QUESTION → SKILL
============================================================

Existing table:

public.question_skills

Columns:

id
question_id
skill_id
weight

This is extremely important.

A question can evaluate one or multiple skills.

Example:

Question:

"Which JavaScript mechanism is responsible for..."

Could map to:

JavaScript Basics = 0.7
Async JavaScript = 0.3

The admin UI must therefore allow:

+ Add Skill

and dynamically select:

Technology
    ↓
Skill

Then allow setting the weight.

Validate weights.

Do not hardcode skill IDs.

The UI should show the current total weight and warn if the configuration is invalid.

Prefer a normalized weighting strategy.

============================================================
10. TAGS
============================================================

Existing tables:

public.question_tags

public.question_tag_map

Tags are many-to-many.

The admin UI must allow:

- search existing tags
- select multiple tags
- create a new tag
- attach tags to questions

Do not duplicate tags.

Use slug uniqueness.

============================================================
11. QUESTION TEMPLATES
============================================================

Existing table:

public.question_templates

Current templates:

Multiple Choice Template
Coding Challenge Template
Debugging Template

The template system exists so the admin UI should be designed to be extensible.

Do not make the UI architecture depend permanently on only these three templates.

Use question type + template/schema to determine the editor where appropriate.

============================================================
12. CODING QUESTIONS
============================================================

Coding is a separate and much more advanced path.

When:

question.type = coding

the admin form must expose coding-specific fields.

The current database has:

question_versions.language
question_versions.test_cases

The coding system also has its own submission/execution/analysis infrastructure.

Do NOT treat coding questions like multiple-choice questions.

The coding editor should support:

- programming language
- problem statement
- description
- starter code where applicable
- test cases
- expected behavior
- constraints
- examples

But store these according to the CURRENT database contract.

Do not invent new tables unless the existing schema genuinely cannot support a required feature.

============================================================
13. BULK QUESTION IMPORT — VERY IMPORTANT
============================================================

This is a CORE REQUIREMENT.

The admin must NOT be forced to create questions one by one.

I need to be able to prepare:

100 Easy JavaScript questions

or:

100 Medium React questions

or:

100 Hard Next.js questions

etc.

The workflow should be:

STEP 1
Select Technology dynamically from public.technologies.

Example:

React

STEP 2
Select Skill(s) dynamically.

Example:

React Hooks

STEP 3
Select difficulty:

Very Easy
Easy
Medium
Hard
Very Hard

STEP 4
Select question type:

Multiple Choice
Fill Blank
Coding
Open Ended
Debugging

STEP 5
Optionally select:

Tags

STEP 6
Paste/import MANY questions.

Example:

100 questions at once.

STEP 7
Parse and preview them.

DO NOT immediately write them to the database.

Show a validation preview:

Row 1
✓ valid

Row 2
✓ valid

Row 3
✗ missing correct answer

Row 4
✗ invalid question type

etc.

STEP 8

Admin reviews the complete batch.

STEP 9

Admin presses:

IMPORT / PUBLISH

ONLY THEN should the system write the batch to Supabase.

============================================================
14. BULK IMPORT MUST BE ATOMIC
============================================================

This is critical.

If I import 100 questions and question #73 fails:

DO NOT create questions 1–72 and leave the database half-imported.

Use a transaction/RPC/server-side operation so that:

ALL 100 succeed

OR

NONE are committed.

This prevents partial imports and inconsistent data.

The bulk import operation should create the related records together:

questions
+
question_versions
+
question_skills
+
question_tag_map

as required.

Do not perform 500 independent browser requests.

Do not loop with individual client-side inserts for a large batch.

Use a server-side transactional operation.

============================================================
15. BULK IMPORT FORMAT
============================================================

The admin UI should support a structured import format.

Preferred:

JSON

and optionally CSV for simple question types.

For example:

[
  {
    "slug": "js-async-001",
    "type": "multiple_choice",
    "difficulty": 2,
    "title": "...",
    "description": "...",
    "content": {
      "options": [
        {
          "id": "A",
          "text": "...",
          "is_correct": false
        },
        {
          "id": "B",
          "text": "...",
          "is_correct": true
        },
        {
          "id": "C",
          "text": "...",
          "is_correct": false
        },
        {
          "id": "D",
          "text": "...",
          "is_correct": false
        }
      ]
    }
  }
]

The admin should also be able to download/copy an example template.

============================================================
16. BULK IMPORT DEFAULTS
============================================================

If the admin selects:

Technology = React
Skill = React Hooks
Difficulty = Hard

then all imported questions should inherit those values by default.

However, the import format may optionally override them per question.

Example:

Global defaults:

technology = React
skill = React Hooks
difficulty = 4

Then individual records can override:

difficulty = 5

if the admin intentionally wants that.

The UI must clearly show inherited vs overridden values.

============================================================
17. VALIDATION BEFORE DATABASE WRITE
============================================================

Before importing anything, validate:

- slug
- type
- difficulty
- title
- content
- required fields
- correct answer
- skill IDs
- technology relationship
- tag IDs
- duplicate slugs
- duplicate questions where detectable
- malformed JSON
- invalid coding test cases
- invalid language
- missing required version data

Also validate:

skill belongs to selected technology.

Never allow:

React technology
+
JavaScript-only skill

unless explicitly supported by the database relationship.

============================================================
18. DATABASE-DRIVEN SELECTORS
============================================================

Every selector must query the database.

Examples:

Technology dropdown:

SELECT active technologies

Skill dropdown:

SELECT active skills
WHERE technology_id = selectedTechnology

Tags:

SELECT question_tags

Templates:

SELECT question_templates

Never hardcode the IDs.

If tomorrow I add:

Vue.js

to technologies,

the admin dashboard must automatically show Vue.js.

If tomorrow I add:

Vue Composition API

as a skill,

the dashboard must automatically show it under Vue.js.

The UI must not require a code deployment just because a new technology or skill was added.

============================================================
19. ADMIN TECHNOLOGY + SKILL MANAGEMENT
============================================================

The admin dashboard must include:

CONTENT MANAGEMENT

    Technologies
    Skills
    Tags
    Question Templates

QUESTION MANAGEMENT

    Questions
    Create Question
    Edit Question
    Bulk Import
    Question Versions
    Question Preview

ASSESSMENT MANAGEMENT

    Exams
    Exam Questions
    Exam Sessions
    Evaluations

USER MANAGEMENT

    Users
    Profiles
    Roles
    Permissions

============================================================
20. USER MANAGEMENT
============================================================

The admin must be able to:

- search users
- filter by role
- filter by status
- view profile
- view account information
- view activity where available
- block/deactivate user
- reactivate user
- manage appropriate roles/permissions

Current public.users includes:

id
auth_user_id
username
phone
role
status
created_at
updated_at

Do NOT create a second user table.

The application-level user is:

public.users

Supabase authentication identity is:

auth.users

Keep these concepts separate.

============================================================
21. BLOCKING USERS
============================================================

Do not invent a random status system.

Use the existing:

public.users.status

and the existing authentication architecture.

Before implementing "block user", inspect the current allowed status values and existing RLS/auth logic.

Blocking must be enforced server-side.

A UI-only disabled button is NOT security.

The backend/RLS/authentication layer must prevent blocked users from performing protected actions.

If Supabase Auth user disabling is required, implement it through a secure server-side/admin operation, never expose service-role credentials to the browser.

============================================================
22. RBAC / ADMIN SECURITY
============================================================

The database already has:

roles
permissions
role_permissions
user_roles

Therefore the admin dashboard MUST use the existing RBAC architecture.

Do not simply check:

if (user.email === "omid@example.com")

Do not hardcode admin user IDs.

Use roles/permissions.

Every sensitive admin mutation must be protected server-side.

Examples:

create question
edit question
delete/archive question
bulk import
create technology
create skill
manage users
block user
change roles
manage exams

All require appropriate permissions.

============================================================
23. QUESTION DELETION
============================================================

Do NOT casually hard-delete questions.

Questions may eventually be referenced by:

exam_questions
answers
evaluations
skill scores
historical assessment results

Therefore prefer:

draft
published
archived

or the existing status model.

Historical assessment data must remain valid.

Deleting a question must not destroy historical evaluation integrity.

============================================================
24. EXAM MANAGEMENT
============================================================

Existing:

public.exams

Fields include:

id
track_id
slug
title
description
engine_version
duration_minutes
status
created_at
updated_at

Existing:

public.exam_questions

contains:

exam_id
question_id
question_order
weight

Admin UI must therefore provide:

Create Exam
Edit Exam
Select Track
Add Questions
Reorder Questions
Set Question Weight
Set Duration
Set Status
Preview Exam

Question selection must come from the actual database.

Do not duplicate questions inside the exam.

============================================================
25. TRACKS
============================================================

Existing:

public.tracks

and:

public.track_technologies

A Track can contain multiple technologies.

track_technologies includes:

track_id
technology_id
priority
weight

Therefore when building exam/content selectors:

Track
    ↓
Track Technologies
    ↓
Questions/Skills

should be respected where applicable.

Do not treat Technology as the same thing as Track.

============================================================
26. EVALUATION SYSTEM
============================================================

Existing evaluation infrastructure includes:

evaluation_rules
rule_versions
engine_versions
evaluations
skill_scores
answer_evaluations

The admin dashboard should eventually provide an Evaluation Management section.

Do not hardcode evaluation rules into UI components.

The database already supports:

rule
→ version
→ conditions
→ actions

This should remain data-driven.

============================================================
27. UX REQUIREMENTS
============================================================

This is an ADMIN/OPERATIONS dashboard.

It must feel like a professional content-management system, not a simple CRUD page.

Use:

- sidebar navigation
- searchable tables
- filters
- pagination
- bulk selection
- bulk actions
- confirmation dialogs
- validation
- toast notifications
- loading states
- empty states
- error states
- optimistic UI only where safe
- undo where safe
- detailed previews
- keyboard-friendly workflows

Question creation should be a multi-step workflow.

Example:

STEP 1
Content Classification

Technology
Skill
Difficulty
Type
Tags

STEP 2
Question Content

Title
Description
Question body

STEP 3
Type-specific Content

Multiple Choice / Coding / Debugging / etc.

STEP 4
Validation

Show every validation result.

STEP 5
Preview

Show exactly what the user will see.

STEP 6
Save as Draft / Publish

============================================================
28. QUESTION LIST PAGE
============================================================

Provide:

Search
Filter by Technology
Filter by Skill
Filter by Difficulty
Filter by Type
Filter by Status
Filter by Tag

Columns:

Question
Technology
Skill
Type
Difficulty
Status
Version
Updated
Actions

Actions:

View
Edit
Duplicate
Archive
Version History

Bulk actions:

Archive
Change difficulty
Change status
Assign tags
Export
etc.

Only implement bulk mutations that are safe for the existing schema.

============================================================
29. DUPLICATE QUESTION
============================================================

Provide a "Duplicate" action.

Duplicating a question must create a new question identity.

Do NOT reuse the same question ID.

The new question must receive its own:

questions row
question_versions row
question_skills mappings
tag mappings where appropriate

Generate/validate a unique slug.

============================================================
30. NEVER BREAK REFERENTIAL INTEGRITY
============================================================

Before any mutation involving:

technology
skill
question
exam
user

check the foreign-key relationships.

Do not:

- change IDs manually
- copy IDs from another environment
- hardcode database IDs
- delete referenced records
- bypass constraints
- silently change foreign keys

Use the actual IDs returned by Supabase.

============================================================
31. GENERATED DATABASE TYPES
============================================================

The project has:

database.types.ts

Supabase CLI is installed.

Before implementing this dashboard:

1. Delete the existing generated database.types.ts.
2. Regenerate it from the CURRENT linked Supabase project:

supabase gen types typescript --linked > database.types.ts

3. Read the ENTIRE generated file.
4. Use it as the TypeScript contract.
5. Do not manually edit generated database.types.ts.

If the CLI is not linked correctly, inspect the current project configuration first.

============================================================
32. DATA ACCESS ARCHITECTURE
============================================================

Do not put service-role credentials in the browser.

Browser:
    ↓
authenticated application/server layer
    ↓
Supabase
    ↓
PostgreSQL

For sensitive admin mutations:

Use a secure server-side path.

Bulk import MUST execute transactionally.

If an RPC/function is needed for atomic operations, create it deliberately and protect it with appropriate permissions.

Do not expose arbitrary SQL execution to the admin frontend.

============================================================
33. FUTURE-PROOF REQUIREMENT
============================================================

This dashboard must survive database growth.

For example, if later we add:

Vue.js
Angular
Svelte
Node.js
Python
Django
NestJS
Laravel
etc.

the dashboard should not need a new frontend release just to display them.

Same for:

new skills
new tags
new templates
new question types where the schema supports them

The UI must be driven by database metadata wherever possible.

============================================================
34. IMPORTANT: DO NOT OVER-ENGINEER THE DATABASE
============================================================

Do NOT create new tables merely because a frontend form is easier with them.

Current schema already has:

technologies
skills
questions
question_versions
question_skills
question_tags
question_tag_map
question_templates
exams
exam_questions
exam_sessions
answers
answer_evaluations
evaluations
skill_scores
evaluation_rules
rule_versions
engine_versions
tracks
track_technologies

Use these first.

Only propose a schema change if the current database genuinely cannot represent a required feature.

If a schema change is necessary:

STOP.

Explain:

1. Why it is necessary
2. Which existing table is insufficient
3. What migration would be added
4. What historical data impact exists
5. Why the change is safe

Do not silently modify production schema.

============================================================
35. FIRST TASK BEFORE CODING
============================================================

Before writing the dashboard:

A) Regenerate database.types.ts from the linked Supabase project.

B) Read the entire generated file.

C) Inspect the existing admin/RBAC implementation.

D) Inspect existing RLS policies for all tables that the admin dashboard will mutate.

E) Inspect existing migrations before creating new migrations.

F) Map every dashboard operation to its exact database table(s).

Create an internal map such as:

Create Question:
questions
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
→ exam_questions

Bulk Import:
transaction
→ questions
→ question_versions
→ question_skills
→ question_tag_map

User Block:
users
+ required auth/RLS enforcement

============================================================
36. FINAL GOAL
============================================================

Build a professional Trawin Admin Dashboard where I can manage the entire assessment content system without touching SQL manually.

I should be able to:

1. Add technologies.
2. Add skills under technologies.
3. Add tags.
4. Create questions.
5. Select technology dynamically.
6. Select only relevant skills dynamically.
7. Select difficulty 1–5.
8. Select question type.
9. Get a different editor depending on question type.
10. Create multiple-choice questions.
11. Create coding questions.
12. Create debugging questions.
13. Create open-ended questions.
14. Create fill-in-the-blank questions.
15. Manage question versions.
16. Assign multiple skills with weights.
17. Assign tags.
18. Save drafts.
19. Publish/archive questions.
20. Bulk import 100+ questions.
21. Validate the complete batch before writing.
22. Import the entire batch atomically.
23. Create/manage exams.
24. Add/reorder questions inside exams.
25. Manage users.
26. Block/reactivate users securely.
27. Manage roles/permissions according to existing RBAC.
28. View assessment/evaluation information.
29. Never break existing foreign-key relationships.
30. Never depend on hardcoded technology/skill IDs.

MOST IMPORTANT:

The current Supabase schema is the contract.

Build the admin dashboard around the database that actually exists.

Do not redesign the database from the frontend.

Do not guess.

Inspect first.
Then implement.
Then verify every mutation against the actual database.
















this is title not important :




چرا این طراحی را انتخاب کردم؟
چند تصمیم اینجا عمداً سخت‌گیرانه است:
۱. تکنولوژی نباید داخل کد Frontend هاردکد شود.
مثلاً React الان ID=6 است، ولی اگر فردا Vue اضافه کنیم نباید کد را تغییر بدهیم. Dropdown باید از technologies بخواند.
۲. Skill باید وابسته به Technology باشد.
اگر React انتخاب شد، فقط Skillهای React نمایش داده شوند. این دقیقاً با skills.technology_id فعلی شما سازگار است.
۳. سؤال یک موجودیت ثابت و Content آن Versioned است.
questions هویت سؤال است و question_versions محتوای آن. این برای آینده‌ی Trawin مهم است.
۴. Bulk Import باید Transactional باشد.
این مهم‌ترین بخش درخواست توست. اگر ۱۰۰ سؤال بفرستی، نمی‌خواهم ۷۴ تا وارد شوند و شماره ۷۵ خراب شود و ۲۶ تای بعدی وارد نشوند. باید همه یا هیچ‌کدام commit شوند.
۵. چهارگزینه‌ای را به جدول جدید نبردم.
چون الان چنین جدولی در دیتابیس ندارید؛ question_versions.content از نوع JSONB است و Template مخصوص multiple_choice دارید. بنابراین داشبورد باید فعلاً با همین قرارداد کار کند، نه اینکه خودش question_options اختراع کند.
۶. حذف سؤال را عمداً محدود کردم.
چون سؤال ممکن است بعداً در exam_questions، answers و نتایج ارزیابی تاریخی استفاده شده باشد. حذف فیزیکی می‌تواند تاریخچه را خراب کند. draft/published/archived برای این معماری امن‌تر است.
۷. مدیریت User را هم به همان RBAC فعلی وصل کردم.
در دیتابیس شما roles، permissions، role_permissions و user_roles وجود دارند؛ بنابراین AI نباید برای Admin یک سیستم دسترسی موازی بسازد.
یک نکته‌ای که حین بررسی دوباره پیدا کردم
در schema فعلی، question_templates.schema الان {} است و question_tags و skill_levels در حال حاضر داده‌ی Seedشده ندارند. همچنین خود معماری question_templates وجود دارد، ولی قرارداد دقیق JSON برای Multiple Choice هنوز در دیتابیس به‌صورت schema تعریف نشده.
بنابراین من در prompt بالا عمداً AI را مجبور کردم قبل از ساخت UI این قرارداد را از روی کد/مهاجرت‌های موجود بررسی کند و خودش یک JSON قراردادی را مخفیانه به دیتابیس تحمیل نکند.
این تصمیم مهم است؛ چون اگر الان بدون قرارداد مشخص، فرم ۴گزینه‌ای بسازیم و بعداً موتور Evaluation فرمت دیگری انتظار داشته باشد، داشبورد و Evaluation Engine از هم جدا می‌شوند.
پس ترتیب درست کار:
Live Supabase Schema
        ↓
Generated database.types.ts
        ↓
Existing migrations / RLS / RBAC
        ↓
Question JSON contracts
        ↓
Admin Dashboard
        ↓
Transactional Bulk Import
        ↓
Verification
این ترتیب برای Trawin خیلی امن‌تر از این است که اول ظاهر داشبورد را بسازیم و بعد سعی کنیم دیتابیس را با آن هماهنگ کنیم.