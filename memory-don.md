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
