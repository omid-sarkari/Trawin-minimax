# 🧠 mythink1.md — تراوین چیست و کارش چیست؟ (نسخه کامل، مبتنی بر اسکیمای ۱۰۰٪ دیتابیس + Master Context)

> این سند حاصل **تلاقی دو منبع** است:
> ۱. اسکیمای کامل زنده‌ی Supabase که ستون‌به‌ستون خواندم: **۶۵ جدول، ۷۳ کلید خارجی، همه CHECK/UNIQUE ها، ۶۰ پالیسی RLS روی ۵۸ جدول، ۶ تابع، ۳ باکت Storage**
> ۲. سند `TRAWIN_MASTER_CONTEXT.md` (هر ۵ بخش، خط به خط)
>
> تاریخ تهیه: ۱۴۰۴/۰۶/۰۴ (۲۰۲۶-۰۸-۲۶)

---

## بخش اول — تراوین چیست؟

### تعریف رسمی (از Master Context §1)
> «Trawin یک پلتفرم هوشمند ارزیابی، آموزش و استخدام برنامه‌نویسان است. هدف اصلی این نیست که فقط یک سایت آزمون باشد؛ هدف ساخت یک سیستم **اثبات مهارت واقعی** بر اساس عملکرد واقعی، رفتار کدنویسی، حل مسئله و نتایج قابل اعتماد است.»

### ترجمه‌ی من از روی دیتابیس واقعی
تراوین می‌خواهد همان کاری را برای مهارت برنامه‌نویسی بکند که اعتبارسنجی هویت برای امنیت کرد: **جای ادعا را مدرک بگیرد.** چار مشکل دنیای سنتی که Master Context نام می‌برد — رزومه قابل جعل، مدرک ≠ مهارت، پروژه‌های مبهم، مصاحبه‌ی اشتباه‌گیر — دقیقاً با چهار سازوکار دیتابیس پاسخ داده شده:

| مشکل سنتی | پاسخ تراوین در دیتابیس |
|---|---|
| رزومه قابل جعل | `evaluations` + `skill_scores` فقط از مسیر موتور ارزیابی تولید می‌شوند؛ رزومه DERIVED است نه دست‌نویس |
| مدرک تضمین نیست | `skill_verification policy` در `rule_versions`: تأیید فقط بعد از ≥۲۰۰ سؤال نمره‌داده + ≥۵ آزمون کامل + ≥۳ پروژه |
| پروژه نشان‌دهنده سطح نیست | رفتار کدنویسی ثبت می‌شود: `coding_sessions` × ۶ جدول تله‌متری |
| مصاحبه کوتاه خطا دارد | `interviews` (LiveKit) + `proctoring_sessions` روی بستر شواهد قبلی |

### جایگاه رقابتی (Vision §2)
```
LinkedIn  = معرفی حرفه‌ای        ← قابل جعل
GitHub    = سابقه کد             ← بدون سنجش
LeetCode  = تمرین الگوریتم       ← بدون زمینه واقعی
─────────────────────────────────────
Trawin    = اثبات واقعی توانایی توسعه نرم‌افزار   ← لایه Trust
```
و جمله کلیدی Master Context §69 که کل استراتژی را خلاصه می‌کند:
> «مزیت اصلی تراوین یک آزمون نیست؛ یک **موتور Trust** است. داده‌هایی که به مرور جمع می‌شوند — عملکرد واقعی، رفتار توسعه، مسیر رشد — دارایی اصلی پروژه خواهند بود.»

---

## بخش دوم — کار تراوین چیست؟ (جریان کامل محصول)

### جریان کلان
```
ثبت‌نام (developer/company/admin)
   ↓
آنبردینگ ۵ مرحله‌ای (هدف + تکنولوژی از DB + نقش هدف + تجربه خوداظهاری + ترجیح کاری)
   ↓
پروفایل حرفه‌ای (username یکتا CI، آواتار، headline، bio)
   ↓
آزمون: انتخاب سؤال سرورمحور → اجرا → Judge0 (فقط کد) → ارزیابی نسخه‌دار
   ↓
موتور تصمیم: چه چیزی «تأیید» لقب بگیرد؟ (evaluation_rules/rule_versions)
   ↓
رزومه زنده (DERIVED): مهارت تأییدشده + شواهد عددی + completeness
   ↓
نمای دولوپر (همه‌چیز) / نمای شرکت (فقط مجازها — سرور فیلتر می‌کند)
   ↓
استخدام: jobs → applications → interviews → تصمیم
```

### حالا همین جریان را با جدول‌های واقعی، دامنه به دامنه:

---

## بخش سوم — هفت دامنه‌ی دیتابیس و نقششان در «کارِ» تراوین

### دامنه ۱: هویت (Identity) — «تو دقیقاً کی هستی؟**
```
auth.users ──(trigger handle_new_user)──► users ──1:1──► profiles
roles ◄──user_roles──► users          permissions ◄──role_permissions──► roles
```
- `users`: username (UNIQUE + ایندکس lower() یعنی case-insensitive)، role با CHECK سه‌گانه (developer/company/admin)، status چهارحالته
- `profiles` (۱۷ ستون!): از full_name تا onboarding_data JSONB — پروفایل هم خوداظهاری است هم وضعیت آنبردینگ را نگه می‌دارد
- نکته معماری حیاتی: **شناسه کانونیکال اپ = `users.id`** (نه auth.uid!) و RPC `get_my_user_id()` پل آن است. استثنای عمدی: `question_selection_events` و `user_skill_states` به auth.users وصل‌اند.
- RBAC واقعی: ۹ permission در جدول، نگاشت role↔permission، تابع `has_permission()` — یعنی «ادمین» فقط یک role در DB است نه یک if در کد.

### دامنه ۲: دانش آزمون (Question Domain) — «چه چیزی را می‌سنجه‌ایم؟»
```
tracks ──track_technologies──► technologies ──► skills ──skill_relations──► skills
                                     │              │
questions ──► question_versions      │              └──► skill_levels
     │  │  │                         └── (هر مهارت متعلق به یک technology است)
     │  │  └─ question_tag_map ──► question_tags
     │  └─ question_skills (وزن!) ──► skills
     └─ question_templates (schema per نوع)
```
- **Skill Graph** که Master Context §25 آرزو کرده بود، در DB واقعاً وجود دارد: `skills.parent_id` (خودارجاع) + `skill_relations` (parent/child با relation_type) + `skill_levels` (rank یکتا). هنوز data ندارد ولی ساختار آماده است — یعنی هدف «React: Components 95% / State 82% / ...» قابل پیاده‌سازی بدون migration.
- `question_versions` با UNIQUE(question_id, version): سؤال موجود زنده است — هیچ نتیجه تاریخی نباید با ویرایش سؤال خراب شود (Master Context §42: «هر چیزی که روی نتیجه اثر دارد باید Version داشته باشد»). ما این را با `answers.question_version_id` قفل کردیم.
- `question_templates.schema` JSONB: الگوهای ساخت سؤال per نوع.

### دامنه ۳: اجرای آزمون (Runtime) — «چطور منصفانه می‌سنجیم؟»
```
exams (CHECK: draft/published/archived/closed) ──exam_questions(order+weight)
exam_selection_configs (fixed|adaptive, UNIQUE exam)
exam_sessions (CHECK: started/submitted/evaluating/completed/cancelled)
   ├─► question_selection_events (تصمیم انتخاب سؤال + pin نسخه)
   ├─► answers (UNIQUE(session,question)! + question_version_id + time_spent_seconds)
   └─► evaluations (overall_score + level CHECK junior/mid/senior/expert + confidence + engine_version_id!)
           └─► skill_scores (UNIQUE(evaluation,skill))
user_skill_states (rating/uncertainty/confidence/attempts/correct/incorrect/current_level_id)
```
- **تایمر، انتخاب سؤال، نمره — همه سرورمحور.** CHECK constraint حتی اجازه حالت `expired` نمی‌دهد؛ انقضا lazy از همان مسیر finalize انجام می‌شود.
- `user_skill_states` دقیقاً مدل Elo طولی است (rating پیش‌فرض ۱۰۰۰، uncertainty ۳۵۰) — همان «مسیر رشد» Master Context §26 (Growth Timeline).
- `engine_version_id` روی evaluations: قانون §13 («الگوریتم بهتر شد ولی نتایج قدیمی نباید خراب شوند») در دیتابیس الزامی شده.

### دامنه ۴: کدنویسی و رفتار (Coding & Behavior) — «چطور کد می‌زند؟»
```
code_submissions (status CHECK: pending…plagiarized + source_code_hash!)
   ├─► execution_results (CHECK: queued/running/accepted/wrong_answer/time_limit…)
   └─► code_similarity_reports (JPlag: similarity_score + compared_submission_id!)

coding_sessions (لینک به exam_session + behavior_state JSONB + behavior_intelligence_version)
   ├─ editor_events      (event_type + payload)
   ├─ coding_events      (event_type + source)
   ├─ coding_snapshots   (snapshot_kind + source_hash/base_hash → دیف کد!)
   ├─ clipboard_markers  (marker_type + marker_hash + is_internal)
   ├─ code_metrics       (metric_type + metric_value)
   └─ ai_detection_results (detection_type + probability + result)
```
این دامنه **قلب تمایز تراوین** است. Master Context §19 می‌گوید «AI دشمن نیست؛ هدف شفافیت است: Human Written / AI Assisted / Fully Generated». دیتابیس دقیقاً برای همین ساخته شده:
- `clipboard_markers.marker_hash` → تشخیص paste تکراری از منابع بیرونی
- `code_metrics` → هر متریک عددی (تعداد run، فاصله paste تا run، حجم تغییرات)
- `ai_detection_results.probability` → نسبت کد AI به تفکیک نوع
- `coding_snapshots.source_hash` → توالی تکامل کد (فکر کردن تدریجی یا ریختن یکجا)
و `is_internal` روی clipboard_markers یعنی طراحی از روز اول بین سیگنال داخلی و عمومی تفکیک قائل شده (§36 privacy).

### دامنه ۵: موتور تصمیم (Intelligence Engine) — «چه چیزی حق ورود به رزومه را دارد؟»
```
engine_versions (UNIQUE version; الان v1.0.0 فعال)
evaluation_rules (UNIQUE name; active)
   └─ rule_versions (UNIQUE rule+version; conditions JSONB + actions JSONB)
```
این همان «AI ای» است که مدیر می‌گوید LLM نیست بلکه الگوریتم مغز پلتفرم است. Master Context §13: «Evaluation Engine نباید hard-code شود؛ Question → Evaluation Rule → Evaluation Engine → Result، و Versioned.» الان اولین قانون واقعی زندگی می‌کند: **skill_verification** — و هر تغییر ادمین نسخه جدید می‌سازد، پس هر نتیجه تاریخی قابل توضیح می‌ماند («این مهارت طبق سیاست v2 تأیید شده»).

### دامنه ۶: رزومه زنده (Resume Intelligence) — «خروجی نهایی برای دنیا»
```
resumes ──resume_versions (snapshot JSONB)──┐
developer_resume_sections (project/experience/education/achievement/
                            competition/certification/link/custom;
                            is_visible; managed_by developer|admin)
plans ──user_plans (free|pro, ends_at → انقضای خودکار)
resume_visibility_rules (۱۹ قانون developer/company/pro — UNIQUE(view,section))
```
- Master Context §26 می‌خواست: Verified Skills + Evidence + Growth Timeline. الان در سرویس رزومه: هر مهارت با `evidence{gradedQuestions, correctRate, completedExams, projects}` نمایش داده می‌شود.
- نمای شرکت با CSS مخفی نمی‌شود — `resume_visibility_rules` سمت سرور فیلتر می‌کند و سیگنال‌های رفتاری (`behavior_signals`, `private_analytics`) با PRIVACY_FLOOR همیشه بسته‌اند (§33 Data Privacy: حداقل ذخیره‌سازی، دسترسی محدود).

### دامنه ۷: استخدام (Hiring Platform) — «پول از کجا می‌آید؟»
```
companies ──company_members (owner/admin/recruiter/member CHECK)──► users
jobs (open/paused/closed) ──► applications (submitted/reviewing/shortlisted/
                               rejected/accepted/withdrawn; UNIQUE(job,user))
interviews (scheduled/completed/cancelled/no_show/rescheduled + provider + room_id)
```
- جریان §28 (Company → Job Requirement → Select Skills → Find Developers → Assessment → Interview → Hiring Decision) **تمام جداولش موجود و CHECKدار است** — حتی `applications.resume_id` یعنی درخواست استخدام مستقیماً به یک snapshot رزومه وصل می‌شود (نسخه لحظه‌ی درخواست!). این یعنی شرکت دقیقاً همان چیزی را می‌بیند که موقع apply بوده — عالی برای مناقشه‌ناپذیری.
- `processing_jobs` (job_type/status/progress) زیرساخت صف کارهای سنگین است که Master Context §48-49 می‌خواست (تحلیل رفتار، Trust Score، گزارش‌ها).

---

## بخش چهارم — تحلیل ترکیبی: وعده‌ها vs واقعیت دیتابیس

| Master Context می‌گوید | دیتابیس چه دارد | وضعیت |
|---|---|---|
| Skill Graph (§25) | skills.parent_id + skill_relations + skill_levels | ✅ ساختار آماده، داده خالی |
| Versioned Evaluation (§13) | engine_versions + rule_versions + evaluations.engine_version_id | ✅ فعال (v1.0.0 + skill_verification v1) |
| AI Transparency (§19) | ai_detection_results(detection_type,probability) | ✅ جدول آماده، موتور تشخیص = کار آینده |
| Anti-Cheat سه‌لایه (§20) | code_similarity_reports + تله‌متری + proctoring_* | ✅ جداول کامل، پردازش‌گرها آینده |
| Trust Score (§22-23) | evaluations.confidence + user_skill_states(rating,uncertainty) | ✅ اجزا موجود؛ ترکیب نهایی = کار موتور |
| Resume Intelligence (§26) | resume_versions + developer_resume_sections + visibility_rules | ✅ فعال (DERIVED) |
| Hiring Workflow (§28) | companies/jobs/applications/interviews با CHECK های کامل | ✅ اسکلت آماده، UI شرکت = آینده |
| Queue/Workers (§48) | processing_jobs(status/progress/result) | ⏳ جدول هست، worker نیست |
| ذخیره‌سازی حداقلی (§9) | snapshots با hash، events با metadata — نه raw keystroke بی‌نهایت | ✅ رعایت طراحی شده |

## بخش پنجم — جمع‌بندی یک‌پاراگرافی

**تراوین یک «موتور اعتماد» برای بازار کار برنامه‌نویسی است:** دولوپر وارد می‌شود، هدفش را اعلام می‌کند، در آزمون‌های ترکیبی (مفهومی + کدنویسی واقعی روی Judge0) سنجیده می‌شود؛ حین کدنویسی، رفتارش (paste، سرعت اجرا بعد از paste، نسبت کد AI، توالی snapshot ها) به‌عنوان شواهد ثانویه ضبط می‌شود؛ سپس **موتور تصمیم نسخه‌دار** (evaluation_rules) تعیین می‌کند کدام مهارت‌ها با کدام سطح اطمینان «تأییدشده» لقب بگیرند؛ خروجی، یک رزومه زنده است که از داده کانونیکال مشتق می‌شود (هرگز کپی دستی نیست)، نمای آن برای خودِ دولوپر و شرکت کاملاً متفاوت و سمت‌سرور کنترل می‌شود، و در نهایت همان رزومه به‌عنوان سند استخدام (applications.resume_id) به جریان hiring (job→apply→interview→decision) وصل می‌شود. **درآمد** از پلن Pro (قابلیت‌های تحلیلی پیشرفته) و طرف شرکت (جستجوی نامزدِ تأییدشده + آزمون اختصاصی + مصاحبه LiveKit) است؛ و **دارایی بلندمدت**، همان انبوه شواهد است که هیچ رقیبی با یک ویژگی نمی‌تواند کپی کند — چون ارزش در گذر زمان جمع می‌شود.

## قراردادهای طلایی (که Master Context و دیتابیس هر دو دیکته می‌کنند)

1. `users.id` شناسه کانونیکال است؛ auth.uid فقط پل (با دو استثنای عمدی selection_events/user_skill_states)
2. منطق کسب‌وکار هرگز در کامپوننت (Rule 1)؛ همه نوشتن‌ها از API Route با service-role
3. هر تغییر schema = Migration (Rule 2)؛ هر چیزی که روی نتیجه اثر دارد = Version (§42)
4. Core اختصاصی (Trust/Evaluation/SkillGraph/Resume)، زیرساخت OpenSource (Judge0/JPlag/Monaco/Yjs/LiveKit/OpenProctor) (§31)
5. ذخیره‌سازی حداقلی: Metrics و رویدادهای مهم، نه raw بی‌نهایت (§9)
6. AI شفاف است نه ممنوع؛ سیگنال رفتاری داخلی هرگز مستقیم به شرکت نمی‌رسد (§19 + §36)
7. Scale مرحله‌ای: MVP (Next.js+Supabase) → Growth (Redis/Queue) → Large (Microservices) (§46) — الان دقیقاً در انتهای Stage 1 هستیم

---
*تهیه‌شده توسط دستیار توسعه پس از مطالعه کامل اسکیمای زنده (information_schema + pg_constraint + pg_policies + pg_proc) و TRAWIN_MASTER_CONTEXT.md*
