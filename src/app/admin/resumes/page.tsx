'use client'

/**
 * Admin developer/resume search (p3.md §14) — server-backed, paginated.
 * Filters: query, role, status, assessment state. Opening a resume goes to
 * the full admin detail page (admin visibility ≠ company visibility).
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge, Btn, EmptyState, Pager, fetchJson, inputClass } from '@/components/admin/ui'

interface Row {
  id: string
  username: string | null
  role: string
  status: string
  createdAt: string | null
  profile: { full_name: string | null; headline: string | null; target_role: string | null } | null
  assessmentsCount: number
}

const ROLE_LABELS: Record<string, string> = { developer: 'دولوپر', company: 'شرکت', admin: 'ادمین' }
const STATUS_LABELS: Record<string, string> = { active: 'فعال', blocked: 'مسدود' }

export default function AdminResumesPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [hasAssessments, setHasAssessments] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: Row[]; total: number }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(page) })
    if (q.trim()) params.set('q', q.trim())
    if (role) params.set('role', role)
    if (status) params.set('status', status)
    if (hasAssessments) params.set('has_assessments', hasAssessments)

    fetchJson<{ items: Row[]; total: number }>(`/api/admin/resumes?${params}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'خطا'))
      .finally(() => setLoading(false))
  }, [q, role, status, hasAssessments, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5 pb-16">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-4">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="جستجوی نام کاربری یا نام…"
          className={`${inputClass} sm:col-span-2`}
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className={inputClass}>
          <option value="">همه نقش‌ها</option>
          <option value="developer">دولوپر</option>
          <option value="company">شرکت</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={inputClass}>
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="blocked">مسدود</option>
        </select>
        <select value={hasAssessments} onChange={(e) => { setHasAssessments(e.target.value); setPage(1) }} className={`${inputClass} sm:col-span-2`}>
          <option value="">آزمون: مهم نیست</option>
          <option value="1">دارای آزمون تکمیل‌شده</option>
          <option value="0">بدون آزمون</option>
        </select>
      </div>

      {error && <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-300">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState title="نتیجه‌ای پیدا نشد" desc="فیلترها را تغییر بده یا عبارت دیگری جستجو کن." />
      ) : (
        <>
          <ul className="space-y-2">
            {data.items.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/resumes/${row.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-colors hover:border-signal-500/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {row.profile?.full_name ?? row.username ?? '—'}
                      </p>
                      {row.username && (
                        <span className="font-mono text-[11px] text-zinc-600" dir="ltr">@{row.username}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500" dir="auto">
                      {row.profile?.headline ?? row.profile?.target_role ?? ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={row.role === 'admin' ? 'flag' : 'zinc'}>{ROLE_LABELS[row.role] ?? row.role}</Badge>
                    <Badge tone={row.status === 'active' ? 'signal' : 'rose'}>
                      {STATUS_LABELS[row.status] ?? row.status}
                    </Badge>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-400" dir="ltr">
                      {row.assessmentsCount} exam
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={page} total={data.total} pageSize={20} onPage={setPage} />
        </>
      )}
    </div>
  )
}
