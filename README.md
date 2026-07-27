# Trawin

> پلتفرم ارزیابی، مسابقه و استخدام برنامه‌نویسان

Trawin یک پلتفرم فارسی برای **ارزیابی مهارت واقعی برنامه‌نویسی** است. برخلاف پلتفرم‌های آموزشی، Trawin آموزش نمی‌دهد — فقط تست، مسابقه و استخدام.

---

## 🎯 چشم‌انداز

مطمئن‌ترین پلتفرم ارزیابی مهارت برنامه‌نویسی در ایران و فارسی‌زبان. جایی که:

- هر شرکتی با اطمینان برنامه‌نویس استخدام کند.
- هر برنامه‌نویسی مسیر شغلی‌اش را شفاف ببیند.
- هیچ رزومه‌ای دروغ نباشد.

---

## ✨ ویژگی‌های کلیدی

- **آزمون‌های متنوع** — چهارجوابی، جاخالی، کدی، پرسشی
- **مسابقات تیمی real-time** — Monaco + Yjs، هر عضو با رنگ اختصاصی
- **رفتارشناسی کدنویسی (Behavior Intelligence)** — تشخیص استفاده از AI، اعتماد به نفس، الگوی زمانی
- **رزومه زنده** — هر آزمون، مسابقه و پروژه = بخشی از رزومه
- **استخدام یکپارچه** — فیلتر، دعوت به مسابقه، مصاحبه زنده
- **پروژه‌های پولی واقعی** — ۸۵٪ به برنده، ۱۵٪ به پلتفرم
- **ضد تقلب** — OpenProctor (تصویری) + JPlag (شباهت کد) + Behavior Intelligence

---

## 🛠️ Tech Stack

| لایه | تکنولوژی |
|---|---|
| Frontend / Backend | **Next.js 16** (App Router) |
| زبان | **TypeScript** |
| استایل | **Tailwind CSS v4** |
| Database / Auth / Realtime | **Supabase** (PostgreSQL) |
| Code Editor | Monaco + Yjs |
| Code Execution | Judge0 |
| Plagiarism Detection | JPlag |
| Video Interview | LiveKit |
| Proctoring | OpenProctor |

---

## 📁 ساختار پروژه

```
Trawin-minimax/
├── src/
│   ├── app/                  # Next.js App Router (pages, layouts, route handlers)
│   │   ├── layout.tsx        # ریشه‌ی لایه + فونت وزیرمتن + RTL
│   │   └── page.tsx          # صفحه‌ی اصلی
│   ├── components/           # کامپوننت‌های مشترک UI
│   ├── lib/
│   │   └── supabase/         # کلاینت‌های Supabase (client, server, middleware)
│   ├── services/             # لایه‌ی سرویس (Judge0, JPlag, LiveKit, ...)
│   ├── hooks/                # هوک‌های React
│   └── types/                # تایپ‌های دامنه و دیتابیس
├── supabase/                 # مایگریشن‌ها + seed
├── public/                   # فایل‌های استاتیک
├── middleware.ts             # رفرش سشن Supabase
├── .env.example              # نمونه‌ی env vars
└── package.json
```

---

## 🚀 شروع سریع

### ۱. کلون و نصب

```bash
git clone https://github.com/omid-sarkari/Trawin-minimax.git
cd Trawin-minimax
npm install
```

### ۲. تنظیم env

```bash
cp .env.example .env.local
# مقادیر Supabase، Judge0، LiveKit را پر کن
```

### ۳. اجرا

```bash
npm run dev
# http://localhost:3000
```

---

## 📜 اسکریپت‌ها

| دستور | کار |
|---|---|
| `npm run dev` | اجرای dev server |
| `npm run build` | بیلد production |
| `npm start` | اجرای production |
| `npm run lint` | ESLint |
| `npm run type-check` | tsc --noEmit |

---

## 🗺️ وضعیت فعلی (MVP)

- [x] راه‌اندازی Next.js 16 + TypeScript + Tailwind v4
- [x] ساختار پوشه‌ها و کلاینت‌های Supabase
- [ ] احراز هویت (Supabase Auth)
- [ ] پروفایل کاربر
- [ ] آزمون (سوالات چهارجوابی، کدی، پرسشی)
- [ ] مسابقه فردی و تیمی
- [ ] Judge0 integration
- [ ] Behavior Intelligence layer
- [ ] رزومه زنده
- [ ] چت
- [ ] پنل شرکت

> مستند کامل معماری در `docs/trawin-architecture.md` (در ریپوی اصلی Supabase migrations).

---

## 🤝 مشارکت

در حال حاضر پروژه خصوصی است. برای مشارکت با مالک تماس بگیرید.

---

ساخته‌شده با ❤️ برای جامعه‌ی برنامه‌نویسان فارسی‌زبان
