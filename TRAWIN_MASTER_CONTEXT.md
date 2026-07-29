باشه   امید . 🚀
  این   را   به ‌ عنوان   نسخه   Master   Context   پروژه   Trawin   می ‌ سازم ؛  هدفش   این   است   که   اگر   هر   AI   Agent   یا   توسعه ‌ دهنده ‌ ای   آن   را   بخواند ،  بدون   داشتن   تاریخچه   چت   بفهمد :
1.  Trawin   چیست
2.  الان   کجاست
3.  چه   معماری ‌ ای   دارد
4.  چه   تصمیم ‌ هایی   گرفته   شده
5.  چه   چیزهایی   نباید   خراب   شود
6.  مسیر   توسعه   بعدی   چیست
به   خاطر   محدودیت   طول   پیام ،  آن   را   در   چند   بخش   می ‌ فرستم .  این   بخش  ۱   است .  بعدی ‌ ها   را   ادامه   می ‌ دهم .
TRAWIN MASTER PROJECT CONTEXT
Version
Project: Trawin
Document Type: Master Technical Context
Purpose: AI Agent / Developer Onboarding
Status: Foundation Stage
Founder: Omid
1. Project Identity
What is Trawin?
Trawin   یک   پلتفرم   هوشمند   ارزیابی ،  آموزش   و   استخدام   برنامه ‌ نویسان   است .
هدف   اصلی   Trawin   این   نیست   که   فقط   یک   سایت   آزمون   برنامه ‌ نویسی   باشد .
هدف :
ساخت   یک   سیستم   اثبات   مهارت   واقعی   برنامه ‌ نویس   بر   اساس   عملکرد   واقعی ،  رفتار   کدنویسی ،  حل   مسئله   و   نتایج   قابل   اعتماد .
در   سیستم ‌ های   سنتی :
1.  رزومه   قابل   جعل   است .
2.  مدرک   تضمین   مهارت   نیست .
3.  پروژه ‌ ها   همیشه   نشان ‌ دهنده   سطح   واقعی   نیستند .
4.  مصاحبه   کوتاه   ممکن   است   اشتباه   کند .
Trawin   می ‌ خواهد   یک   لایه   Trust   ایجاد   کند .
2. Vision
ساخت   استاندارد   جدید   برای   سنجش   مهارت   برنامه ‌ نویسان .
مانند   اینکه :
1.  LinkedIn  =  معرفی   حرفه ‌ ای
2.  GitHub  =  سابقه   کد
3.  LeetCode  =  تمرین   الگوریتم
اما :
Trawin  =  اثبات   واقعی   توانایی   توسعه   نرم ‌ افزار
3. Core Philosophy
قوانین   اصلی   محصول :
3.1 Skill Over Resume
تمرکز   روی :
1.  چیزی   که   کاربر   واقعا ً  می ‌ تواند   بسازد .
2.  نه   چیزی   که   در   رزومه   نوشته   است .
3.2 AI Should Assist, Not Replace
هوش   مصنوعی   در   Trawin   دشمن   نیست .
هدف :
آموزش   استفاده   درست   از   AI .
اما   باید   مشخص   باشد :
1.  چه   مقدار   کار   توسط   انسان   انجام   شده .
2.  چه   مقدار   کمک   AI   بوده .
3.  سطح   استقلال   برنامه ‌ نویس   چقدر   است .
3.3 Evidence Based Profile
پروفایل   کاربر   باید   بر   اساس   Evidence   ساخته   شود :
مثلا ً:
JavaScript
Score: 87%
Evidence:
- 32 assessments
- 15 coding challenges
- 5 projects
- debugging performance
- algorithm performance
4. Current Repository
Repository:
omid-sarkari/Trawin-minimax
5. Current Development Stage
وضعیت   فعلی :
Foundation Phase
یعنی :
زیرساخت   اولیه   ساخته   شده   ولی   هنوز   Core   Product   کامل   نشده   است .
ساخته   شده :
✅ Next.js foundation
✅ App Router
✅ React structure
✅ TypeScript setup
✅ Tailwind CSS
✅ Persian RTL UI foundation
✅ Supabase integration foundation
✅ Authentication infrastructure foundation
✅ Database typing foundation
در   حال   آماده ‌ سازی :
1.  User system
2.  Assessment Engine
3.  Question Engine
4.  Code Evaluation
5.  Developer Profile
6.  AI Intelligence Layer
6. Technology Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
HTML
CSS
Backend / Database
Primary:
Supabase
PostgreSQL
دلایل   انتخاب :
1.  سرعت   توسعه   بالا
2.  PostgreSQL   واقعی
3.  Auth   داخلی
4.  Storage
5.  Realtime
6.  Edge Functions
7.  مناسب   MVP
7. Architecture Principles
این   قوانین   باید   همیشه   رعایت   شوند .
Rule 1
Business   Logic   داخل   Component   نباشد .
اشتباه :
Component
 |
 |-- Database Query
 |-- Business Rules
 |-- Validation
درست :
Component
Service Layer
Business Logic
Database
Rule 2
Database   تغییر   مستقیم   بدون   Migration   ممنوع .
هر   تغییر :
Migration
↓
Test
↓
Deploy
Rule 3
هیچ   Feature   نباید   باعث   بدهی   تکنیکی   بزرگ   شود .
قبل   از   ساخت :
بررسی   شود :
1.  آیا   Scale   می ‌ شود ؟
2.  آیا   هزینه   زیاد   می ‌ کند ؟
3.  آیا   بعدا ً  قابل   تغییر   است ؟
8. Supabase Architecture
Supabase   قلب   Backend   فعلی   است .
ساختار :
Frontend
↓
Supabase Client
↓
PostgreSQL Database
Current Supabase Components
Client Side
برای :
1.  User interactions
2.  Public data
3.  Browser operations
Server Side
برای :
1.  Secure operations
2.  Server Components
3.  Protected actions
Middleware
وظیفه :
1.  Session handling
2.  Authentication refresh
9. Database Philosophy
دیتابیس   باید :
1.  قابل   توسعه   باشد .
2.  وابسته   به   یک   زبان   نباشد .
3.  Migration   محور   باشد .
4.  برای   Scale   آماده   باشد .
اصل   مهم :
ذخیره   همه   چیز   ممنوع .
مثال :
بد :
ذخیره   تمام   keystroke   های   کاربر
برای   همیشه
خوب :
Snapshot   های   مهم
Behavior   Events   مهم
Metrics
10. Main Database Domains
دیتابیس   آینده   شامل   این   Domain   ها   است :
User Domain
مدیریت   کاربران :
users
profiles
roles
permissions
Assessment Domain
آزمون ‌ ها :
assessments
questions
question_categories
difficulty_levels
attempts
results
Coding Domain
کدنویسی :
coding_tasks
submissions
execution_results
evaluation_versions
Intelligence Domain
هوش :
behavior_events
snapshots
trust_scores
ai_signals
Company Domain
استخدام :
companies
jobs
applications
developer_profiles
( ادامه   در   بخش  ۲:  موتور   ارزیابی ،  AI   Core ،  Monaco / Yjs ،  Judge 0،  Anti -Cheat ،  Roadmap   کامل   و   قوانین   Agent )
بخش   دوم :
امید ،  ادامه   می ‌ دهم . ✅🚀
برای   اینکه   فایل   نهایی   واقعا ً  تبدیل   به   یک   Master   Context   حرفه ‌ ای   شود ،  حدودا ً  این   ساختار   را   در   نظر   گرفتم :
TRAWIN_MASTER_CONTEXT.md
Part 1:
✅ Project Identity
✅ Vision
✅ Philosophy
✅ Repository
✅ Current State
✅ Tech Stack
✅ Architecture Rules
✅ Supabase Direction
✅ Database Domains
Part 2:
🔹 Assessment Engine
🔹 Question Architecture
🔹 Evaluation Engine
🔹 Coding Platform
🔹 Monaco + Yjs
🔹 Judge0 Integration
🔹 AI Intelligence Layer
🔹 Anti Cheat System
Part 3:
🔹 Trust Score System
🔹 Developer Profile
🔹 Resume Intelligence
🔹 Company Hiring System
🔹 Open Source Components Strategy
🔹 Security Rules
🔹 Performance Rules
🔹 Cost Optimization
Part 4:
🔹 Database Detailed Design Philosophy
🔹 Scaling Strategy
🔹 Queue / Cache / Infrastructure
🔹 Development Workflow
🔹 Testing Strategy
🔹 Deployment Strategy
Part 5:
🔹 Complete Roadmap
🔹 MVP Definition
🔹 Future Versions
🔹 AI Agent Instructions
🔹 Rules for Future Developers
🔹 Final Project Principles
یعنی   احتمالا ً  ۵  بخش   اصلی   می ‌ شود .
حالا   بخش  ۲ 👇
TRAWIN MASTER PROJECT CONTEXT
PART 2 — CORE PRODUCT SYSTEMS
11. Assessment Engine
Assessment   Engine   قلب   اولیه   Trawin   است .
هدف :
ساخت   آزمون ‌ هایی   که   فقط   حفظیات   را   نسنجند ،  بلکه   توانایی   واقعی   توسعه ‌ دهنده   را   اندازه ‌ گیری   کنند .
Assessment Types
سیستم   باید   قابلیت   پشتیبانی   از   چند   نوع   سؤال   را   داشته   باشد :
11.1 Multiple Choice
برای :
1.  مفاهیم   پایه
2.  Syntax
3.  Theory
4.  Best Practices
مثال :
Which method is used to transform an array in JavaScript?
11.2 Fill Blank
برای   بررسی :
1.  شناخت   API
2.  Syntax
3.  فهم   کد
11.3 Coding Challenge
مهم ‌ ترین   نوع .
کاربر   باید :
1.  کد   بنویسد .
2.  اجرا   کند .
3.  نتیجه   دریافت   کند .
11.4 Open Question
برای :
1.  توضیح   معماری
2.  Debugging reasoning
3.  تصمیم ‌ های   مهندسی
12. Question Architecture
سؤال   نباید   فقط   یک   متن   باشد .
هر   سؤال   باید   Metadata   داشته   باشد .
مثال :
Question
id
title
description
skill
technology
difficulty
estimated_time
evaluation_type
version
Skill Mapping
هر   سؤال   باید   به   مهارت   مشخص   وصل   باشد .
مثلا ً:
JavaScript
 ├── Array Methods
 ├── Async Programming
 ├── Closures
 ├── DOM
 └── Performance
هدف :
وقتی   کاربر   آزمون   می ‌ دهد ،  سیستم   بفهمد :
" این   شخص   در   کدام   بخش   قوی   یا   ضعیف   است ."
13. Evaluation Engine
Evaluation   Engine   سیستم   قضاوت   Trawin   است .
این   قسمت   نباید   Hard   Code   شود .
اشتباه :
if answer == x:
    score = 100
معماری   درست :
Question
↓
Evaluation Rule
↓
Evaluation Engine
↓
Result
Versioned Evaluation
مهم :
قوانین   ارزیابی   باید   Version   داشته   باشند .
مثال :
Evaluation Engine v1
Evaluation Engine v2
Evaluation Engine v3
چرا ؟
چون   اگر   بعدا ً  الگوریتم   بهتر   شد :
نباید   نتایج   قدیمی   خراب   شوند .
14. Coding Platform
یکی   از   مهم ‌ ترین   بخش ‌ های   Trawin .
هدف :
ایجاد   محیطی   شبیه   IDE   داخل   مرورگر .
اجزا :
Code Editor
+
Execution Engine
+
Evaluation System
+
Behavior Analysis
15. Monaco Editor
هسته   ویرایشگر   کد .
استفاده :
1.  نوشتن   کد
2.  Syntax Highlight
3.  Error Detection
4.  Developer Experience
دلایل   انتخاب :
1.  استاندارد   صنعتی
2.  ساخته   شده   بر   پایه   VS   Code
3.  بسیار   قدرتمند
16. Yjs Collaboration
برای   قابلیت   همکاری .
مثال :
دو   برنامه ‌ نویس :
Developer A
       |
       |
     Yjs
       |
       |
Developer B
کاربردها :
1.  Coding Interview
2.  Pair Programming
3.  مسابقات   تیمی
17. Judge0 Integration
Judge 0  موتور   اجرای   کد   است .
وظیفه :
اجرای   امن   کد   کاربران .
جریان :
User Code
↓
Trawin Backend
↓
Judge0
↓
Execution Result
↓
Evaluation Engine
↓
Score
دلایل   استفاده :
1.  پشتیبانی   زبان ‌ های   مختلف
2.  Sandbox
3.  امنیت   بهتر
18. AI Intelligence Layer
AI   در   Trawin   یک   Layer   مستقل   است .
نباید   کل   سیستم   وابسته   به   یک   مدل   باشد .
معماری :
Application
↓
AI Adapter
↓
Model Provider
یعنی :
امروز :
Gemma
فردا :
Qwen
GPT
Claude
Local Model
بدون   تغییر   Core .
AI   کاربردها :
18.1 Learning Assistant
کمک   به   یادگیری :
1.  توضیح   خطا
2.  پیشنهاد   مسیر   یادگیری
3.  Feedback
18.2 Code Analysis
تحلیل :
1.  کیفیت   کد
2.  ساختار
3.  Complexity
18.3 Interview Assistant
کمک   در :
1.  تولید   سؤال
2.  تحلیل   پاسخ
3.  گزارش   شرکت ‌ ها
19. AI Usage Rules
قانون   مهم :
AI   نباید   جای   مهارت   واقعی   را   بگیرد .
سیستم   باید   تشخیص   دهد :
مثلا ً:
Human Written Code
AI Assisted Code
Fully Generated Code
هدف :
مجازات   AI   نیست .
هدف :
شفافیت   است .
20. Anti Cheat System
اعتماد   یکی   از   مهم ‌ ترین   ارزش ‌ های   Trawin   است .
لایه ‌ های   ضد   تقلب :
Code Similarity
ابزارها :
1.  JPlag
2.  Dolos
3.  SourcererCC
برای   تشخیص :
1.  کپی   مستقیم
2.  شباهت   زیاد
3.  اشتراک   الگوریتم
Behavior Analysis
بررسی :
1.  الگوی   تایپ
2.  تغییرات   کد
3.  Snapshot   ها
4.  رفتار   غیرطبیعی
Proctoring
در   آینده :
1.  OpenProctor
2.  LiveKit
3.  Jitsi
برای :
1.  مصاحبه
2.  آزمون ‌ های   حساس
21. Behavioral Intelligence
هدف :
ساخت   یک   مدل   اعتماد .
نه   فقط :
Score = 90
بلکه :
Score = 90
Confidence:
85%
Evidence:
- 20 challenges
- 5 projects
- consistent coding behavior
- low similarity risk
پایان   بخش  ۲. ✅
بخش  ۳  می ‌ رود   سراغ :
1.  Trust   Score   دقیق
2.  پروفایل   هوشمند   برنامه ‌ نویس
3.  سیستم   استخدام   شرکت ‌ ها
4.  Open   Source   Stack   کامل
5.  Security   و   Performance   Rules
🚀
بخش   سوم :
باشه   امید . 🚀
ادامه   می ‌ دیم .
این   بخش  ۳  از  ۵  است .
تمرکز   این   بخش   روی   لایه ‌ هایی   است   که   Trawin   را   از   یک   سایت   آزمون   ساده   تبدیل   می ‌ کند   به   یک   پلتفرم   Trust  +  Hiring :
Trust Score
Developer Profile
Resume Intelligence
Company Hiring
Open Source Strategy
Security
Performance
Cost Optimization
---
TRAWIN MASTER PROJECT CONTEXT
PART 3 — TRUST SYSTEM, HIRING PLATFORM & ENGINEERING RULES
---
22. Trust Score System
Purpose
Trust   Score   یکی   از   مهم ‌ ترین   دارایی ‌ های   Trawin   است .
هدف :
ایجاد   یک   امتیاز   ساده   نیست .
هدف :
اندازه ‌ گیری   میزان   اطمینان   به   توانایی   واقعی   یک   توسعه ‌ دهنده .
---
سیستم   نباید   فقط   بگوید :
Score: 95
چون   این   اطلاعات   کافی   نیست .
باید   بگوید :
Developer Trust Profile
Overall Trust:
92%
Confidence:
87%
Evidence:
- 45 assessments completed
- 20 coding challenges
- 8 verified projects
- Low similarity risk
- Consistent coding behavior
---
23. Trust Score Components
Trust   Score   باید   ترکیبی   از   چند   عامل   باشد .
---
23.1 Assessment Performance
بررسی :
تعداد   آزمون ‌ ها
سطح   سختی
درصد   موفقیت
زمان   حل
ثبات   عملکرد
مثال :
JavaScript:
92%
React:
85%
Algorithms:
76%
---
23.2 Coding Ability
بررسی :
کیفیت   کد
قابلیت   نگهداری
ساختار
Complexity
Error Handling
---
23.3 Behavioral Signals
بررسی :
روند   حل   مسئله
تغییرات   کد
Snapshot   ها
الگوی   توسعه
هدف :
تشخیص   فرآیند   فکر   کردن   توسعه ‌ دهنده .
---
23.4 Consistency
یک   برنامه ‌ نویس   واقعی   معمولا ً  رفتار   ثابت   دارد .
سیستم   بررسی   می ‌ کند :
آیا :
سطح   آزمون ‌ ها   با   هم   هماهنگ   است ؟
پروژه ‌ ها   با   توانایی   اعلام ‌ شده   همخوانی   دارند ؟
نتایج   ناگهانی   غیرطبیعی   نیست ؟
---
24. Developer Profile System
پروفایل   Trawin   نباید   یک   رزومه   معمولی   باشد .
---
رزومه   سنتی :
Name
Skills
Experience
Projects
---
رزومه   Trawin :
Verified Developer Profile
Skills Evidence
Assessment History
Coding Performance
Trust Score
Behavior Insights
AI Usage Transparency
---
25. Skill Graph
مهارت ‌ ها   باید   به   شکل   Graph   ذخیره   شوند .
مثال :
Frontend Development
        |
        |
 ----------------
 |              |
React        JavaScript
 |
Hooks
 |
Performance
---
مزیت :
سیستم   می ‌ تواند   بفهمد :
کاربر   دقیقا ً  در   چه   چیزی   قوی   است .
---
مثال :
به   جای :
React: 90%
بهتر :
React
Components:
95%
State Management:
82%
Performance:
70%
Testing:
65%
---
26. Resume Intelligence
هدف :
تبدیل   داده ‌ های   Trawin   به   یک   رزومه   هوشمند .
---
رزومه   باید   شامل :
Verified Skills
مهارت ‌ های   تاییدشده .
---
Evidence
مدرک   هر   مهارت :
مثلا ً:
React
Evidence:
12 assessments
5 projects
3 interviews
Score: 91%
---
Growth Timeline
رشد   کاربر :
January:
JavaScript 70%
March:
JavaScript 85%
June:
JavaScript 93%
---
27. Company Hiring Platform
Trawin   فقط   برای   برنامه ‌ نویس   نیست .
شرکت ‌ ها   بخش   مهم   محصول   هستند .
---
Company Features
شرکت   بتواند :
پروفایل   توسعه ‌ دهندگان   را   ببیند .
بر   اساس   مهارت   جستجو   کند .
آزمون   اختصاصی   بسازد .
افراد   را   دعوت   کند .
---
28. Hiring Workflow
جریان :
Company
↓
Create Job Requirement
↓
Select Skills
↓
Find Developers
↓
Assessment
↓
Interview
↓
Hiring Decision
---
29. Company Dashboard
ماژول ‌ های   آینده :
Dashboard
├── Candidates
├── Assessments
├── Interviews
├── Reports
└── Hiring Pipeline
---
30. Open Source Strategy
اصل :
Trawin   نباید   همه   چیز   را   از   صفر   بسازد .
اما   Core   Logic   باید   اختصاصی   باشد .
---
چیزهایی   که   استفاده   می ‌ کنیم :
---
Judge0
کاربرد :
Secure Code Execution
مسئول :
اجرای   کد
مدیریت   زبان ‌ ها
Sandbox
---
JPlag
کاربرد :
Code Similarity Detection
مسئول :
تشخیص   شباهت   کد
جلوگیری   از   تقلب
---
Monaco Editor
کاربرد :
Code Editor
مسئول :
تجربه   مشابه   VS   Code
---
Yjs
کاربرد :
Real-Time Collaboration
مسئول :
همکاری   چند   کاربر   روی   کد
---
LiveKit
کاربرد :
Communication Infrastructure
مسئول :
Video
Audio
Interview
---
OpenProctor
کاربرد :
Proctoring
مسئول :
آزمون ‌ های   حساس
کنترل   شرایط
---
31. Core vs External Components
قانون   مهم :
هر   چیزی   که   مزیت   رقابتی   است   باید   داخل   Trawin   باشد .
---
مثال :
Build Internally
✅ Trust Score Algorithm
✅ Evaluation Engine
✅ Skill Graph
✅ Developer Intelligence
✅ Resume Intelligence
---
Use Open Source
✅ Code Execution
✅ Video Infrastructure
✅ Editor Technology
✅ Similarity Detection
---
32. Security Principles
امنیت   از   روز   اول .
---
Authentication
قوانین :
Session   امن
Role Based Access
Permission Checks
---
Authorization
هر   درخواست   باید   بررسی   شود :
Who is requesting?
What permission?
What resource?
---
33. Data Privacy
داده ‌ های   کاربر   حساس   هستند .
مخصوصا ً:
کدهای   نوشته ‌ شده
رفتار   توسعه
نتایج   آزمون
---
قوانین :
حداقل   ذخیره ‌ سازی
دسترسی   محدود
Audit   مهم
---
34. Anti Abuse
سیستم   باید   مقابل :
چند   حساب
تقلب
حملات   API
Spam
مقاوم   باشد .
---
راهکارها :
Rate Limit
Verification
Monitoring
Suspicious Activity Detection
---
35. Performance Rules
هدف :
Scale   بدون   هزینه   غیرضروری .
---
Database
قوانین :
Query   بهینه
Index   مناسب
جلوگیری   از   N +1  Query
---
Frontend
قوانین :
Lazy Loading
Component Optimization
Minimal Bundle
---
Backend
قوانین :
Cache
Queue
Background Jobs
---
36. Cost Optimization Strategy
Trawin   باید   اقتصادی   رشد   کند .
---
AI Cost
اشتباه :
هر   کلیک   کاربر  →  درخواست   AI
---
درست :
User Action
↓
Check Cache
↓
Need AI?
↓
Call Model
---
Storage Cost
نباید :
تمام   تاریخچه   خام   ذخیره   شود .
---
ذخیره :
✅ Metrics
✅ Important Events
✅ Results
نه :
❌  Raw   Data   بی ‌ نهایت
---
37. Logging Strategy
Log   زیاد  =  هزینه   زیاد .
---
سطوح :
ERROR
WARNING
INFO
DEBUG
در   Production :
تمرکز   روی :
Error
Security Event
Important Business Event
---
پایان   بخش  ۳ ✅
بخش  ۴  می ‌ رود   روی   بخش ‌ های   عمیق ‌ تر   مهندسی :
طراحی   دقیق   دیتابیس
Migration Strategy
Scaling Architecture
Queue/Cache
Deployment
Testing
CI/CD
Workflow   توسعه
🚀
بخش   چهارم :
باشه   امید . 🚀
می ‌ ریم   سراغ   بخش  ۴  از  ۵.
این   بخش   بیشتر   مهندسی   زیرساخت   است ؛  یعنی   چیزهایی   که   باعث   می ‌ شود   Trawin   فقط   یک   MVP   سریع   نباشد   و   از   اول   پایه ‌ ای   ساخته   شود   که   بعدا ً  مجبور   به   بازنویسی   نشویم .
تمرکز :
Database Design Philosophy
Migration Strategy
Scaling Architecture
Cache
Queue
Infrastructure
Deployment
Testing
CI/CD
Development Workflow
---
TRAWIN MASTER PROJECT CONTEXT
PART 4 — DATABASE, INFRASTRUCTURE & ENGINEERING FOUNDATION
---
38. Database Design Philosophy
دیتابیس   Trawin   باید   برای   رشد   طولانی ‌ مدت   طراحی   شود .
هدف :
ساخت   یک   Database   ساده   ولی   قابل   توسعه .
---
اصول   اصلی :
38.1 Data Ownership
هر   داده   باید   صاحب   مشخص   داشته   باشد .
مثال :
غلط :
Assessment Table
contains:
User Data
Company Data
Question Data
---
درست :
Users Domain
Assessment Domain
Company Domain
هر   Domain   مسئول   داده   خودش   است .
---
39. Database Normalization
هدف :
جلوگیری   از :
Duplicate Data
ناسازگاری
سخت   شدن   تغییرات
---
مثال :
غلط :
Submission
username
email
company_name
question_title
---
درست :
Submission
user_id
question_id
company_id
و   ارتباط   از   طریق   Relation .
---
40. Database Evolution Strategy
دیتابیس   یک   موجود   زنده   است .
نباید   با   تغییرات   ناگهانی   خراب   شود .
---
قانون :
هر   تغییر :
New Requirement
↓
Database Design
↓
Migration
↓
Testing
↓
Production
---
41. Migration Strategy
تمام   تغییرات   Schema   باید   Migration   باشند .
مثال :
supabase/
migrations/
001_initial_schema.sql
002_add_profiles.sql
003_add_assessment.sql
---
مزایا :
تاریخچه   تغییرات
Rollback   راحت ‌ تر
همکاری   تیمی   بهتر
مناسب   AI   Agent
---
42. Version Everything
هر   چیزی   که   روی   نتیجه   تاثیر   دارد   باید   Version   داشته   باشد .
---
مثال :
Evaluation Engine
v1
v2
v3
---
Assessment
Assessment Version 1
Assessment Version 2
---
Skill Rules
Skill Mapping v1
---
دلیل :
نتیجه   قدیمی   باید   همیشه   قابل   توضیح   باشد .
---
43. Database Performance
از   ابتدا   باید   Performance   در   نظر   گرفته   شود .
---
Indexing
برای   داده ‌ هایی   که   زیاد   جستجو   می ‌ شوند .
مثال :
users.email
assessments.status
submissions.user_id
---
اما :
Index   زیاد   هم   بد   است .
چون :
سرعت   Write   کم   می ‌ شود .
حجم   DB   زیاد   می ‌ شود .
---
44. Query Optimization
قوانین :
جلوگیری   از   N +1  Query
بد :
Get users
For each user:
    Get assessments
---
خوب :
Single optimized query
with relations
---
45. Storage Strategy
Trawin   داده   زیادی   تولید   می ‌ کند .
مثل :
Code submissions
Snapshots
Reports
Logs
---
نباید   همه   چیز   دائمی   ذخیره   شود .
---
Strategy:
Permanent Data
نگهداری :
Results
Scores
Profiles
Important Events
---
Temporary Data
مانند :
Raw logs
Debug data
با   Retention   حذف   شوند .
---
46. Scaling Strategy
معماری   باید   مرحله ‌ ای   Scale   شود .
---
Stage 1 — MVP
تا   حدود   هزار   کاربر :
Architecture:
Next.js
+
Supabase
+
Single Server
---
Stage 2 — Growth
اضافه :
Redis
Queue
Background Workers
---
Stage 3 — Large Scale
اضافه :
Microservices
Dedicated Services
Distributed Systems
---
47. Cache Strategy
Cache   برای   کاهش   هزینه   و   سرعت .
---
موارد   مناسب   Cache :
Public data
Question metadata
Static content
AI responses
---
مثال :
بد :
Every user request
↓
Database
---
خوب :
Request
↓
Cache?
↓
Database only if needed
---
48. Queue Architecture
بعضی   کارها   نباید   مستقیم   انجام   شوند .
---
مثال :
کاربر   کد   ارسال   می ‌ کند .
نباید :
Request
↓
Wait 30 seconds
↓
Result
---
بهتر :
User Submit
↓
Queue
↓
Worker
↓
Judge0
↓
Result
---
کاربرد   Queue :
Code execution
AI analysis
Reports
Email
Notifications
---
49. Background Jobs
وظایف   سنگین :
تحلیل   رفتار
ساخت   گزارش
محاسبه   Trust   Score
نباید   Request   اصلی   را   کند   کنند .
---
Architecture:
Event
↓
Job Queue
↓
Worker
↓
Database Update
---
50. Infrastructure Strategy
اصل :
کمترین   هزینه ،  بیشترین   قابلیت   رشد .
---
ابتدا :
Frontend:
Vercel / Similar
Database:
Supabase
Backend Logic:
Next.js Server
Storage:
Supabase Storage
---
بعدا ً:
Dedicated VPS
Redis
Workers
Separate Services
---
51. Deployment Strategy
هر   تغییر   مستقیم   Production   ممنوع .
---
Flow:
Developer
↓
Local
↓
Test
↓
Preview Environment
↓
Production
---
52. Environment Management
نباید   Secret   ها   داخل   کد   باشند .
---
مثال :
غلط :
const key="secret"
---
درست :
.env
SUPABASE_URL
SUPABASE_KEY
---
53. Testing Strategy
تست   باید   مرحله ‌ ای   باشد .
---
Unit Test
برای :
Functions
Logic
Utilities
---
Integration Test
برای :
Database
APIs
Services
---
End-to-End Test
برای :
User Flow
Assessment Flow
Hiring Flow
---
54. CI/CD Strategy
هدف :
تغییر   امن .
---
Pipeline:
Push Code
↓
Lint
↓
Type Check
↓
Tests
↓
Build
↓
Deploy
---
55. Code Quality Rules
کد   باید :
خوانا   باشد .
قابل   نگهداری   باشد .
ساده   باشد .
---
قوانین :
کمتر :
Complex Magic Code
بیشتر :
Clear Structure
---
56. AI Assisted Development Workflow
چون   Trawin   با   AI   توسعه   پیدا   می ‌ کند ،  قوانین   مخصوص   لازم   است .
---
AI   Agent   باید :
قبل   از   تغییر :
1.  Context   را   بخواند .
2.  Architecture   را   بفهمد .
3.  فایل ‌ های   مرتبط   را   بررسی   کند .
4.  Impact   را   بسنجد .
---
AI   Agent   نباید :
بدون   دلیل   Refactor   کند .
Database   را   مستقیم   خراب   کند .
Feature   ناقص   اضافه   کند .
Dependency   غیرضروری   اضافه   کند .
---
57. Documentation Strategy
Documentation   بخشی   از   محصول   است .
باید   همیشه   به ‌ روز   باشد :
/docs
README
Architecture
Database
Roadmap
AI Context
---
58. Technical Debt Management
هر   پروژه ‌ ای   بدهی   تکنیکی   دارد .
هدف :
کنترل   آن .
---
قانون :
اگر   سریع   ساختیم :
بعدا ً  ثبت   کنیم :
TODO:
Why?
Impact?
Priority?
---
پایان   PART  4 ✅
بخش  ۵  آخرین   بخش   است   و   مهم ‌ ترین   قسمت   برای   AI   Agent   خواهد   بود :
Roadmap   کامل   Trawin
MVP   دقیق
اولویت   ساخت
قوانین   نهایی   مدیر   پروژه
چک ‌ لیست   قبل   از   هر   تغییر
چشم ‌ انداز   نسخه ‌ های   آینده
🚀
بخش   پنجم :
باشه   امید . 🚀
این   بخش  ۵  از  ۵  و   آخرین   بخش   Master   Context   است .
این   بخش   مهم ‌ ترین   قسمت   برای   هر   AI   Agent   یا   مدیر   پروژه   آینده   است ،  چون   مشخص   می ‌ کند :
الان   دقیقا ً  کجای   مسیر   هستیم .
چه   چیزی   باید   اول   ساخته   شود .
چه   چیزهایی   فعلا ً  نباید   ساخته   شود .
قوانین   تصمیم ‌ گیری   پروژه   چیست .
مسیر   نسخه ‌ های   آینده   چگونه   است .
---
TRAWIN MASTER PROJECT CONTEXT
PART 5 — ROADMAP, EXECUTION PLAN & AI AGENT GOVERNANCE
---
59. Current Project Position
وضعیت   فعلی   Trawin :
Phase:
Foundation Stage
Goal:
Build Core MVP
Priority:
Correct Architecture Over Fast Features
---
در   این   مرحله   تمرکز   روی :
پایدار   کردن   زیرساخت
ساخت   هسته   محصول
جلوگیری   از   معماری   اشتباه
ایجاد   پایه   قابل   توسعه
است .
---
60. MVP Definition
MVP   نباید   همه   ایده ‌ های   نهایی   Trawin   باشد .
هدف   MVP :
اثبات   این   سؤال :
>  آیا   می ‌ توانیم   توانایی   واقعی   یک   برنامه ‌ نویس   را   بهتر   از   رزومه   سنتی   اندازه ‌ گیری   کنیم ؟
---
MVP   شامل :
---
60.1 User System
ساخت :
ثبت ‌ نام
ورود
پروفایل
نقش ‌ ها
Roles:
User
Company
Admin
---
60.2 Assessment System
اولین   Feature   اصلی .
شامل :
ساخت   آزمون
شرکت   در   آزمون
ذخیره   نتیجه
گزارش   مهارت
---
60.3 Question Engine
ساخت   سیستم   سؤال :
Question
Category
Difficulty
Skill
Evaluation Rule
---
60.4 Developer Profile
نمایش :
مهارت ‌ ها
امتیازات
آزمون ‌ ها
Evidence
---
61.  MVP   خارج   از   Scope
برای   جلوگیری   از   پخش   شدن   تمرکز :
فعلا ً  ساخته   نمی ‌ شود :
❌  Marketplace   کامل
❌  سیستم   اجتماعی
❌  اپ   موبایل   Native
❌ Microservices
❌  مدل   AI   اختصاصی   بزرگ
❌  امکانات   پیچیده   Enterprise
---
دلیل :
اول   باید   Core   Value   ثابت   شود .
---
62. Development Roadmap
---
Phase 0 — Foundation
وضعیت :
در   حال   انجام  /  تقریبا ً  آماده
شامل :
✅ Next.js Setup
✅ Supabase Connection
✅ Basic Architecture
✅ UI Foundation
---
Phase 1 — Authentication & Identity
هدف :
ساخت   هویت   کاربران .
کارها :
Auth Flow
Profile Creation
Role System
Permission System
خروجی :
کاربر   واقعی   داخل   سیستم .
---
Phase 2 — Assessment MVP
هدف :
اولین   نسخه   قابل   استفاده .
کارها :
Question Database
Assessment Flow
Attempt System
Result System
خروجی :
کاربر   بتواند   آزمون   بدهد .
---
Phase 3 — Coding Challenge
هدف :
اضافه   کردن   برنامه ‌ نویسی   واقعی .
کارها :
Code Editor
Submission System
Judge0 Integration
Execution Result
خروجی :
کاربر   کد   واقعی   ارسال   کند .
---
Phase 4 — Intelligence Layer
هدف :
ایجاد   مزیت   رقابتی .
کارها :
Behavior Events
Snapshot System
Trust Score
AI Signals
---
Phase 5 — Hiring Platform
هدف :
ورود   شرکت ‌ ها .
کارها :
Company Account
Job Requirement
Developer Search
Reports
---
Phase 6 — Scale
زمان   رشد :
اضافه   کردن :
Redis
Queue
Workers
Analytics
Dedicated Services
---
63. Priority Decision Framework
هر   Feature   جدید   باید   از   این   فیلتر   عبور   کند :
---
Question 1
آیا   مستقیما ً  ارزش   اصلی   Trawin   را   افزایش   می ‌ دهد ؟
اگر   نه :
بعدا ً.
---
Question 2
آیا   کاربر   حاضر   است   برای   آن   پول   بدهد ؟
اگر   نه :
بررسی   مجدد .
---
Question 3
آیا   باعث   پیچیدگی   زیاد   می ‌ شود ؟
اگر   بله :
ساده ‌ سازی .
---
64. Engineering Decision Rules
مدیر   پروژه   یا   AI   Agent   باید   همیشه   این   قوانین   را   رعایت   کند .
---
Rule 1
اول   درست ،  بعد   سریع .
---
Rule 2
هیچ   Feature   بدون   بررسی   Impact   ساخته   نشود .
---
Rule 3
Database   تصمیم ‌ های   عجولانه   را   تحمل   نمی ‌ کند .
---
Rule 4
Dependency   اضافه   فقط   وقتی   که   ارزش   واقعی   دارد .
---
Rule 5
هر   چیزی   که   می ‌ تواند   Modular   باشد ،  Modular   ساخته   شود .
---
65. AI Agent Operating Instructions
این   قسمت   مخصوص   هر   AI   است   که   روی   پروژه   کار   می ‌ کند .
---
قبل   از   شروع   کار :
باید :
1.  این   Document   را   بخواند .
2.  ساختار   Repository   را   بررسی   کند .
3.  فایل ‌ های   مرتبط   را   ببیند .
4.  وابستگی ‌ ها   را   بررسی   کند .
---
66.  هنگام   تغییر   کد
AI   باید :
انجام   دهد :
✅  توضیح   هدف   تغییر
✅  بررسی   فایل ‌ های   مرتبط
✅  حفظ   Style   پروژه
✅  رعایت   Architecture
✅  تست   کردن
---
نباید :
❌  فایل   تصادفی   بسازد
❌  Dependency   بی ‌ دلیل   اضافه   کند
❌  Database   را   بدون   Migration   تغییر   دهد
❌  کد   قبلی   را   بدون   دلیل   حذف   کند
---
67. AI Project Management Rules
AI   باید   مانند   یک   Senior   Engineer   رفتار   کند .
یعنی :
قبل   از   پیشنهاد :
بررسی   کند :
هزینه
پیچیدگی
امنیت
آینده ‌ پذیری
---
یک   راه ‌ حل   ساده   که  ۸۰٪  نیاز   را   حل   کند ،  معمولا ً  بهتر   از   راه ‌ حل   پیچیده   است .
---
68. Future Architecture Vision
نسخه   نهایی   احتمالی :
Trawin Platform
              User Interface Layer
                       |
              Application Layer
                       |
        ------------------------------
        Assessment Engine
        AI Intelligence Engine
        Trust Engine
        Hiring Engine
        Analytics Engine
        ------------------------------
                       |
              Data Infrastructure
                       |
        PostgreSQL
        Cache
        Queue
        Storage
---
69. Long Term Competitive Advantage
مزیت   اصلی   Trawin :
یک   آزمون   نیست .
یک   موتور   Trust   است .
داده ‌ هایی   که   به   مرور   جمع   می ‌ شوند :
عملکرد   واقعی
رفتار   توسعه
مسیر   رشد
نتایج   آزمون ‌ ها
دارایی   اصلی   پروژه   خواهند   بود .
---
70. Final Project Principles
این   اصول   نباید   شکسته   شوند :
---
Principle 1
کاربر   باید   با   مهارت   واقعی   شناخته   شود ،  نه   ادعا .
---
Principle 2
AI   باید   باعث   بهتر   شدن   انسان   شود ،  نه   حذف   انسان .
---
Principle 3
هر   تصمیم   فنی   باید   برای   رشد   آینده   آماده   باشد .
---
Principle 4
سادگی ،  امنیت   و   قابلیت   توسعه   اولویت   دارند .
---
Principle 5
Documentation   بخشی   از   محصول   است .
---
END OF TRAWIN MASTER PROJECT CONTEXT
Document Status:
Complete
Version:
1.0
Purpose:
Project Memory + AI Agent Context + Engineering Guide
---
امید ،  این  ۵  بخش   الان   یک   سند   پایه ‌ ای   هست   مثلا   شبیه   اینه ::
TRAWIN_MASTER_CONTEXT.md
می ‌ تواند   مثل  « حافظه   دائمی   پروژه »  داخل   ریپو   قرار   بگیرد   و   هر   AI   بعدی   قبل   از   کدنویسی   بخواند . 🚀
