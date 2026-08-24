'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Btn, Card, Field, cx, fetchJson, inputClass, useFlash } from '@/components/admin/ui'

interface Technology {
  id: number
  name: string
  slug: string
  category: string
  active: boolean | null
}
interface Skill {
  id: number
  technology_id: number
  parent_id: number | null
  name: string
  slug: string
  active: boolean | null
}
interface Tag {
  id: number
  name: string
  slug: string
}
interface Bootstrap {
  technologies: Technology[]
  skills: Skill[]
  tags: Tag[]
}

const TABS = [
  { key: 'technologies', label: 'تکنولوژی‌ها' },
  { key: 'skills', label: 'مهارت‌ها' },
  { key: 'tags', label: 'تگ‌ها' },
] as const

export default function AdminContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('technologies')
  const [data, setData] = useState<Bootstrap | null>(null)
  const { flash, run } = useFlash()

  const load = useCallback(() => fetchJson<Bootstrap>('/api/admin/bootstrap').then(setData).catch(() => {}), [])
  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              'rounded-full px-4 py-2 text-sm transition-colors',
              tab === t.key ? 'bg-signal-500/15 font-medium text-signal-300' : 'text-zinc-400 hover:bg-white/5'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {flash && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${flash.kind === 'error' ? 'border-rose-500/25 bg-rose-500/10 text-rose-300' : 'border-signal-500/25 bg-signal-500/10 text-signal-300'}`}>
          {flash.message}
        </div>
      )}

      {tab === 'technologies' && data && (
        <TechSection techs={data.technologies} onChange={load} run={run} />
      )}
      {tab === 'skills' && data && (
        <SkillsSection techs={data.technologies} skills={data.skills} onChange={load} run={run} />
      )}
      {tab === 'tags' && data && <TagsSection tags={data.tags} onChange={load} run={run} />}
    </div>
  )
}

type Runner = (fn: () => Promise<string | void>) => Promise<boolean>

function TechSection({
  techs,
  onChange,
  run,
}: {
  techs: Technology[]
  onChange: () => void
  run: Runner
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('language')

  const toggle = (t: Technology) =>
    run(async () => {
      await fetchJson('/api/admin/technologies', {
        method: 'PATCH',
        body: JSON.stringify({ id: t.id, active: !t.active }),
      })
      onChange()
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <ul className="divide-y divide-white/5">
          {techs.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-zinc-200">{t.name}</p>
                <p className="font-mono text-[11px] text-zinc-600" dir="ltr">{t.slug} · {t.category}</p>
              </div>
              <button onClick={() => toggle(t)}>
                <Badge tone={t.active ? 'signal' : 'zinc'}>{t.active ? 'فعال' : 'غیرفعال'}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="h-fit space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">تکنولوژی جدید</h3>
        <Field label="نام"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Vue.js" /></Field>
        <Field label="slug"><input dir="ltr" className={`${inputClass} text-left font-mono`} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="vue-js" /></Field>
        <Field label="دسته">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {['language', 'markup', 'styling', 'framework', 'runtime', 'tooling'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Btn
          className="w-full"
          onClick={() =>
            run(async () => {
              await fetchJson('/api/admin/technologies', { method: 'POST', body: JSON.stringify({ name, slug, category }) })
              setName(''); setSlug('')
              onChange()
              return 'تکنولوژی ساخته شد ✓'
            })
          }
        >
          ایجاد تکنولوژی
        </Btn>
      </Card>
    </div>
  )
}

function SkillsSection({
  techs,
  skills,
  onChange,
  run,
}: {
  techs: Technology[]
  skills: Skill[]
  onChange: () => void
  run: Runner
}) {
  const [technologyId, setTechnologyId] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const filtered = technologyId ? skills.filter((s) => s.technology_id === Number(technologyId)) : skills

  const toggle = (s: Skill) =>
    run(async () => {
      await fetchJson('/api/admin/skills', { method: 'PATCH', body: JSON.stringify({ id: s.id, active: !s.active }) })
      onChange()
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <Field label="فیلتر تکنولوژی">
          <select className={`${inputClass} mb-4`} value={technologyId} onChange={(e) => setTechnologyId(e.target.value)}>
            <option value="">همه</option>
            {techs.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </Field>
        <ul className="divide-y divide-white/5">
          {filtered.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-zinc-200">{s.name}</p>
                <p className="font-mono text-[11px] text-zinc-600" dir="ltr">
                  {techs.find((t) => t.id === s.technology_id)?.name} · {s.slug}{s.parent_id ? ` · parent:${s.parent_id}` : ''}
                </p>
              </div>
              <button onClick={() => toggle(s)}>
                <Badge tone={s.active ? 'signal' : 'zinc'}>{s.active ? 'فعال' : 'غیرفعال'}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="h-fit space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">مهارت جدید</h3>
        <Field label="تکنولوژی والد">
          <select className={inputClass} value={technologyId} onChange={(e) => setTechnologyId(e.target.value)}>
            <option value="">انتخاب کنید…</option>
            {techs.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </Field>
        <Field label="نام"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="React Performance" /></Field>
        <Field label="slug"><input dir="ltr" className={`${inputClass} text-left font-mono`} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="react-performance" /></Field>
        <Btn
          className="w-full"
          disabled={!technologyId}
          onClick={() =>
            run(async () => {
              await fetchJson('/api/admin/skills', {
                method: 'POST',
                body: JSON.stringify({ name, slug, technology_id: Number(technologyId) }),
              })
              setName(''); setSlug('')
              onChange()
              return 'مهارت ساخته شد ✓'
            })
          }
        >
          ایجاد مهارت
        </Btn>
      </Card>
    </div>
  )
}

function TagsSection({ tags, onChange, run }: { tags: Tag[]; onChange: () => void; run: Runner }) {
  const [name, setName] = useState('')
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        {tags.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">هنوز تگی ثبت نشده.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300" title={t.slug}>
                {t.name}
              </span>
            ))}
          </div>
        )}
      </Card>
      <Card className="h-fit space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">تگ جدید</h3>
        <Field label="نام"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="hooks" /></Field>
        <Btn
          className="w-full"
          onClick={() =>
            run(async () => {
              await fetchJson('/api/admin/tags', { method: 'POST', body: JSON.stringify({ name }) })
              setName('')
              onChange()
              return 'تگ ساخته شد ✓'
            })
          }
        >
          ایجاد تگ
        </Btn>
      </Card>
    </div>
  )
}
