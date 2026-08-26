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

### ✅ مرحله ۱۱: Assessment Engine کامل (طبق p1.md) — runtime، Judge0 و UI
**ممیزی قبل از کدنویسی:**
- اسکیمای زنده با Management API استخراج شد: جدول‌های adaptive (`exam_selection_configs`, `question_selection_events`, `user_skill_states`) از قبل موجود بودند → فقط مهاجرت حداقلی لازم داشت.
- **دقت هویتی حیاتی:** `question_selection_events.user_id` و `user_skill_states.user_id` به **auth.users** FK دارند ولی بقیه جداول به `public.users` — سرویس‌ها هر دو id را جدا نگه می‌دارند.
- CHECKهای واقعی دیتابیس: exam_sessions.status = started/submitted/evaluating/completed/cancelled | exams = draft/published/archived/closed | evaluations.level = junior/mid/senior/expert.
- داده seed واقعی: ۸۱ سؤال با قرارداد قدیمی (fill_blank از کلید `question` نه `question_with_blank`) → delivery هر دو قرارداد را پوشش می‌دهد.

**Migration زنده `20260825090000_assessment_runtime_version_pinning.sql`:**
- `answers.question_version_id bigint FK→question_versions` (version pinning) + seed `engine_versions('v1.0.0', active)` + ثبت در schema_migrations. تایپ‌ها regenerate شد (۶۱→۶۵ جدول بعداً).

**هسته سرور:**
- `src/lib/assessment/`: errors.ts (تاکسونومی خطا + HTTP map)، types.ts (state machine + Client payloads)، code-execution/provider.ts (مرز Provider + تفکیک USER vs PROVIDER failure)، route-helpers.ts.
- `src/lib/services/judge0.ts`: client اختصاصی — X-Auth-Token فقط سرور، resolve زبان از /languages خود instance، poll با backoff، fail-closed بدون env. **باگ واقعی توسط تست گرفته شد:** readConfig توکن را نمی‌خواند!
- سرویس‌ها در `src/services/assessment/`: exam-session (conditional UPDATE برای همه transitionها)، question-selection (Fixed deterministic + Adaptive MVP؛ pin نسخه داخل selection_reason JSONB)، answer (upsert idempotent روی UNIQUE(session,question))، code-execution (rate guard، تست مخفی هرگز به کلاینت نمی‌رود)، evaluation (نرمال‌سازی فارسی/عربی، open_ended=pending_review خارج از نمره)، skill-scoring (Elo-lite روی user_skill_states).
- API: `/api/assessment/*` — exams list، start، session state، answers upsert، submit، code run، result.

**UI:** `/dashboard/exams` لیست آزمون‌ها + Runner کامل (recovery، تایمر sync با سرور، autosave، auto-submit، ادیتور کد، پنل نتیجه اجرا). ادمین: مدیریت سؤالات آزمون (attach/detach/order/weight/mode/publish).

**تست:** jest ریشه — ۳۲ تست واحد + Live acceptance §54 (ساخت آزمون واقعی → session pinned → پاسخ → submit → score=100 + engine_version_id → double-submit همگرا). پاکسازی کامل verify شد.

### ✅ مرحله ۱۲: Onboarding + Living Resume + Plans + Visibility (طبق p3.md)
**ممیزی:** `ResumeBuilderService`/`ResumeStorageService` قبلاً DEAD CODE بودند (به هیچ روت وصل نبودند)؛ RBAC موجود (permissions + has_permission RPC)؛ users.username با ایندکس UNIQUE موجود ولی case-sensitive.

**Migration زنده `20260826080000_onboarding_resume_plans_visibility.sql` (همه افزودنی):**
1. profiles +۶ ستون: headline, target_role, work_preference[], primary_technology_id, onboarding_completed, onboarding_data jsonb
2. plans (free/pro seed) + user_plans — billing آینده فقط این جدول را می‌نویسد
3. resume_visibility_rules — ۱۹ قانون seed برای developer/company/pro؛ سرور اعمال می‌کند نه CSS
4. developer_resume_sections — بخش‌های سفارشی هر کاربر (toggleable، managed_by developer|admin)
5. ایندکس یکتای `lower(username)` (case-insensitive)

**هسته جدید:**
- `src/lib/profile/`: username-policy.ts (لیست رزرو متمرکز)، entitlements.ts (Feature→Plan→Entitlement)، completeness.ts (مدل وزنی ۱۰ قانونی)، recommendation.ts (قوانین قطعی قابل‌توضیح)، visibility.ts
- `src/services/profile.service.ts` — آنبردینگ step-by-step با persist، claim username با CI-check، update profile با validation
- `src/services/resume/living-resume.service.ts` — رزومه DERIVED از evaluations/skill_scores؛ تفکیک خوداظهاری از تأییدشده؛ فیلتر visibility سمت سرور + PRIVACY_FLOORS (سیگنال رفتاری هرگز به شرکت نمی‌رود)؛ company view اصلاً completeness/analytics را برنمی‌گرداند

**API:** `/api/profile/onboarding` · `/api/profile` PUT · `/api/profile/avatar` (آپلود Storage) · `/api/profile/username` · `/api/resume/me` · `/api/resume/sections` CRUD · ادمین: `/api/admin/resumes` جستجوی صفحه‌بندی‌شده، `[userId]` نمای کامل، `[userId]/sections` CRUD ادمینی، `[userId]/plan` grant/revoke Pro، `/api/admin/resume-config`

**UI:** ویزارد آنبردینگ ۵ مرحله‌ای (`/dashboard/onboarding`) با ذخیره هر step · گیت داشبورد §7 · کارت «اولین آزمون» شرطی روی داده واقعی (بدون localStorage) · کارت «قدم بعدی تو» با پیشنهاد explainable · `/dashboard/resume` رزومه زنده با حلقه completeness و مهارت‌های تأییدشده متمایز · `/dashboard/profile` ادیتور کامل با آپلود عکس و username claim چک زنده · ادمین: `/admin/resumes` جستجو، `[userId]` نمای کامل + toggle Pro + مدیریت بخش‌ها، `/admin/resume-config` سوییچ‌های visibility

**Judge0 دست نخورد (§37)**؛ فقط CodeView حالا Monaco دارد (@monaco-editor/react، تم trawin-dark، سؤال بالای ادیتور §38). Exam builder picker ارتقا: فیلتر type/difficulty/technology/skill cascade (§39).

### ✅ مرحله ۱۳: رفع ۴ باگ گزارش‌شده مدیر
1. **کرش نمای رزومه ادمین** (`Cannot read properties of undefined 'fullName'`): ریشه — `withAdmin` نتیجه handler را در `Response.json` می‌پیچد؛ route `/api/admin/resumes/[userId]` خودش `Response.json` برمی‌گرداند → خروجی `{}` می‌شد. فیکس: برگرداندن object ساده. الگوی مشکل در کل کدبیس grep شد — فقط همین یک route بود.
2. **آپلود عکس پروفایل**: endpoint واقعی `POST /api/profile/avatar` ساخته شد (multipart، JPG/PNG/WebP، ≤۲MB، مسیر namespaced per-user در bucket موجود public `avatars`، آپدیت profiles.avatar_url). UI: file-picker با preview و حالت uploading جای input URL نشسته.
3. **فیلد تجربه کار نمی‌کرد**: `Number(e.target.value)||0` باعث می‌شد پاک کردن رقم → 0 قفل شود. فیکس: state خام متنی + parse فقط هنگام save (clamp ۰-۶۰).
4. **سؤال fill_blank نمایش داده نمی‌شد**: seed های قدیمی صورت سؤال را در کلید `question` دارند نه `question_with_blank`. فیکس در question-delivery: fallback chain + تست واحد جدید که تضمین می‌کند فیلدهای legacy `answer`/`accepted_answers` هرگز به کلاینت نروند.

⚠️ **هشدار مهم برای سشن‌های بعدی:** این فایل یک بار به‌خاطر revert شدن تغییرات commitنشده به عقب برگشت (مراحل ۱۱-۱۲ پاک شدند و بازنویسی شدند). **قبل از هر reset/checkout، تغییرات memory-don.md را کامیت یا stash کنید.**

**تأیید نهایی مرحله ۱۳:** jest 45/45 واحد + ۷/۷ live p3 · tsc صفر · next build ✅

### ✅ مرحله ۱۴: موتور شواهد تأیید مهارت + بهبودهای UX رزومه و داشبورد
**مشکل بزرگ رفع‌شده:** مهارت با ۱-۲ سؤال «تأییدشده» می‌شد! حالا تصمیم از **جداول موتور ارزیابی** می‌آید:
**Migration زنده `20260826120000_skill_verification_policy.sql`:**
- seed قانون `skill_verification` در `evaluation_rules` + `rule_versions` v1 با شرایط JSONB: تأییدشده = ≥۲۰۰ سؤال نمره‌داده ∧ ≥۵ آزمون کامل ∧ ≥۳ پروژه/مسابقه ∧ نمره ≥۷۰ | در حال شکل‌گیری = ≥۳۰ سؤال ∧ ≥۱ آزمون ∧ نمره ≥۵۰. هر ویرایش ادمین = نسخه جدید (تاریخچه حفظ می‌شود).

**سرویس:** `living-resume.service.ts` — `loadVerificationPolicy()` از جداول موتور، `collectEvidence()` شمارش per-skill از داده کانونیکال (answers×question_skills×exam_sessions در یک join؛ پروژه‌ها از developer_resume_sections)، تابع خالص `computeVerificationLevel` (none/emerging/verified/expert — قابل تست واحد)، `VerifiedSkill.level/levelLabel/evidence{gradedQuestions,correctRate,completedExams,projects}`. بخش **تحلیل پیشرفته PRO**: نقاط قوت (≥۸۰٪) و ضعف (<۶۰٪) با یادداشت عملی — فقط وقتی plan=pro و فقط نمای دولوپر.

**ادمین:** صفحه resume-config حالا ادیتور سیاست تأیید دارد (ورودی عددی + clamp سمت سرور + قاعده «تأیید باید سخت‌گیرانه‌تر از شکل‌گیری باشد») → ذخیره = نسخه جدید rule_versions.

**UX فیکس‌ها:** فرم بخش‌های رزومه placeholder داینامیک per-kind (پروژه/تجربه/تحصیلات/مسابقه/گواهینامه/لینک هرکدام متن مخصوص) · کلیک روی هر بخش = باز شدن محتوای کامل (توضیح+لینک) هم در نمای دولوپر هم ادمین · آواتار کاربر در sidebar داشبورد + چیپ PRO هدر (از EntitlementService) · Monaco: پین CDN jsdelivr@0.52.2 (workers کامل = IntelliSense واقعی HTML/CSS/TS) + گزینه‌های صریح suggestion.

**دیتابیس مرتبط با آینده (برای موتور رفتاری بعدی):** clipboard_markers(marker_type/hash/is_internal) · code_metrics(metric_type/value) · coding_events(event_type/source) · ai_detection_results(detection_type/probability/result) · editor_events(payload) — همه موجود؛ لایه تصمیم بعدی باید از همین‌ها signal بسازد (نسبت paste→run فوری، حجم کد AI، الگوی خواندن قبل از اجرا).

**تأیید نهایی مرحله ۱۴:** jest 51 کل (۳۸ واحد پاس + ۱۳ live skip بدون env) · live p3 ۷/۷ ✓ · tsc صفر · build ✅

### ✅ مرحله ۱۵: فیکس ورودی سیاست + آواتار/PRO در هدر + سند درک پروژه
1. **ورودی‌های «قواعد تأیید مهارت» تایپ نمی‌شد:** همان باگ coercion (`Number('')→0`). فیکس: draft متنی با فیلتر فقط-رقم، parse/clamp هنگام save، فلگ dirty تا reload وسط تایپ، hint زیر هر فیلد. (فایل: admin/resume-config/page.tsx)
2. **آواتار+PRO در داشبورد:** قبلاً فقط sidebar بود؛ حالا هدر بالا هم (موبایل‌پسند) — DashboardShell props `avatarUrl`/`planBadge`.
3. **mythink.md ساخته شد:** سند فارسیِ درک کامل پروژه برای سشن‌های بعدی — نقشه ۶۵ جدول به تفکیک دامنه، قرارداد هویت دو لایه و استثناهایش، موتور تصمیم (engine_versions/rule_versions)، تله‌متری رفتاری و سیگنال‌های آینده (paste-rate, AI-ratio)، قراردادهای طلایی غیرقابل‌شکست، و نقشه راه پیشنهادی (موتور رفتاری v0 → نمای شرکت → مسابقات → JPlag → snapshot → adaptive واقعی).

**دیتابیس کامل بازدید شد (داخل Supabase):** ۶۵ جدول عمومی + storage (avatars/resumes/company-assets) + توابع (handle_new_user, get_my_user_id, has_permission, admin_bulk_import_questions, rls_auto_enable, set_updated_at) + ۶۰ پالیسی RLS روی ۵۸ جدول + گراف کامل FK ثبت شد در mythink.md.

### ✅ مرحله ۱۶: اسکیمای صددرصدی + سند تحلیل mythink1.md
- **اسکیمای کامل استخراج و خوانده شد:** هر ۶۵ جدول ستون‌به‌ستون (all_columns)، هر ۷۳ FK با جفت‌ستون دقیق، همه CHECK/UNIQUE (شامل status های hiring: applications/interviews/jobs/proctoring/processing_jobs)، ۶۰ پالیسی RLS، توابع، view ها.
- **TRAWIN_MASTER_CONTEXT.md کامل خوانده شد** (هر ۵ بخش: Identity/Vision/Philosophy → Core Systems → Trust/Hiring → Infrastructure → Roadmap/Governance).
- **`mythink1.md` ساخته شد** (نسخه ۲ — فقط «تراوین چیست و کارش چیست»): تلاقی دیتابیس واقعی × Master Context شامل: پاسخ ساختاریافته به ۴ مشکل دنیای سنتی با سازوکارهای DB، هفت دامنه داده با نمودار روابط واقعی، جدول «وعده Master Context vs واقعیت دیتابیس» (۹ ردیف)، جمع‌بندی یک‌پاراگرافی موتور اعتماد + مدل درآمد (Pro + شرکت) + قراردادهای طلایی.
- نکته کشف جدید از CHECKها: `applications.resume_id` یعنی درخواست استخدام به snapshot لحظه‌ای رزومه وصل است؛ `code_submissions.source_code_hash` از روز اول برای تشابه‌سنجی طراحی شده؛ `clipboard_markers.is_internal` تفکیک سیگنال داخلی/عمومی را پیش‌بینی کرده.

---
*آخرین بروزرسانی: ۲۰۲۶-۰۸-۲۶*
