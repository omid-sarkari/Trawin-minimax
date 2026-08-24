import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'
import {
  QUESTION_STATUSES,
  QUESTION_TYPES,
  validateContentByType,
  type QuestionStatus,
  type QuestionType,
} from '@/lib/admin/question-contracts'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const url = new URL(request.url)
    const svc = createServiceClient()

    const q = url.searchParams.get('q')?.trim()
    const difficulty = Number(url.searchParams.get('difficulty'))
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const skillId = Number(url.searchParams.get('skill_id'))
    const technologyId = Number(url.searchParams.get('technology_id'))
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)

    let query = svc
      .from('questions')
      .select(
        'id, slug, type, difficulty, status, created_at, updated_at, question_versions(version, title, created_at), question_skills(skill_id, weight)',
        { count: 'exact' }
      )
      .order('id', { ascending: false })

    if (q) query = query.ilike('slug', `%${q}%`)
    if (Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 5) {
      query = query.eq('difficulty', difficulty)
    }
    if (QUESTION_TYPES.includes(type as QuestionType)) query = query.eq('type', type)
    if (QUESTION_STATUSES.includes(status as QuestionStatus)) query = query.eq('status', status)

    if (Number.isInteger(skillId) && skillId > 0) {
      const { data: qs } = await svc.from('question_skills').select('question_id').eq('skill_id', skillId)
      const ids = (qs ?? []).map((r: { question_id: number }) => r.question_id)
      if (ids.length === 0) return { items: [], total: 0, page, pageSize: PAGE_SIZE }
      query = query.in('id', ids)
    } else if (Number.isInteger(technologyId) && technologyId > 0) {
      const { data: skills } = await svc.from('skills').select('id').eq('technology_id', technologyId)
      const skillIds = (skills ?? []).map((s: { id: number }) => s.id)
      if (skillIds.length === 0) return { items: [], total: 0, page, pageSize: PAGE_SIZE }
      const { data: qs } = await svc.from('question_skills').select('question_id').in('skill_id', skillIds)
      const ids = [...new Set((qs ?? []).map((r: { question_id: number }) => r.question_id))]
      if (ids.length === 0) return { items: [], total: 0, page, pageSize: PAGE_SIZE }
      query = query.in('id', ids)
    }

    const { data, error, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (error) throw new Error(error.message)

    interface RawVersion { title: string; version: number }
    interface RawSkill { skill_id: number }
    const rows = (data ?? []) as Array<{
      id: number; slug: string; type: string; difficulty: number | null
      status: string | null; created_at: string | null; updated_at: string | null
      question_versions: RawVersion[] | null
      question_skills: RawSkill[] | null
    }>

    return {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        type: row.type,
        difficulty: row.difficulty,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        title: row.question_versions?.slice(-1)[0]?.title ?? row.slug,
        latest_version: row.question_versions?.slice(-1)[0]?.version ?? null,
        skill_ids: (row.question_skills ?? []).map((s) => s.skill_id),
      })),
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    }
  })
}

export async function POST(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const svc = createServiceClient()

    const slug = String(body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    if (slug.length < 3) throw new Error('slug حداقل ۳ کاراکتر و معتبر باشد.')
    if (!QUESTION_TYPES.includes(body.type)) throw new Error('نوع سؤال نامعتبر است.')
    const difficulty = Number(body.difficulty)
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)
      throw new Error('سختی باید عددی بین ۱ تا ۵ باشد.')

    const contentError = validateContentByType(body.type, body.content)
    if (contentError) throw new Error(contentError)

    const { data: dup } = await svc.from('questions').select('id').eq('slug', slug).maybeSingle()
    if (dup) throw new Error('این slug قبلاً استفاده شده است.')

    const status: QuestionStatus = QUESTION_STATUSES.includes(body.status) ? body.status : 'draft'

    const { data: question, error } = await svc
      .from('questions')
      .insert({ slug, type: body.type, difficulty, status })
      .select('*')
      .single()
    if (error) throw new Error(error.message)

    try {
      const { error: vError } = await svc.from('question_versions').insert({
        question_id: question.id,
        version: 1,
        title: String(body.title ?? '').trim() || slug,
        description: body.description ?? null,
        content: body.content ?? {},
        test_cases: body.test_cases ?? null,
        language: body.language ?? null,
      })
      if (vError) throw new Error(vError.message)

      const weights = body.skill_weights as Record<string, number> | undefined
      if (weights && typeof weights === 'object' && Object.keys(weights).length > 0) {
        const rows = Object.entries(weights).map(([skillId, weight]) => ({
          question_id: question.id,
          skill_id: Number(skillId),
          weight: Math.max(0, Math.min(1, Number(weight))),
        }))
        for (const row of rows) {
          if (!Number.isInteger(row.skill_id) || row.skill_id <= 0)
            throw new Error('شناسه مهارت نامعتبر است.')
        }
        const { error: sError } = await svc.from('question_skills').insert(rows)
        if (sError) throw new Error(sError.message)
      }

      const tagIds = (body.tag_ids ?? []) as Array<string | number>
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        const tagRows = tagIds.map((t) => ({ question_id: question.id, tag_id: Number(t) }))
        const { error: tError } = await svc.from('question_tag_map').insert(tagRows)
        if (tError) throw new Error(tError.message)
      }
    } catch (err) {
      await svc.from('questions').delete().eq('id', question.id).eq('status', 'draft')
      throw err
    }

    return { question }
  })
}

export async function PATCH(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const body = await request.json()
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) throw new Error('شناسه نامعتبر است.')
    const svc = createServiceClient()

    if (body.action === 'set-status') {
      const status = body.status
      if (!QUESTION_STATUSES.includes(status)) throw new Error('وضعیت نامعتبر است.')
      const { data, error } = await svc
        .from('questions')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return { question: data }
    }

    if (body.action === 'duplicate') {
      const { data: orig } = await svc
        .from('questions')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (!orig) throw new Error('سؤال یافت نشد.')
      const { data: ver } = await svc
        .from('question_versions')
        .select('*')
        .eq('question_id', id)
        .order('version', { ascending: false })
        .limit(1)
      const latest = ver?.[0]
      const { data: skills } = await svc
        .from('question_skills')
        .select('skill_id, weight')
        .eq('question_id', id)
      const { data: tags } = await svc
        .from('question_tag_map')
        .select('tag_id')
        .eq('question_id', id)

      const newSlug = `${orig.slug}-copy-${Date.now().toString(36)}`
      const { data: copy, error } = await svc
        .from('questions')
        .insert({ slug: newSlug, type: orig.type, difficulty: orig.difficulty, status: 'draft' })
        .select('*')
        .single()
      if (error) throw new Error(error.message)

      if (latest) {
        await svc.from('question_versions').insert({
          question_id: copy.id,
          version: 1,
          title: latest.title,
          description: latest.description,
          content: latest.content,
          test_cases: latest.test_cases,
          language: latest.language,
        })
      }
      if ((skills ?? []).length > 0) {
        await svc
          .from('question_skills')
          .insert((skills as Array<{ skill_id: number; weight: number | null }>).map((s) => ({
            question_id: copy.id,
            skill_id: s.skill_id,
            weight: s.weight,
          })))
      }
      if ((tags ?? []).length > 0) {
        await svc
          .from('question_tag_map')
          .insert((tags as Array<{ tag_id: number }>).map((t) => ({ question_id: copy.id, tag_id: t.tag_id })))
      }
      return { question: copy }
    }

    throw new Error('اکشن پشتیبانی نمی‌شود.')
  })
}
