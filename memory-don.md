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

---
*آخرین بروزرسانی: ۲۰۲۶-۰۸-۲۲*
