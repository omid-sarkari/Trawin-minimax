'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Btn, EmptyState, Pager, cx, fetchJson, inputClass, useFlash } from '@/components/admin/ui'

interface UserRow {
  id: string
  auth_user_id: string | null
  username: string | null
  role: string
  status: string
  created_at: string | null
  profiles: Array<{ full_name: string | null; email: string | null }> | null
}

const ROLE_LABELS: Record<string, string> = { developer: 'برنامه‌نویس', company: 'شرکت', admin: 'ادمین' }
const STATUS_TONES: Record<string, 'signal' | 'flag' | 'rose' | 'zinc'> = {
  active: 'signal',
  pending: 'flag',
  inactive: 'zinc',
  suspended: 'rose',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  pending: 'در انتظار',
  inactive: 'غیرفعال',
  suspended: 'مسدود',
}
const dateFormatter = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' })

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const { flash, run } = useFlash()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedQ) params.set('q', debouncedQ)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      params.set('page', String(page))
      const data = await fetchJson<{ items: UserRow[]; total: number }>(`/api/admin/users?${params}`)
      setItems(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, role, status, page])

  useEffect(() => {
    load()
  }, [load])

  const patchUser = (id: string, patch: Record<string, unknown>) =>
    run(async () => {
      await fetchJson('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) })
      await load()
      return 'به‌روزرسانی شد ✓'
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <input placeholder="جستجوی نام کاربری…" className={`${inputClass} w-56`} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputClass} w-40`} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">همه نقش‌ها</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className={`${inputClass} w-36`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <span className="ms-auto text-xs text-zinc-600">مجموع: {total}</span>
      </div>

      {flash && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${flash.kind === 'error' ? 'border-rose-500/25 bg-rose-500/10 text-rose-300' : 'border-signal-500/25 bg-signal-500/10 text-signal-300'}`}>
          {flash.message}
        </div>
      )}

      {!loading && items.length === 0 ? (
        <EmptyState title="کاربری یافت نشد" desc="فیلترها را تغییر دهید." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[820px] text-right text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">کاربر</th>
                <th className="px-4 py-3 font-medium">ایمیل</th>
                <th className="px-4 py-3 font-medium">نقش</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">عضویت</th>
                <th className="px-4 py-3 font-medium">اکشن‌ها</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{u.profiles?.[0]?.full_name ?? u.username ?? '—'}</p>
                    <p className="font-mono text-[11px] text-zinc-600" dir="ltr">@{u.username ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400" dir="ltr">{u.profiles?.[0]?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                      className={cx('rounded-md border bg-black/30 px-2 py-1 text-xs',
                        u.role === 'admin' ? 'border-signal-500/40 text-signal-300' : 'border-white/10 text-zinc-300')}
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONES[u.status] ?? 'zinc'}>{STATUS_LABELS[u.status] ?? u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {u.created_at ? dateFormatter.format(new Date(u.created_at)) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'suspended' || u.status === 'inactive' ? (
                      <Btn variant="soft" className="h-8 px-3 text-xs" onClick={() => patchUser(u.id, { status: 'active' })}>
                        رفع مسدودی
                      </Btn>
                    ) : (
                      <Btn variant="danger" className="h-8 px-3 text-xs" onClick={() => patchUser(u.id, { status: 'suspended' })}>
                        مسدودسازی
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} total={total} pageSize={20} onPage={setPage} />
    </div>
  )
}
