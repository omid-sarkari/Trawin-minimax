# 🧠 mythink.md — درک من از پروژه تراوین

> این سند، فهم زنده‌ی من (دستیار توسعه) از اینکه «تراوین واقعاً چیست» است.
> هر بار که سشن جدید شروع می‌شود، اول این فایل خوانده شود تا زمینه حفظ گردد.
> آخرین بازنگری: ۱۴۰۴/۰۶/۰۴ (۲۰۲۶-۰۸-۲۶)

---

## ۱. تراوین در یک جمله

**تراوین پلتفرمِ اثباتِ مهارتِ واقعیِ برنامه‌نویس‌هاست** — نه یک سایت آزمون آنلاین.
کاربر نهایی شرکت‌ها هستند که می‌خواهند بدانند یک دولوپر **واقعاً چقدر بلد است، کجا قوی است، کجا ضعیف است، چطور کار می‌کند** — نه فقط یک مدرک.

فرمول محصول:

```
دولوپر → آنبردینگ → هدف/نقش/تکنولوژی → آزمون → شواهد تأییدشده → رزومه زنده → کشف/استخدام توسط شرکت
```

## ۲. تفاوت بنیادین با «سایت آزمون»

| سایت آزمون | تراوین |
|---|---|
| نمره = عدد نهایی | نمره فقط **شواهد خام** است؛ موتور تصمیم می‌گیرد چه چیزی به رزومه بچسبد |
| پاسخ صحیح/غلط | رفتار پاسخ‌دادن هم داده است: paste→run فوری؟ حجم کد AI؟ الگوی تایپ؟ |
| مدرک ثابت | **رزومه زنده**: با هر آزمون جدید، خودش به‌روز می‌شود (DERIVED از داده کانونیکال، هرگز کپی دستی) |
| اعتماد به ادعای کاربر | تفکیک صریح **خوداظهاری** («من React بلدم») از **تأیید موتور** («React Hooks — ۸۴٪ — مبتنی بر ۲۰۰+ سؤال») |

## ۳. معماری داده — نقشه کامل (۶۵ جدول، همه را دیدم)

### الف) هویت دو لایه (مهم‌ترین قرارداد پروژه)
```
auth.users (سوپابیس)
   ↓ trigger handle_new_user()
public.users  ← شناسه کانونیکال اپلیکیشن (username, role, status)
public.profiles ← اطلاعات حرفه‌ای (bio, avatar, headline, onboarding...)
```
- RPC `get_my_user_id()` پل بین auth.uid و users.id است؛ **هیچ‌جا نباید auth.users.id جای users.id نشست**
- ⚠️ استثنای عمدی: `question_selection_events` و `user_skill_states` به auth.users FK دارند!
- RBAC سه‌لایه: `roles` (developer/company/admin) + `permissions` (۹ مجوز) + `role_permissions` + RPC `has_permission()`

### ب) محتوای آزمون
```
tracks → technologies (۷ تا) → skills (۹ تا) → question_skills (وزن مهارت per سؤال)
questions (۵ نوع: mcq/fill_blank/open_ended/coding/debugging, difficulty 1-5)
  → question_versions (محتوای JSONB + test_cases؛ نسخه‌بندی کامل، UNIQUE(question_id,version))
  → question_tags/question_templates
```
- محتوا در JSONB است و **قرارداد قدیمی seed** با ویزارد جدید فرق دارد (fill_blank قدیمی: کلید `question`؛ جدید: `question_with_blank`) — لایه delivery باید هر دو را بخواند و فیلدهای جواب (`answer`, `is_correct`) را هرگز بیرون ندهد.

### ج) اجرای آزمون (که خودم ساختم - مرحله ۱۱)
```
exams (draft/published/archived/closed) → exam_questions (order+weight)
exam_selection_configs (fixed/adaptive)
exam_sessions (started→submitted→evaluating→completed/cancelled — CHECK دارد، حالت expired وجود ندارد؛ انقضا lazy با همان مسیر finalize)
  → question_selection_events (pin نسخه سؤال داخل selection_reason JSONB — تاریخچه مصون از ادیت ادمین)
  → answers (UNIQUE(session,question) → upsert idempotent + question_version_id برای reproducibility)
  → answer_evaluations → evaluations (overall_score/level/confidence/engine_version_id) → skill_scores
user_skill_states (Elo: rating/uncertainty/confidence/attempts) ← حالت طولی هر کاربر-مهارت
```

### د) موتور کدنویسی
```
code_submissions (+judge0_submission_id, status CHECK شامل plagiarized)
  → execution_results
coding_sessions (لینک به exam_session) → editor_events, coding_events, coding_snapshots,
clipboard_markers, code_metrics, ai_detection_results   ← کل تله‌متری رفتاری همینجاست
code_similarity_reports (JPlag - جداست از Judge0)
```

### هـ) موتور تصمیم — «مغز» پلتفرم
```
engine_versions (نسخه الگوریتم ارزیابی؛ الان v1.0.0 فعال)
evaluation_rules + rule_versions (شرایط/actions JSONB، نسخه‌دار)
```
- الان اولین قانون واقعی را گذاشتم: `skill_verification` v1 — تأیید مهارت = ≥۲۰۰ سؤال نمره‌داده + ≥۵ آزمون کامل + ≥۳ پروژه + نمره≥۷۰. هر تغییر ادمین = نسخه جدید.
- این همان «لاگر/تصمیم‌گیرنده» ای است که مدیر می‌گوید: **LLM نیست، الگوریتم ماست** و بعداً روی تله‌متری رفتاری هم سوار می‌شود.

### و) رزومه و استخدام
```
resumes + resume_versions (اسنپ‌شات نسخه‌ای؛ فعلاً کم‌استفاده — رزومه اصلی DERIVED است)
developer_resume_sections (پروژه/تجربه/تحصیلات/مسابقه... per-user، toggleable، ادمین هم می‌تواند ثبت کند)
resume_visibility_rules (۱۹ قانون developer/company/pro — سرور اعمال می‌کند)
plans (free/pro) + user_plans (billing آینده فقط همین را می‌نویسد)
companies + company_members → jobs → applications (→ resumes!) → interviews (LiveKit)
proctoring_sessions/events (OpenProctor)
notifications, processing_jobs, audit_logs, api_actions, realtime_events, project_memory, building_blocks_registry
```

### ز) زیرساخت بیرونی (registry: building_blocks_registry)
- **Judge0** (اجرای امن کد — فقط برای coding/debugging/مسابقه، هرگز MCQ/fill_blank/open_ended)
- **JPlag** (تشابه کد — جدا از Judge0)، **LiveKit** (مصاحبه تصویری)، **Monaco+Yjs** (ادیتور مشارکتی)، **OpenProctor** (مراقبت آزمون)
- همه «planned» ثبت شده‌اند؛ Judge0 الان کار می‌کند (fail-closed بدون کلید)

## ۴. چیزهایی که این پروژه «هست» (جمع‌بندی فلسفی)

1. **ماشین شواهد است نه ماشین نمره.** هر عددی که به رزومه می‌رود باید قابل توضیح باشد: چند سؤال؟ چند جلسه؟ چند پروژه؟ چه رفتاری؟
2. **حریم خصوصی داخلی مقدس است.** تله‌متری (paste/AI-detection/keystroke) ورودی تصمیم ماست، هرگز مستقیم نمایش داده نمی‌شود؛ فقط جمع‌بندی تأییدشده به شرکت می‌رسد.
3. **سرور تنها مرجع حقیقت است.** تایمر، state، انتخاب سؤال، نمره — همه سرورمحور؛ مرورگر فقط نمایش.
4. **داده‌محور بودن یعنی جدول.** لیست‌ها، قوانین visibility، آستانه‌های تأیید — همه در DB با UI ادمین؛ هیچ hardcode در کامپوننت.
5. **با AI نمی‌جنگیم؛ اندازه‌اش می‌کنیم.** هدف: «این نفر X٪ کدش AI-assisted است و Y ساعت عمیق کار مستقل دارد» — این خودش ارزش رزومه است.

## ۵. وضعیت امروز (چه ساخته شده / چه مانده)

**سالم و کامل:** Auth نقش‌محور · پنل ادمین کامل (سؤال/bulk/content/users/exams/resumes/config) · Runtime آزمون با Judge0 fail-closed · آنبردینگ · رزومه زنده با completeness · Pro/entitlements · username CI · تست‌ها (۵۱ مورد + live acceptance)

**قدم‌های بعدی روشن (به ترتیب ارزش):**
1. موتور رفتاری v0 روی تله‌متری موجود (paste-rate، run-after-paste latency، AI-ratio per session) → خروجی: امتیاز اعتماد per session که به evaluation بچسبد
2. نمای شرکت واقعی (/company): جستجوی نامزد بر اساس verified skills + مشاهده رزومه با visibility rules
3. مسابقات (team/individual) روی همین CodeExecutionProvider
4. JPlag similarity pipeline پس از تکمیل اجرای کد
5. snapshot/export رزومه (جدول resumes آماده است)
6. adaptive engine واقعی روی user_skill_states (الان MVP easy-first)

## ۶. قراردادهای طلایی که نباید شکسته شوند

- ❌ auth.users.id جای users.id (جز دو جدول استثنا)
- ❌ نوشتن مستقیم از مرورگر به DB — همه‌چیز از API Route با service-role بعد از احراز هویت
- ❌ نمایش فیلدهای مخفی با CSS — سرور اصلاً نباید بفرستد
- ❌ Judge0 برای سؤالات غیرکدی
- ❌ دستکاری اسکیما بدون گزارش §28 (STOP & explain)
- ❌ «تأیید» ارزان — همیشه از rule_versions فعلی بخوان
