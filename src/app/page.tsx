import Link from "next/link";

const features = [
  {
    tag: "EVAL",
    title: "آزمون و ارزیابی",
    desc: "چهارجوابی، جاخالی، کدی، پرسشی. موتور ارزیابی نسخه‌بندی‌شده.",
    accent: "signal" as const,
  },
  {
    tag: "TEAM",
    title: "مسابقه تیمی real-time",
    desc: "Monaco + Yjs. هر عضو با رنگ اختصاصی. ادغام و JPlag در پایان.",
    accent: "signal" as const,
  },
  {
    tag: "SIGNAL",
    title: "رفتارشناسی کدنویسی",
    desc: "snapshot از کد، event های مهم، تشخیص استفاده از AI.",
    accent: "flag" as const,
  },
  {
    tag: "RESUME",
    title: "رزومه زنده",
    desc: "هر آزمون، مسابقه و پروژه = بخشی از رزومه. کاربر هیچ‌وقت رزومه نمی‌فرستد.",
    accent: "signal" as const,
  },
  {
    tag: "HIRE",
    title: "استخدام یکپارچه",
    desc: "فیلتر بر اساس شهر، مهارت، نمره تیمی، رهبری، نظم. دعوت به مسابقه و مصاحبه زنده.",
    accent: "signal" as const,
  },
  {
    tag: "PAID",
    title: "پروژه پولی واقعی",
    desc: "۸۵٪ به برنده، ۱۵٪ به پلتفرم. ۵+ خروجی برای کارفرما.",
    accent: "signal" as const,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-20 sm:py-28">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-signal-200 bg-signal-50 px-3 py-1 font-mono text-xs tracking-wide text-signal-700 dark:border-signal-900 dark:bg-signal-900/30 dark:text-signal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-500" />
            Trawin · v0.1.0 · MVP
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            مطمئن‌ترین پلتفرم ارزیابی، مسابقه و استخدام برنامه‌نویسان
          </h1>
          <p className="max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-400">
            Trawin فقط ارزیابی می‌کند. بدون آموزش، بدون تعارف.
            <br />
            رزومه زنده، رفتارشناسی کدنویسی، مسابقه تیمی real-time و استخدام یکپارچه.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              شروع به‌عنوان برنامه‌نویس
            </Link>
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              استخدام از Trawin
            </Link>
          </div>
        </section>

        {/* نمونهٔ خروجی ارزیابی */}
        <section aria-label="نمونه خروجی ارزیابی" className="mx-auto w-full max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0b0d] shadow-xl shadow-black/10">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="ms-2 font-mono text-[11px] text-zinc-500">evaluation.log</span>
            </div>
            <div dir="ltr" className="space-y-2.5 px-5 py-5 font-mono text-xs leading-relaxed">
              <p className="border-s-2 border-signal-500 ps-3 text-zinc-300">
                <span className="text-signal-400">✓</span> 4/4 tests passed · React Hooks · 00:42
              </p>
              <p className="border-s-2 border-signal-500 ps-3 text-zinc-300">
                <span className="text-signal-400">✓</span> lint clean · 0 warnings
              </p>
              <p className="border-s-2 border-flag-500 ps-3 text-zinc-300">
                <span className="text-flag-400">⚠</span> AI-assist signal: 12%
              </p>
              <p className="border-s-2 border-signal-500 ps-3 text-zinc-300">
                <span className="text-signal-400">✓</span> team rank: 2 / 18
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span
                className={`absolute inset-x-0 top-0 h-0.5 ${
                  f.accent === "signal" ? "bg-signal-500" : "bg-flag-500"
                }`}
              />
              <span
                className={`font-mono text-[11px] tracking-widest ${
                  f.accent === "signal"
                    ? "text-signal-600 dark:text-signal-400"
                    : "text-flag-600 dark:text-flag-400"
                }`}
              >
                {f.tag}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {f.desc}
              </p>
            </div>
          ))}
        </section>

        <footer className="border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          ساخته‌شده با Next.js · Supabase · Monaco · Yjs · Judge0
        </footer>
      </main>
    </div>
  );
}