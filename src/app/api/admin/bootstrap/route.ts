import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

export async function GET(request: Request) {
  return withAdmin(async () => {
    await assertAdmin()
    const svc = createServiceClient()
    const includeInactive =
      new URL(request.url).searchParams.get('include_inactive') === '1'

    const techsQuery = svc.from('technologies').select('*').order('id')
    const skillsQuery = svc.from('skills').select('*').order('id')
    if (!includeInactive) {
      techsQuery.eq('active', true)
      skillsQuery.eq('active', true)
    }

    const [techs, skills, tags, qCount, uCount, eCount] = await Promise.all([
      techsQuery,
      skillsQuery,
      svc.from('question_tags').select('*').order('id'),
      svc.from('questions').select('id', { count: 'exact', head: true }),
      svc.from('users').select('id', { count: 'exact', head: true }),
      svc.from('exams').select('id', { count: 'exact', head: true }),
    ])

    const firstError = [techs.error, skills.error, tags.error].find(Boolean)
    if (firstError) throw new Error(firstError.message)

    return {
      technologies: techs.data ?? [],
      skills: skills.data ?? [],
      tags: tags.data ?? [],
      counts: {
        questions: qCount.count ?? 0,
        users: uCount.count ?? 0,
        exams: eCount.count ?? 0,
      },
    }
  })
}
