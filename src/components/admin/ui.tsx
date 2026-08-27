'use client'

import { useState } from 'react'

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'خطای سرور')
  return data as T
}

export function Btn({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft' }) {
  const styles = {
    primary: 'bg-signal-500 text-zinc-950 hover:bg-signal-400 font-semibold',
    ghost: 'border border-white/15 text-zinc-300 hover:border-white/35 hover:bg-white/5',
    danger: 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
    soft: 'border border-signal-500/25 bg-signal-500/10 text-signal-300 hover:bg-signal-500/15',
  }
  return (
    <button
      {...props}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  )
}

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  )
}

export function Badge({ tone = 'zinc', children }: { tone?: 'zinc' | 'signal' | 'flag' | 'rose'; children: React.ReactNode }) {
  const tones = {
    zinc: 'border-white/10 bg-white/5 text-zinc-400',
    signal: 'border-signal-500/30 bg-signal-500/10 text-signal-300',
    flag: 'border-flag-500/30 bg-flag-500/10 text-flag-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  }
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-white/10 bg-white/[0.03] p-6', className)}>{children}</div>
}

export function Alert({ kind, message }: { kind: 'error' | 'success'; message: string }) {
  return (
    <div
      className={cx(
        'rounded-lg border px-3 py-2 text-sm leading-6',
        kind === 'error'
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
          : 'border-signal-500/25 bg-signal-500/10 text-signal-300'
      )}
    >
      {message}
    </div>
  )
}

export function useFlash() {
  const [flash, setFlash] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const run = async (fn: () => Promise<string | void>) => {
    setFlash(null)
    try {
      const msg = await fn()
      if (msg) setFlash({ kind: 'success', message: msg })
      return true
    } catch (err) {
      setFlash({ kind: 'error', message: err instanceof Error ? err.message : 'خطا' })
      return false
    }
  }
  return { flash, run, clear: () => setFlash(null) }
}

const fa = new Intl.NumberFormat('fa-IR')

export function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-zinc-50" dir="ltr">
        {typeof value === 'number' ? fa.format(value) : value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-signal-400">{hint}</p>}
    </Card>
  )
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="mt-1.5 text-xs leading-6 text-zinc-600">{desc}</p>
    </div>
  )
}

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Btn variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} className="h-8 px-3 text-xs">
        قبلی
      </Btn>
      <span className="font-mono text-xs text-zinc-500" dir="ltr">
        {page} / {pages}
      </span>
      <Btn variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} className="h-8 px-3 text-xs">
        بعدی
      </Btn>
    </div>
  )
}
