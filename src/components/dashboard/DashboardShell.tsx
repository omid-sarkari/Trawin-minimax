'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function DashboardShell({
  title,
  navItems,
  userLabel,
  subtitle,
  avatarUrl,
  planBadge,
  children,
}: {
  title: string;
  navItems: NavItem[];
  userLabel: string;
  subtitle?: string;
  /** Developer's chosen avatar — shown in the header when provided. */
  avatarUrl?: string | null;
  /** Optional plan chip, e.g. "PRO" (§12). */
  planBadge?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const { AuthService } = await import('@/services/auth.service');
    try {
      await new AuthService().signOut();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-white/5 bg-[#0a0a10]/70 p-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="mb-8 px-2 font-mono text-base font-semibold tracking-tight text-zinc-50">
          Trawin<span className="text-signal-500">.</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label={title}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border border-signal-500/20 bg-signal-500/10 font-medium text-signal-300'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/5 pt-5">
          <div className="flex items-center gap-3 px-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-500">
                {(userLabel || '؟').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-600">{userLabel}</p>
              {planBadge && (
                <span className="mt-0.5 inline-block rounded-full border border-signal-500/40 bg-signal-500/15 px-1.5 py-px font-mono text-[9px] font-bold text-signal-300" dir="ltr">
                  {planBadge}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-rose-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[#06060a]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-10">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-50">{title}</h1>
              {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3 lg:hidden">
              {planBadge && (
                <span className="rounded-full border border-signal-500/40 bg-signal-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-signal-300" dir="ltr">
                  {planBadge}
                </span>
              )}
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full border border-white/10 object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-500">
                  {(userLabel || '؟').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <span className="font-mono text-sm font-semibold text-zinc-50 hidden xl:inline">
              Trawin<span className="text-signal-500">.</span>
            </span>
          </div>
          <nav aria-label={title} className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs transition-colors ${
                    active
                      ? 'bg-signal-500/15 font-medium text-signal-300'
                      : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="ms-auto whitespace-nowrap rounded-full px-4 py-1.5 text-xs text-zinc-500 hover:text-rose-300"
            >
              خروج
            </button>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
