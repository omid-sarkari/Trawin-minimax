'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Btn,
  EmptyState,
  Field,
  Pager,
  fetchJson,
  inputClass,
  useFlash,
} from '@/components/admin/ui'
import {
  DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  QUESTION_STATUSES,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
} from '@/lib/admin/question-contracts'

interface QuestionRow {
  id: number
  slug: string
  type: string
  difficulty: number | null
  status: string | null
  title: string
  latest_version: number | null
  updated_at: string | null
}

interface Bootstrap {
  technologies: Array<{ id: number; name: string }>
  skills: Array<{ id: number; technology_id: number; name: string }>
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' })

export default function AdminQuestionsPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [items, setItems] = useState<QuestionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { flash, run } = useFlash()

  const [filters, setFilters] = useState({
    q: '',
    technology_id: '',
    skill_id: '',
    difficulty: '',
    type: '',
    status: '',
  })
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    fetchJson<Bootstrap>('/api/admin/bootstrap').then(setBootstrap).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 350)
    return () => clearTimeout(t)
  }, [filters.q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedQ) params.set('q', debouncedQ)
      if (filters.technology_id) params.set('technology_id', filters.technology_id)
      if (filters.skill_id) params.set('skill_id', filters.skill_id)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.type) params.set('type', filters.type)
      if (filters.status) params.set('status', filters.status)
      params.set('page', String(page))
      const data = await fetchJson<{ items: QuestionRow[]; total: number }>(`/api/admin/questions?${params}`)
      setItems(data.items)
      setTotal(data.total)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, filters.technology_id, filters.skill_id, filters.difficulty, filters.type, filters.status, page])

  useEffect(() => {
    load()
  }, [load])

  const filteredSkills = bootstrap
    ? bootstrap.skills.filter((s) =>
        filters.technology_id ? s.technology_id === Number(filters.technology_id) : true
      )
    : []

  const act = (id: number, action: string, extra: Record<string, unknown> = {}) =>
    run(async () => {
      await fetchJson('/api/admin/questions', {
        method: 'PATCH',
        body: JSON.stringify({ id, action, ...extra }),
      })
      await load()
      return 'انجام شد ✓'
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <input
            placeholder="جستجوی slug…"
            className={`${inputClass} w-52`}
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className={`${inputClass} w-40`}
            value={filters.technology_id}
            onChange={(e) => setFilters((f) => ({ ...f, technology_id: e.target.value, skill_id: '' }))}
          >
            <option value="">همه تکنولوژی‌ها</option>
            {(bootstrap?.technologies ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            className={`${inputClass} w-44`}
            value={filters.skill_id}
            onChange={(e) => setFilters((f) => ({ ...f, skill_id: e.target.value }))}
          >
            <option value="">همه مهارت‌ها</option>
            {filteredSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            className={`${inputClass} w-32`}
            value={filters.difficulty}
            onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
          >
            <option value="">سختی</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
          <select
            className={`${inputClass} w-36`}
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">همه انواع</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            className={`${inputClass} w-32`}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">همه وضعیت‌ها</option>
            {QUESTION_STATUSES.map((s) => (
              <option key={s} value={s}>{QUESTION_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Link href="/admin/questions/new">
          <Btn>+ سؤال جدید</Btn>
        </Link>
      </div>

      {flash && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${flash.kind === 'error' ? 'border-rose-500/25 bg-rose-500/10 text-rose-300' : 'border-signal-500/25 bg-signal-500/10 text-signal-300'}`}>
          {flash.message}
        </div>
      )}

      {!loading && items.length === 0 ? (
        <EmptyState title="سؤالی یافت نشد" desc="فیلترها را تغییر دهید یا اولین سؤال را بسازید." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[860px] text-right text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">عنوان</th>
                <th className="px-4 py-3 font-medium">نوع</th>
                <th className="px-4 py-3 font-medium">سختی</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">نسخه</th>
                <th className="px-4 py-3 font-medium">آخرین تغییر</th>
                <th className="px-4 py-3 font-medium">اکشن‌ها</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="truncate font-medium text-zinc-200">{row.title}</p>
                    <p className="truncate font-mono text-[11px] text-zinc-600" dir="ltr">{row.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{QUESTION_TYPE_LABELS[row.type as keyof typeof QUESTION_TYPE_LABELS] ?? row.type}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.difficulty && row.difficulty >= 4 ? 'rose' : row.difficulty === 3 ? 'flag' : 'signal'}>
                      {DIFFICULTY_LABELS[row.difficulty ?? 0] ?? '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={row.status === 'published' ? 'signal' : row.status === 'archived' ? 'zinc' : 'flag'}>
                      {QUESTION_STATUS_LABELS[row.status as keyof typeof QUESTION_STATUS_LABELS] ?? row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500" dir="ltr">v{row.latest_version ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {row.updated_at ? dateFormatter.format(new Date(row.updated_at)) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.status !== 'published' && (
                        <button onClick={() => act(row.id, 'set-status', { status: 'published' })} className="text-xs text-signal-400 hover:text-signal-300">
                          انتشار
                        </button>
                      )}
                      {row.status === 'published' && (
                        <button onClick={() => act(row.id, 'set-status', { status: 'draft' })} className="text-xs text-flag-300 hover:text-flag-400">
                          بازگشت به پیش‌نویس
                        </button>
                      )}
                      <Link href={`/admin/questions/${row.id}`} className="text-xs text-zinc-400 hover:text-zinc-200">
                        جزئیات
                      </Link>
                      <button onClick={() => act(row.id, 'duplicate')} className="text-xs text-zinc-500 hover:text-zinc-300">
                        کپی
                      </button>
                    </div>
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
