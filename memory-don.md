# Trawin Project Memory Log (memory-don.md)

## 📅 تاریخچه اقدامات پروژه Trawin
**مدیر پروژه:** امید سرکاری  
**دستیار هوشمند:** Qwen3.7  
**وضعیت فعلی:** پایان زیرساختی Phase 1 (Authentication & Identity) | شروع Phase 2

---

### ✅ مرحله ۱: اتصال و تحلیل اولیه
- **اتصال به Supabase:** با استفاده از کلیدهای ارائه شده، اتصال به دیتابیس `rnckgzjcmoipuviqoquj` برقرار شد.
- **تحلیل دیتابیس:** شناسایی ۶۳ جدول موجود در اسکیمای عمومی که نشان‌دهنده پیشرفت قابل توجه در بخش‌های Assessment، Coding و Hiring است.
- **شناسایی شکاف‌ها:** جداول `users` و `profiles` خالی بودند و سرویس احراز هویت (Auth Service) پیاده‌سازی نشده بود.

### ✅ مرحله ۲: تکمیل زیرساخت Phase 1 (Authentication & Identity)
طبق سند Master Context، اقدامات زیر برای تکمیل فاز اول انجام شد:

#### ۱. دیتابیس (Database Migration)
- **فایل ایجاد شده:** `supabase/migrations/20260729100000_create_auth_trigger.sql`
- **هدف:** ایجاد Trigger خودکار برای ساخت پروفایل کاربر بلافاصله پس از ثبت‌نام در `auth.users`.
- **جزئیات:** تخصیص نقش پیش‌فرض `developer` به کاربران جدید.

#### ۲. لایه سرویس (Service Layer)
- **فایل ایجاد شده:** `src/services/auth.service.ts`
- **هدف:** جداسازی منطق بیزینس از کامپوننت‌های UI (طبق Rule 1).
- **قابلیت‌ها:** مدیریت SignUp, SignIn, SignOut با استفاده از Supabase Client.

#### ۳. رابط کاربری (UI Implementation)
- **فایل‌های ایجاد شده:**
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/register/page.tsx`
- **ویژگی‌ها:** طراحی کاملاً RTL، واکنش‌گرا (Responsive) و متصل به Auth Service.

#### ۴. امنیت و Middleware
- **فایل ایجاد شده:** `middleware.ts`
- **هدف:** محافظت از روت‌های خصوصی (مثل داشبورد) و مدیریت Session کاربران.
- **عملکرد:** بررسی توکن JWT و هدایت کاربران لاگین‌نکرده به صفحه ورود.

---

### 🚀 مرحله ۳: شروع Phase 2 (Assessment MVP)
- **وضعیت:** در حال طراحی و اجرای Migration برای موتور ارزیابی.
- **اقدام بعدی:** بررسی اسکیمای فعلی جداول `exams`, `questions`, `attempts` و تکمیل ساختار آن‌ها مطابق با بخش ۲ سند Master Context (Assessment Engine).
- **هدف:** امکان‌پذیر کردن ساخت آزمون، شرکت در آزمون و ذخیره نتایج.

---

### 📌 وضعیت کلی پروژه
- **Phase 0 (Foundation):** تکمیل شده.
- **Phase 1 (Authentication):** از نظر زیرساخت فنی (DB, Service, UI, Middleware) تکمیل شده است.
- **Phase 2 (Assessment MVP):** در حال اجرا (طراحی دیتابیس).
- **مرحله بعدی:** پیاده‌سازی Service Layer و UI برای آزمون‌ها پس از تکمیل Migration.

---
*این فایل به صورت زنده آپدیت می‌شود تا حافظه اجرایی پروژه حفظ گردد.*
*آخرین بروزرسانی: ۲۰۲۶-۰۷-۳۰*


---

### ✅ مرحله ۳: شروع Phase 2 (Assessment MVP) - تحلیل و طراحی
- **تحلیل دیتابیس فعلی:** بررسی جداول موجود (`exams`, `questions`) نشان داد که زیرساخت پایه وجود دارد اما نیاز به تکمیل ارتباطات و فیلدهای متادیتا دارد.
- **طراحی Migration جدید:** طراحی اسکریپت برای اضافه کردن جداول `assessment_questions`, `attempts`, `answers` و فیلدهای ضروری مثل `difficulty_level`, `skill_mapping`.
- **هدف:** آماده‌سازی موتور ارزیابی برای اولین آزمون واقعی.
- **وضعیت:** تحلیل انجام شد، اجرای Migration در مرحله بعد.

---

### ✅ مرحله ۴: تثبیت موتور Behavior Intelligence + سیستم Resume واقعی
- **رفع باگ اصلی BI:** `ProcessingLayer` در `packages/behavior-intelligence/src/brain/index.ts` ورودی خالی (`DetectorInput`) به detector ها می‌فرستاد؛ اصلاح شد تا رویدادهای خام session با رعایت فلگ‌های کانفیگ پاس داده شوند.
- **Adapter واقعی:** `src/lib/behavior-intelligence-adapter/nextjs.adapter.ts` اینترفیس پکیج را implement کرد، از `map-rows.ts` استفاده می‌کند و N+1 لود قوانین حذف شد.
- **روت واقعی:** `POST /api/behavior-analysis` ساخته شد؛ `require` های CommonJS به import تبدیل شدند.
- **Deduplication:** منطق aggregate در یک نقطه متمرکز شد (`engine/aggregate.ts`).
- **Resume واقعی:** `resume-storage.ts` (ذخیره نسخه‌بندی شده در `resumes` + `resume_versions`) و `resume-builder.ts` (تجمیع واقعی از `profiles`, `evaluations`, `skill_scores`, `coding_sessions`, `ai_detection_results`) پیاده شد.
- **پاکسازی:** `src/brain` نسخه مرده حذف شد؛ پکیج BI اکنون build می‌شود؛ تست smoke برای BrainEngine نوشته شد (۲/۲ پاس).

### ✅ مرحله ۵: Auth نقش‌محور + بازطراحی کامل لندینگ (دارک پریمیوم)
**تصمیمات معماری (تأیید امید):**
- تم بصری: دارک پریمیوم (IDE-style) | ثبت‌نام: فرم واحد با انتخاب نقش | ادمین: allowlist ایمیل | Yjs: Supabase Realtime

**فاز ۰ — Auth و روتینگ:**
- **Migration جدید:** `supabase/migrations/20260822120000_auth_trigger_v2_role_users.sql` — trigger v2 نقش انتخابی را از user_metadata می‌خواند، `role_id` پروفایل را درست ست می‌کند و رکورد `public.users` با `status='active'` می‌سازد. ⚠️ باید روی Supabase اجرا شود!
- **AuthService:** `signUp(email, password, fullName, {role, companyName})` + `resolveRole()` (metadata → جدول users → fallback developer) + `resolveDashboardPath()`.
- **ثبت‌نام جدید:** دو کارت انتخاب نقش (برنامه‌نویس/شرکت) + فیلد شرطی نام شرکت + تم دارک.
- **لاگین جدید:** ریدایرکت بر اساس نقش (`developer→/dashboard`, `company→/company`, `admin→/admin`) + Suspense boundary برای useSearchParams.
- **Middleware:** محافظت `/dashboard`, `/company`, `/admin` + گارد allowlist ادمین (`NEXT_PUBLIC_ADMIN_EMAILS`) + هدایت کاربر لاگین‌شده از login/register.
- **همگام‌سازی تایپ‌ها:** ستون‌های `email`, `role_id` به `profiles` در database.ts اضافه شد.

**فاز ۱ — لندینگ دارک پریمیوم (بازسازی کامل):**
- دیزاین سیستم جدید در globals.css: توکن‌های signal/flag تکمیل، انیمیشن‌های CSS خالص (fade-up/caret/glow)، ابزارهای glass-nav/grid-bg/text-gradient.
- صفحه اصلی کاملاً جدید: nav شیشه‌ای ثابت، هیرو با گرادیان، ترمینال ارزیابی انیمیشنی، «سه قدم»، ۶ ویژگی با آیکون SVG داخلی، بخش شرکت‌ها، CTA پایانی، فوتر کامل — بدون هیچ dependency جدید.

**وضعیت build:** `next build` ✅ | `tsc --noEmit` ✅ | تست‌های پکیج ✅

**قدم بعدی (فاز ۲ و ۳):**
1. داشبورد دولوپر `/dashboard` + داشبورد شرکت `/company` (layout مشترک RTL)
2. پنل ادمین `/admin`: CRUD سؤالات + مدیریت کاربران (بلاک/آزادسازی)
3. سپس موتور سؤال تطبیقی (Elo per-skill) و کدنویسی مشارکتی کم‌بار

### ✅ مرحله ۶: همگام‌سازی با دیتابیس زنده (sb.md) + رفع باگ‌های Auth
**طبق سند Sb.md — دیتابیس واقعی منبع حقیقت:**
- **Regenerate تایپ‌ها:** `src/types/database.ts` حذف و با `supabase gen types typescript --linked` (پروژه `rnckgzjcmoipuviqoquj`) بازسازی شد؛ کل فایل خوانده و تحلیل شد.
- **Inspection زنده** (از طریق Management API): کشف شد دو تابع `handle_new_user` وجود دارد (`public` نسخه v2 + `private` قدیمی که به هیچ trigger وصل نبود). trigger فعال فقط نسخه public را اجرا می‌کرد که پروفایل را با `user_id=NULL` می‌ساخت → پروفایل یتیم برای ثبت‌نام‌های جدید!
- **Migration v3:** `20260822130000_auth_trigger_v3_link_profile.sql` نوشته، مستقیم روی دیتابیس زنده اعمال و تعریفش verify شد: اول users (RETURNING id, idempotent) بعد profiles با `user_id` لینک‌شده.
- **معماری تأییدشده:** `users.auth_user_id` یونیک ← پل auth؛ همه جداول اپ FK به `users.id` دارند (شناسه کانونیکال)؛ roles: 1=developer/2=company/3=admin؛ constraints role/status با CHECK.
- **کد:** helper جدید `AuthService.getAppUserId()` بر پایه RPC دیتابیسی `get_my_user_id()` — هر جای اپ که userId لازم است باید از این استفاده شود نه auth.uid.
- **Env:** `NEXT_PUBLIC_ADMIN_EMAILS=rors7371@gmail.com` در `.env.local` و `.env.example`.

**رفع دو باگ قدیمی Auth:**
1. **ایمیل تکراری:** وقتی تأیید ایمیل فعال است Supabase برای ایمیل تکراری «موفقیت» با `identities=[]` برمی‌گرداند؛ حالا در `signUp()` تشخیص داده شده و پیام فارسی مناسب throw می‌شود (+ مپ خطای already registered).
2. **بازیابی رمز عبور:** لینک «رمز عبور را فراموش کرده‌اید؟» در صفحه لاگین + صفحه `/auth/reset-password` (ارسال ایمیل با `resetPasswordForEmail`) + صفحه `/auth/update-password` (تنظیم رمز جدید، مقصد لینک ایمیلی). ⚠️ URL `http://localhost:3000/auth/update-password` باید در Supabase Auth → Redirect URLs اضافه شود.

### ✅ مرحله ۷: یکدست‌سازی مسیرهای Auth + فاز ۲ (داشبوردها)
- **انتقال صفحات بازیابی رمز** به گروه `(auth)`: `/reset-password` و `/update-password` (URL تمیز و هماهنگ با /login و /register)؛ `redirectTo` در AuthService به‌روز شد.
- **DashboardShell مشترک** (`src/components/dashboard/`): sidebar راست‌چین RTL + topbar + ناوبری موبایل + دکمه خروج.
- **`DashboardService`**: `getMyAppUserId()` (RPC)، `getUserRole()` (گارد نقش سمت سرور: developer↔company ریدایرکت متقابل)، `getDeveloperOverview()` (آمار واقعی evaluations).
- **`/dashboard`:** کارت‌های آمار واقعی (تعداد/میانگین/بهترین + آخرین سطح)، CTA «شروع آزمون (به‌زودی)»، لیست فعالیت اخیر با تاریخ شمسی fa-IR، empty-state حرفه‌ای.
- **`/company`:** بن خوشامد با نام شرکت از metadata، سه ماژول placeholder (آگهی‌ها/نامزدها/چالش اختصاصی) با بج «به‌زودی».
- تأیید: tsc ✅ | next build ✅ (همه روت‌ها)

### ✅ مرحله ۸: فاز ۳ — پنل مدیریت کامل (طبق سند Dash.md)
**دیتابیس (اعمال مستقیم + verify زنده):**
- Migration `20260822140000_admin_bulk_import.sql`: ارتقای نقش امید به `admin` در users + تابع `admin_bulk_import_questions(batch jsonb)` (SECURITY DEFINER، تراکنش اتمی همه‌یا‌هیچ) با REVOKE از anon/authenticated و GRANT فقط به service_role.
- **تست واقعی اتمی بودن:** دسته شامل ردیف خراب → reject شد و هیچ ردیف یتیمی نماند ✓؛ دسته سالم → imported:1 ✓؛ داده تست پاک‌سازی شد.

**معماری امنیت:** مرورگر ← API Route (assertAdmin: session + allowlist یا role='admin' سمت سرور) ← service-role client ← دیتابیس. کلید service هرگز به مرورگر نمی‌رود. RLS فعلی فقط SELECT دارد — پس همه نوشتن‌ها از همین مسیر می‌گذرند.

**قرارداد JSON سؤال** متمرکز در `src/lib/admin/question-contracts.ts` (MCQ options داخل question_versions.content با is_correct صریح؛ ۵ نوع؛ سختی ۱-۵ عددی با لیبل فارسی).

**API Routes:** bootstrap | technologies | skills | tags | questions (GET فیلتر+صفحه‌بندی، POST ساخت کامل، PATCH status/duplicate) | questions/bulk (preview→commit اتمی) | users (لیست/فیلتر، مسدودسازی/تغییر نقش با جلوگیری از self-lockout) | exams.

**UI `/admin`:** layout با گارد دوگانه + DashboardShell مشترک؛ نمای کلی با آمار واقعی؛ لیست سؤالات (۶ فیلتر + انتشار/پیش‌نویس/کپی/جزئیات + Pager)؛ ویزارد ۳مرحله‌ای سؤال جدید (طبقه‌بندی cascade تکنولوژی→مهارت با وزن + هشدار نرمال‌سازی، ویرایشگر اختصاصی هر نوع: MCQ گزینه پویا/FillBlank/تشریحی/Coding/Debugging، پیش‌نمایش JSON، ذخیره پیش‌نویس یا انتشار)؛ ایمپورت گروهی (پیش‌فرض‌های ارثی + پیش‌نمایش خطای ردیف‌به‌ردیف + commit اتمی + قالب نمونه قابل کپی)؛ محتوا (تب‌های Tech/Skill/Tag با create و toggle فعال/غیرفعال — soft-disable نه delete)؛ کاربران (جستجو/فیلتر نقش-وضعیت/مسدودسازی/رفع/تغییر نقش)؛ آزمون‌ها (ساخت + لیست؛ افزودن سؤال به آزمون = قدم بعدی).

**تأیید نهایی:** tsc ✅ | next build ✅ همه روت‌های admin | تست RPC اتمی ✅

### ✅ مرحله ۹: رفع باگ UX ویزارد سؤال + هم‌راستایی کامل با قرارداد دیتابیس
- **باگ اصلی:** در مرحله ۲ ویزارد، شکست اعتبارسنجی فقط دکمه را بی‌صدا disable می‌کرد (هیچ پیامی نبود) + خطای bootstrap هم بی‌صدا قورت داده می‌شد.
- **بررسی زنده دیتابیس:** جدول جدا برای انواع سؤال وجود ندارد و این عمدی است (قرارداد Dash.md §10/§34: محتوا در question_versions.content JSONB)؛ اما ستون‌های `language` و `test_cases` برای کدینگ/دیباگ تاکنون پر نمی‌شدند. ۲۸ تگ موجود تأیید شد.
- **بازنویسی ویزارد:** ارورهای زنده زیر فیلدها (چراغ «برای ادامه چه کم دارد») · راهنمای مثال بالای همه ورودی‌ها · پیش‌نمایش زنده جای خالی · ویرایشگر test_cases ساختاریافته → ستون واقعی test_cases · نرمال‌سازی constraints/examples به آرایه در save · حالت loading/error/retry برای bootstrap · بخش تگ‌ها پررنگ با شمارنده انتخاب.

### ✅ مرحله ۱۰: ممیزی کامل طبق p.md — تأیید، اصلاح، مدرنیزه‌سازی
**روش:** هر ادعا اول با کد/دیتابیس/docs رسمی راستی‌آزمایی شد؛ فقط موارد تأییدشده اصلاح شدند.

**تأییدشده و اصلاح‌شده (STILL BROKEN → FIXED):**
1. **MCQ چند پاسخ درست (مسیر تکی):** `validateMcq` فقط `some()` چک می‌کرد؛ حالا `filter(...).length === 1` — قرارداد واحد بین create و bulk.
2. **bulk بدون ولیدیشن نوعی:** ویرایشگر دست‌ساز MCQ حذف شد؛ bulk حالا از همان `validateContentByType` استفاده می‌کند + تشخیص slug تکراری داخل دسته.
3. **مهارت∉تکنولوژی در سرور:** هر دو مسیر POST تکی/bulk حالا `technology_id` می‌گیرند و با یک کوئری (`skills.active ∧ technology_id`) صحت همه مهارت‌ها را verify می‌کنند؛ wizard/bulk-page آن را می‌فرستند.
4. **bootstrap غیرفعال‌ها:** پیش‌فرض فقط فعال؛ `?include_inactive=1` مخصوص صفحه مدیریت محتوا.
5. **«آخرین نسخه» نامطمئن در لیست:** مرتب‌سازی JS بر اساس version نزولی قبل از انتخاب.
6. **duplicate ناامن:** cleanup مانند مسیر create — حذف کپی هنگام شکست.
7. **middleware منسوخ Next 16:** با docs رسمی نصب‌شده تأیید شد → رنیم به `proxy.ts` (export `proxy()`) و `src/lib/supabase/middleware.ts` → `session.ts`؛ تمام ارجاع‌ها جستجو/آپدیت شد (فقط import داخل proxy.ts).
8. **CI روی Node 18:** آپدیت به `'24'` (LTS، تصمیم مدیر) + `engines: ">=20.9"` در package.json.
9. **drift تایپ‌های legacy:** `types/index.ts` (بدون هیچ مصرف‌کننده) با اسکیمای واقعی هم‌راستا شد: QuestionType پنج‌گانه، Difficulty عددی 1-5، Exam/CodingEvent/Profile/Company مطابق generated types.

**تأییدشده و سالم (VALID DESIGN / FALSE POSITIVE):**
- allowlist+role دوگانه = bootstrap عمدی با محافظت self-lockout ✓ | service-role فقط سرور ✓ | Judge0 هنوز integration ندارد (فایل خالی؛ معماری provider برای فاز ۴) ✓ | mapping هویت با get_my_user_id ✓ | TS 6 → DEFERRED FOR COMPATIBILITY | Next/React فعلی stable ✓

**تأیید نهایی:** tsc صفر خطا · next build موفق (کانوینشن proxy فعال) · تست پکیج ۲/۲ · git status دقیقاً فایل‌های مرتبط

### ✅ مرحله ۱۱: Assessment Engine کامل (طبق p1.md) — runtime، Judge0 و UI
**ممیزی قبل از کدنویسی (§1):**
- اسکیمای زنده با Management API استخراج شد: هر ۳ جدول adaptive (`exam_selection_configs`, `question_selection_events`, `user_skill_states`) از قبل موجود بودند (migration زنده `add_adaptive_question_engine_state` که فایل محلی‌اش نیست) → فقط مهاجرت حداقلی لازم داشت.
- **دقت هویتی حیاتی:** `question_selection_events.user_id` و `user_skill_states.user_id` به **auth.users** FK دارند ولی بقیه جداول به `public.users` — سرویس‌ها هر دو id را جدا نگه می‌دارند.
- CHECKهای واقعی: exam_sessions.status = started/submitted/evaluating/completed/cancelled | exams = draft/published/archived/closed | code_submissions شامل plagiarized | evaluations.level = junior/mid/senior/expert.
- داده seed واقعی: ۸۱ سؤال؛ codingها قرارداد قدیمی `{language, question, starter_code, expected_behavior}` بدون test_case → delivery/evaluator هر دو قرارداد را پوشش می‌دهند.

**Migration حداقلی `20260825090000_assessment_runtime_version_pinning.sql`:**
- `answers.question_version_id bigint NULL FK→question_versions` (version pinning §15) + seed `engine_versions('v1.0.0', active)` + ثبت در schema_migrations زنده. تایپ‌ها regenerate شد.

**هسته سرور:**
- `src/lib/assessment/`: errors.ts (تاکسونومی §51 + HTTP map)، types.ts (state machine، Client payloads)، code-execution/provider.ts (مرز Provider + تفکیک USER vs PROVIDER failure §24)، route-helpers.ts.
- `src/lib/services/judge0.ts` (قبلاً خالی): client اختصاصی — X-Auth-Token فقط سرور، resolve زبان داینامیک از /languages خود instance، poll با backoff تا 20s، retry، fail-closed وقتی env نیست (§55). **باگ واقعی توسط تست گرفته شد:** readConfig توکن را نمی‌خواند!
- سرویس‌ها در `src/services/assessment/`: exam-session (conditional UPDATE برای همه transitionها — برنده submit/expiry قطعی)، question-selection (Fixed deterministic + Adaptive MVP easy-first؛ pin نسخه داخل selection_reason JSONB؛ persist قبل از serve §7)، answer (upsert idempotent روی UNIQUE + freeze بعد submit)، code-execution (rate guard 20/min، تست مخفی هرگز به کلاینت نمی‌رود)، evaluation (MCQ/FillBlank نرمال‌سازی فارسی/عربی+ارقام، open_ended=pending_review خارج از نمره، coding از execution_results بدون اجرای مجدد)، skill-scoring (Elo-lite با K×uncertainty، آپدیت افزایشی).
- API: `/api/assessment/exams`، `exams/[examId]/start`، `sessions/[sessionId]`(GET state/result)، `/answers` (PUT upsert)، `/submit`، `questions/[questionId]/code`، `/result`.

**UI:**
- `/dashboard/exams` لیست آزمون‌های published + nav جدید داشبورد + فعال شدن CTA قبلی («به‌زودی» حذف شد).
- Runner در `src/components/assessment/ExamRunner.tsx`: recovery با start idempotent، تایمر نمایشیِ sync با سرور + auto-submit صفر، autosave debounce 700ms، ادیتور کد بدون dependency جدید (line number + Tab)، پنل نتیجه اجرا (تست مخفی بدون input/expected)، صفحه result.
- ادمین (افزودنی، بدون دست‌زدن به فرم موجود): مدیریت سؤالات آزمون (جستجوی published، attach/detach، ترتیب/وزن، حالت انتخاب + سقف تعداد، انتشار/بستن با گارد «حداقل یک سؤال») + routeهای `[examId]` PATCH/questions.

**تست و تحقیق صحت:**
- jest ریشه (`npm test` = runtime + workspaces): ۳۲ تست واحد — state machine، استراتژی‌ها با fake thenable، sanitize (is_correct/hidden strip)، Judge0 با fetch mock (fail-closed، token leak، نگاشت statusها).
- **Live acceptance §54** (`live-acceptance.test.ts`، فقط با SERVICE_KEY اجرا می‌شود و CI skip می‌کند): ساخت آزمون واقعی → session pinned → پاسخ idempotent → refresh recovery → submit → score=100 + level=expert + engine_version_id → double-submit همگرا → version pinning همه پاسخ‌ها ✓. پاکسازی کامل verify شد (صفر رکورد باقی‌مانده).

**تأیید نهایی:** jest 37/37 · tsc صفر خطا · next build ✅ همه روت‌ها · CI (build+test) سازگار

---
*آخرین بروزرسانی: ۲۰۲۶-۰۸-۲۵*
