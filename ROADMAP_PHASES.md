# ROADMAP_PHASES.md — فازبندی اجرای تراوین

> هر فاز یک شناسه دارد (P0…P13). برای هر فاز: هدف، دامنه، خروجی‌ها، معیار پذیرش و **ارجاع مستقیم به بخش مربوطه در TECHNICAL_BLUEPRINT.md (LLD)**.
> قانون کار: هر کس فازی را می‌گیرد → به بخش همان فاز در LLD می‌رود → همه چیز (مسیر فایل، امضا، DDL، قرارداد API، تست) آنجا مشخص است. هیچ چیز پیش‌فرض گرفته نمی‌شود.
> نسخه: ۱.۰ — ۲۰۲۶-۰۸-۲۶

---

## P0 — زیرساخت پایه ✅ تکمیل‌شده
- Next.js 16 + TypeScript + Tailwind 4 + RTL دارک پریمیوم
- Supabase متصل، تایپ‌های تولیدی از DB زنده (۶۵ جدول)
- الگوی امنیت: مرورگر → API Route (session) ← service-role ← DB؛ RLS فعال
**LLD:** §1 (قراردادهای سراسری)

## P1 — احراز هویت و هویت ✅
- Auth نقش‌محور (developer/company/admin)، trigger ساخت users/profiles
- RPC `get_my_user_id()` — شناسه کانونیکال `users.id`
- proxy.ts محافظ روت‌ها + گارد allowlist ادمین
**LLD:** §2

## P2 — موتور محتوا و پنل ادمین ✅
- CRUD کامل سؤالات (۵ نوع) با نسخه‌بندی question_versions
- ایمپورت گروهی اتمی (RPC)، مدیریت تکنولوژی/مهارت/تگ
- آزمون‌ها: ساخت، اتصال سؤال با order/weight، حالت انتخاب fixed/adaptive، انتشار
**LLD:** §3

## P3 — Runtime آزمون + Judge0 ✅
- جلسه سرورمحور با state machine شرطی، تایمر/انقضای lazy، pin نسخه سؤال، پاسخ idempotent
- Judge0 fail-closed فقط برای coding/debugging؛ ارزیابی MCQ/FillBlank/OpenEnded بدون Judge0
- Runner کامل دولوپر + Live Acceptance
**LLD:** §4

## P4 — آنبردینگ + رزومه زنده + Pro ✅
- ویزارد ۵ مرحله‌ای با persist هر step؛ گیت داشبورد
- رزومه دو-نما DERIVED از داده کانونیکال + completeness وزنی + بخش‌های سفارشی toggleable
- plans/user_plans + EntitlementService متمرکز؛ username CI؛ آواتار Storage
**LLD:** §5

## P5 — موتور تأیید مهارت نسخه‌دار ✅
- سیاست در evaluation_rules/rule_versions: تأیید = ≥۲۰۰ سؤال نمره‌داده + ≥۵ آزمون کامل + ≥۳ پروژه + نمره≥۷۰
- شمارش شواهد از joins کانونیکال؛ سطوح none/emerging/verified/expert
- ادیتور ادمینی با ثبت نسخه جدید در هر تغییر
**LLD:** §6

---

# 🔜 فازهای پیش رو

## P6 — پلتفرم شرکت (Hiring Platform)
**هدف:** شرکت‌ها وارد شوند، نامزد تأییدشده پیدا کنند، شغل بگذارند، خط لوله استخدام را مدیریت کنند.
**دامنه:** عضویت شرکت (owner/admin/recruiter/member)، جستجوی نامزد بر اساس مهارت تأییدشده + نمره + استان، CRUD شغل با requirements JSONB، خط لوله applications با گذار وضعیت قانونمند، مصاحبه LiveKit.
**خروجی‌ها:** صفحات /company کامل (Candidates/Jobs/Pipeline/Interviews)، ۷ route API، CompanyService، گارد company_members.
**معیار پذیرش:** شرکتِ member می‌تواند نامزد verified React در استان X را با نمره ≥۷۰ پیدا کند، job بسازد، application ثبت کند و تا accepted جلو ببرد؛ نامزد خصوصیات غیرمجاز را نمی‌بیند.
**→ LLD: §7**

## P7 — مسابقات تیمی و فردی (سطح استانی)
**هدف:** ستون سوم محصول — مسابقات رسمی که نتایجشان شاهد رزومه است.
**دامنه:** جدول‌های competitions/competition_teams/team_members/registrations/results با CHECK های مقیاس (provincial/national) و mode (individual/team)؛ چرخه وضعیت draft→registration_open→running→grading→completed؛ تابلوی امتیاز؛ اجرا روی همان CodeExecutionProvider (Judge0)؛ **finalize خودکار = درج شاهد competition در developer_resume_sections توسط موتور تصمیم**؛ تیم‌ها با کاپیتان و سقف اعضا.
**خروجی‌ها:** Migration DDL کامل، CompetitionService، ۸ route API، صفحات دولوپری لیست/جزئیات مسابقه + تشکیل تیم، پنل ادمین مسابقات.
**معیار پذیرش:** یک مسابقه استانی تیمی ۳ نفره: ثبت‌نام تیم → اجرا → ثبت نتیجه → finalize → شاهد «مسابقه X — رتبه Y» در رزومه هر ۳ عضو ظاهر شود و در نمای شرکت هم قابل مشاهده باشد.
**وابستگی:** P3 (Judge0)، P5 (موتور تصمیم).
**→ LLD: §8**

## P8 — موتور هوش رفتاری v1 (Behavioral Intelligence)
**هدف:** اندازه‌گیری «چطور کد می‌زند» — ورودی موتور اعتماد.
**دامنه:** سیگنال‌های v1 از تله‌متری موجود: pasteRatio، runAfterPasteLatencyMs، editAfterPasteRatio، aiAssistRatio (میانگین ai_detection_results)، sessionDuration؛ محاسبه per coding_session و نوشتن در code_metrics با metric_type استاندارد؛ پیوست جمع‌بندی privacy-safe به answer_evaluations.result.behavior؛ نمایش تجمیعی فقط در رزومه دولوپر (Pro) با کلید visibility.
**معیار پذیرش:** برای یک session واقعی، ۵ متریک با مقادیر معتبر تولید و ذخیره شود؛ نمای شرکت چیزی از آن نبیند.
**وابستگی:** P3.
**→ LLD: §9**

## P9 — تشابه کد (JPlag Pipeline)
**هدف:** ضدتقلب کپی/اشتراک راه‌حل بین شرکت‌کنندگان آزمون و مسابقه.
**دامنه:** صف processing_jobs برای تحلیل پس از submit؛ فراخوانی سرویس JPlag خارجی (env: JPLAG_URL/JPLAG_TOKEN)؛ ذخیره code_similarity_reports(similarity_score, compared_submission_id)؛ آستانه ≥۰.۸ ⇒ status='plagiarized' + notification به ادمین؛ هرگز Judge0 را درگیر نکند.
**معیار پذیرش:** دو submission یکسان ⇒ report با score≈1 و status plagiarized؛ UI ادمین گزارش را ببیند.
**→ LLD: §10**

## P10 — انتخاب تطبیقی واقعی (Adaptive v2)
**هدف:** جایگزینی MVP easy-first با Elo-driven selection.
**دامنه:** AdaptiveSelectionStrategy جدید روی user_skill_states: هدف‌گیری difficulty متناسب rating (band ±150)؛ اولویت مهارت‌های ضعیف‌تر؛ ثبت candidate_score در question_selection_events؛ حفظ قرارداد strategy interface بدون تغییر runtime.
**معیار پذیرش:** دو کاربر با rating متفاوت، ستون‌های سختی متفاوت اما deterministic دریافت کنند؛ همه انتخاب‌ها event داشته باشند.
**→ LLD: §11**

## P11 — پروفایل عمومی + Snapshot رزومه
**هدف:** اشتراک‌گذاری بیرونی کنترل‌شده.
**دامنه:** صفحه عمومی /developers/[username] (فقط اگر قوانین اجازه دهند؛ OG metadata؛ بدون UUID در URL)؛ Snapshot on-demand در resumes/resume_versions؛ خروجی JSON قابل دانلود؛ PDF (فاز بعدی اختیاری).
**→ LLD: §12**

## P12 — نوتیفیکیشن و Worker ها
**هدف:** عملیات سنگین از request اصلی جدا شوند.
**دامنه:** استفاده واقعی از notifications (رویدادها: قبولی در مسابقه، تغییر وضعیت application، grant Pro)؛ worker های processing_jobs (تحلیل JPlag، محاسبه trust، finalize مسابقه)؛ اجرا با Vercel Cron یا trigger دستی ادمین.
**→ LLD: §13**

## P13 — Scale (شرطی به رشد)
Redis cache برای public data · Queue واقعی · Retention policy تله‌متری خام (Master Context §45) · Analytics.
**→ LLD: §14**

---

## ماتریس وابستگی

```
P6 شرکت ◄── P11 پروفایل عمومی ◄── P12 نوتیف
   ▲                ▲
P7 مسابقات ────────┤ (نتایج→رزومه)
   ▲                │
P8 رفتاری ──► P9 JPlag ──► Trust کامل
   ▲
P10 تطبیقی (مستقل)
```

## قاعده اجرا (برای همه فازها)
1. قبل از شروع: بخش فاز در LLD + mythink1.md + memory-don.md بخوان
2. Migration فقط idempotent + ثبت در schema_migrations زنده + regenerate types
3. منطق در Service Layer؛ کامپوننت فقط UX
4. تست: واحد برای منطق خالص + live acceptance برای جریان کامل + tsc/build سبز
5. پایان فاز: به‌روزرسانی memory-don.md (بدون ادعای دروغ)
