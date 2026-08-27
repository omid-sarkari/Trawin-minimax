import Link from "next/link";

const NAV_LINKS = [
  { href: "#how", label: "چطور کار می‌کند" },
  { href: "#features", label: "ویژگی‌ها" },
  { href: "#companies", label: "برای شرکت‌ها" },
];

const CAPABILITIES = [
  "موتور سؤال تطبیقی",
  "۴ موتور رفتارشناسی",
  "رزومه Evidence-Based",
  "Monaco + Yjs Real-time",
];

const TERMINAL_LINES = [
  { text: "$ trawin run assessment --skill react --adaptive", tone: "cmd" as const },
  { text: "", tone: "gap" as const },
  { text: "▸ session #8f3a started · difficulty: medium → hard", tone: "dim" as const },
  { text: "✓ hooks/useState .................. passed   0.42s", tone: "pass" as const },
  { text: "✓ hooks/useEffect ................. passed   0.38s", tone: "pass" as const },
  { text: "✗ async/error-handling ............ failed   1.12s", tone: "fail" as const },
  { text: "⚠ paste-signal detected ........... review queued", tone: "warn" as const },
  { text: "", tone: "gap" as const },
  { text: "trust score 87% · confidence 92%", tone: "score" as const },
  { text: "next up: async patterns ×2 · difficulty ↑", tone: "score-dim" as const },
];

const STEPS = [
  {
    no: "01",
    title: "آزمون تطبیقی بده",
    desc: "سؤالات بر اساس عملکردت هوشمندانه سخت‌تر می‌شوند و از نقاط ضعف بیشتر پرسیده می‌شود — دقیقاً همان‌جایی که باید رشد کنی.",
  },
  {
    no: "02",
    title: "کد واقعی بنویس و اجرا کن",
    desc: "ویرایشگر حرفه‌ای Monaco با اجرای امن روی Judge0. در تراوین رفتار کدنویسی‌ات تحلیل می‌شود، نه فقط جواب نهایی.",
  },
  {
    no: "03",
    title: "رزومه زنده بگیر، استخدام شو",
    desc: "هر نتیجه یک مدرکِ قابل استناد می‌شود. شرکت‌ها بر اساس مهارت اثبات‌شده مستقیم به تو دعوت به چالش یا مصاحبه می‌کنند.",
  },
];

const FEATURES = [
  {
    tag: "ADAPTIVE",
    title: "موتور سؤال تطبیقی",
    desc: "سطح مهارت تو لحظه‌به‌لحظه تخمین زده می‌شود؛ سؤال بعدی بر اساس توان واقعی‌ات انتخاب می‌گردد، نه یک لیست ثابت.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    tag: "SIGNAL",
    title: "رفتارشناسی کدنویسی",
    desc: "چهار موتور تشخیص، الگوی تایپ، سرعت درج و paste ها را تحلیل می‌کنند تا اعتماد به هر نتیجه قابل اندازه‌گیری باشد.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    tag: "RESUME",
    title: "رزومه زنده",
    desc: "هر آزمون، مسابقه و پروژه بخشی از پروفایل اثبات‌محور تو می‌شود؛ بدون ارسال PDF، همیشه به‌روز.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    tag: "TEAM",
    title: "مسابقه تیمی Real-time",
    desc: "با Yjs و Monaco، تیم تو همزمان روی یک کد کار می‌کند؛ ادغام نسخه‌ها و شباهت‌سنجی در پایان مسابقه.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    tag: "LIVE",
    title: "مصاحبه زنده",
    desc: "اتاق مصاحبه با تصویر، صدا و کد مشترک؛ همه‌چیز در یک لینک، بدون خروج از پلتفرم.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    tag: "HIRE",
    title: "استخدام یکپارچه",
    desc: "شرکت‌ها بر اساس مهارت اثبات‌شده جستجو می‌کنند، چالش اختصاصی می‌سازند و گزارش اعتماد کامل دریافت می‌کنند.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

const COMPANY_BENEFITS = [
  "جستجو و فیلتر بر اساس مهارتِ اثبات‌شده و Trust Score",
  "آزمون اختصاصی تطبیقی برای نامزدهای خودتان",
  "گزارش رفتارشناسی و شفافیت استفاده از AI در هر چالش",
  "دعوت به مصاحبه زنده با کد مشترک — همه در یک پلتفرم",
];

function lineTone(tone: string): string {
  switch (tone) {
    case "cmd":
      return "text-zinc-200";
    case "pass":
      return "text-signal-400";
    case "fail":
      return "text-rose-400";
    case "warn":
      return "text-flag-400";
    case "score":
      return "font-semibold text-zinc-100";
    case "score-dim":
      return "text-zinc-500";
    default:
      return "text-zinc-500";
  }
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <nav className="glass-nav mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/10 px-5 shadow-lg shadow-black/30">
          <Link href="/" className="font-mono text-base font-semibold tracking-tight text-zinc-50">
            Trawin<span className="text-signal-500">.</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-full border border-white/10 px-4 text-sm text-zinc-300 transition-colors hover:border-white/25 hover:text-white sm:inline-flex"
            >
              ورود
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-full bg-signal-500 px-4 text-sm font-semibold text-zinc-950 transition-all hover:bg-signal-400"
            >
              شروع کنید
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center px-6 pb-24 pt-40 text-center">
        <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div
          className="glow-orb pointer-events-none absolute -top-32 right-[8%] -z-10 h-[420px] w-[420px] rounded-full bg-signal-500/[0.13] blur-[110px]"
          aria-hidden="true"
        />
        <div
          className="glow-orb pointer-events-none absolute left-[4%] top-[220px] -z-10 h-[360px] w-[360px] rounded-full bg-teal-500/[0.09] blur-[110px]"
          style={{ animationDelay: "3s" }}
          aria-hidden="true"
        />

        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-signal-500/25 bg-signal-500/[0.08] px-4 py-1.5 text-xs font-medium text-signal-300">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-500" />
          نسخه MVP · ارزیابی واقعی، بدون تعارف
        </span>

        <h1 className="animate-fade-up mt-7 max-w-3xl text-4xl font-bold leading-[1.25] tracking-tight text-zinc-50 sm:text-6xl sm:leading-[1.2]" style={{ animationDelay: "80ms" }}>
          رزومه جعل می‌شود.
          <br />
          <span className="text-gradient">مهارت هرگز.</span>
        </h1>

        <p className="animate-fade-up mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg sm:leading-9" style={{ animationDelay: "160ms" }}>
          Trawin توانایی واقعی برنامه‌نویس را با آزمون تطبیقی، اجرای کد واقعی و
          رفتارشناسی کدنویسی اثبات می‌کند و خروجی را به یک رزومه زنده تبدیل
          می‌کند — همان چیزی که شرکت‌ها واقعاً می‌خواهند ببینند.
        </p>

        <div className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-signal-500 px-7 text-sm font-semibold text-zinc-950 shadow-[0_0_36px_-10px] shadow-signal-500/70 transition-all hover:bg-signal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            شروع به‌عنوان برنامه‌نویس
          </Link>
          <a
            href="#companies"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-sm font-medium text-zinc-200 transition-colors hover:border-white/35 hover:bg-white/5"
          >
            استخدام از Trawin
          </a>
        </div>

        <ul className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-2.5" style={{ animationDelay: "320ms" }}>
          {CAPABILITIES.map((cap) => (
            <li
              key={cap}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-400"
            >
              {cap}
            </li>
          ))}
        </ul>

        {/* Terminal mockup */}
        <div className="animate-fade-up mx-auto mt-16 w-full max-w-3xl" style={{ animationDelay: "420ms" }}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c10]/90 text-left shadow-2xl shadow-black/60">
            <div dir="ltr" className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="ms-2 font-mono text-[11px] text-zinc-600">evaluation.log — live</span>
              <span className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-signal-500/25 bg-signal-500/10 px-2 py-0.5 font-mono text-[10px] text-signal-400">
                <span className="h-1 w-1 animate-pulse rounded-full bg-signal-400" />
                ADAPTIVE
              </span>
            </div>
            <div dir="ltr" className="space-y-1 px-5 py-5 font-mono text-[12.5px] leading-7">
              {TERMINAL_LINES.map((line, i) => (
                <p
                  key={i}
                  className={`animate-fade-up ${line.tone === "gap" ? "h-3" : ""} ${lineTone(line.tone)}`}
                  style={{ animationDelay: `${700 + i * 130}ms` }}
                >
                  {line.text || "\u00A0"}
                </p>
              ))}
              <p className="animate-fade-up caret text-zinc-500" style={{ animationDelay: `${700 + TERMINAL_LINES.length * 130}ms` }}>
                $
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-heading" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-xs tracking-widest text-signal-500">HOW IT WORKS</span>
            <h2 id="how-heading" className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              سه قدم تا اثبات مهارت
            </h2>
            <p className="mt-4 text-sm leading-8 text-zinc-400 sm:text-base">
              تراوین جایگزین چرخه خسته‌کننده «رزومه، مصاحبه تلفنی، تست فنی» است.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.no}
                className="animate-fade-up relative rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-signal-500/30 hover:bg-white/[0.05]"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="font-mono text-sm font-semibold text-signal-500">{step.no}</span>
                <h3 className="mt-3 text-lg font-semibold text-zinc-50">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-zinc-400">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-heading" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-xs tracking-widest text-signal-500">CAPABILITIES</span>
            <h2 id="features-heading" className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              یک موتور اعتماد، نه فقط یک سایت آزمون
            </h2>
            <p className="mt-4 text-sm leading-8 text-zinc-400 sm:text-base">
              هر جزء تراوین برای یک هدف ساخته شده: نتیجه‌ای که بشود به آن تکیه کرد.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <article
                key={feature.tag}
                className="animate-fade-up group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-signal-500/30 hover:bg-white/[0.05]"
                style={{ animationDelay: `${(i % 3) * 120}ms` }}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-signal-500/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-signal-500/20 bg-signal-500/10 text-signal-400">
                  {feature.icon}
                </span>
                <span className="mt-4 block font-mono text-[10px] tracking-widest text-zinc-600">
                  {feature.tag}
                </span>
                <h3 className="mt-1.5 text-lg font-semibold text-zinc-50">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section id="companies" aria-labelledby="companies-heading" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-signal-500/20 bg-gradient-to-b from-signal-500/[0.07] to-transparent p-8 md:p-14">
            <div
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-signal-500/15 blur-[90px]"
              aria-hidden="true"
            />
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <span className="font-mono text-xs tracking-widest text-signal-500">FOR COMPANIES</span>
                <h2 id="companies-heading" className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                  استخدام بدون حدس.
                </h2>
                <p className="mt-4 text-sm leading-8 text-zinc-400 sm:text-base">
                  به‌جای خواندن صدها رزومه‌ی ادعایی، توسعه‌دهندگانی را ببینید که
                  مهارتشان در تراوین اثبات شده است.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-signal-500 px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-signal-400"
                  >
                    ثبت‌نام شرکت
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-medium text-zinc-200 transition-colors hover:border-white/35 hover:bg-white/5"
                  >
                    ورود شرکت‌ها
                  </Link>
                </div>
              </div>

              <ul className="space-y-4">
                {COMPANY_BENEFITS.map((benefit, i) => (
                  <li
                    key={benefit}
                    className="animate-fade-up flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3.5 text-sm leading-7 text-zinc-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="mt-1.5 h-4 w-4 shrink-0 text-signal-400"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="animate-fade-up text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            اولین آزمونت را همین امروز بده.
          </h2>
          <p className="animate-fade-up mt-4 text-sm leading-8 text-zinc-400 sm:text-base" style={{ animationDelay: "100ms" }}>
            ۱۵ دقیقه وقت بگذار و ببین تراوین چه چیزی از مهارت واقعی‌ات می‌فهمد.
          </p>
          <div className="animate-fade-up mt-8" style={{ animationDelay: "200ms" }}>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-signal-500 px-8 text-sm font-semibold text-zinc-950 shadow-[0_0_36px_-10px] shadow-signal-500/70 transition-all hover:bg-signal-400"
            >
              شروع رایگان
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/5 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <span className="font-mono text-base font-semibold text-zinc-50">
                Trawin<span className="text-signal-500">.</span>
              </span>
              <p className="mt-3 max-w-xs text-sm leading-7 text-zinc-500">
                استاندارد جدید سنجش مهارت برنامه‌نویس؛ ارزیابی، مسابقه و استخدام
                بر پایه شواهد واقعی.
              </p>
              <p dir="ltr" className="mt-5 text-left font-mono text-[11px] leading-5 text-zinc-700">
                Next.js · Supabase · Monaco · Yjs · Judge0
              </p>
            </div>

            <nav aria-label="لینک‌های محصول">
              <h3 className="text-sm font-semibold text-zinc-200">محصول</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#how" className="text-zinc-500 transition-colors hover:text-zinc-200">چطور کار می‌کند</a></li>
                <li><a href="#features" className="text-zinc-500 transition-colors hover:text-zinc-200">ویژگی‌ها</a></li>
                <li><a href="#companies" className="text-zinc-500 transition-colors hover:text-zinc-200">برای شرکت‌ها</a></li>
              </ul>
            </nav>

            <nav aria-label="لینک‌های حساب">
              <h3 className="text-sm font-semibold text-zinc-200">حساب</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/login" className="text-zinc-500 transition-colors hover:text-zinc-200">ورود</Link></li>
                <li><Link href="/register" className="text-zinc-500 transition-colors hover:text-zinc-200">ثبت‌نام برنامه‌نویس</Link></li>
                <li><Link href="/register" className="text-zinc-500 transition-colors hover:text-zinc-200">ثبت‌نام شرکت</Link></li>
              </ul>
            </nav>

            <nav aria-label="لینک‌های حقوقی">
              <h3 className="text-sm font-semibold text-zinc-200">حقوقی</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><span className="cursor-default text-zinc-600">قوانین استفاده</span></li>
                <li><span className="cursor-default text-zinc-600">حریم خصوصی</span></li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-zinc-600 sm:flex-row">
            <p>© ۱۴۰۵ Trawin — تمام حقوق محفوظ است.</p>
            <p>ساخته‌شده در ایران، برای برنامه‌نویسان ایرانی.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
