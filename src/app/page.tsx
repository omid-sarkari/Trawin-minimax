import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-20 sm:py-28">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
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
              href="/signup"
              className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              شروع به‌عنوان برنامه‌نویس
            </Link>
            <Link
              href="/company"
              className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              استخدام از Trawin
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "آزمون و ارزیابی",
              desc: "چهارجوابی، جاخالی، کدی، پرسشی. موتور ارزیابی نسخه‌بندی‌شده.",
            },
            {
              title: "مسابقه تیمی real-time",
              desc: "Monaco + Yjs. هر عضو با رنگ اختصاصی. ادغام و JPlag در پایان.",
            },
            {
              title: "رفتارشناسی کدنویسی",
              desc: "snapshot از کد، event های مهم، تشخیص استفاده از AI.",
            },
            {
              title: "رزومه زنده",
              desc: "هر آزمون، مسابقه و پروژه = بخشی از رزومه. کاربر هیچ‌وقت رزومه نمی‌فرستد.",
            },
            {
              title: "استخدام یکپارچه",
              desc: "فیلتر بر اساس شهر، مهارت، نمره تیمی، رهبری، نظم. دعوت به مسابقه و مصاحبه زنده.",
            },
            {
              title: "پروژه پولی واقعی",
              desc: "۸۵٪ به برنده، ۱۵٪ به پلتفرم. ۵+ خروجی برای کارفرما.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
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
