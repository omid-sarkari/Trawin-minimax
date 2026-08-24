import { assertAdmin, withAdmin } from '@/lib/admin/guard'
import { createServiceClient } from '@/lib/admin/service-client'

export async function GET() {
  return withAdmin(async () => {
    await assertAdmin()
    const svc = createServiceClient()

    const [techs, skills, tags, qCount, uCount, eCount] = await Promise.all([
      svc.from('technologies').select('*').order('id'),
      svc.from('skills').select('*').order('id'),
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
