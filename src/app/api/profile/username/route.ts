/**
 * GET /api/profile/username?u=omid → availability check (live, debounced)
 * POST /api/profile/username {username} → claim
 */

import {
  authenticate,
  handleAssessment,
  readJsonBody,
} from '@/lib/assessment/route-helpers'
import { ProfileService } from '@/services/profile.service'

export async function GET(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc } = await authenticate()
    const raw = new URL(request.url).searchParams.get('u') ?? ''
    if (raw.length === 0) return Response.json({ available: false, reason: 'نام کاربری را وارد کن.' })

    const service = new ProfileService(svc)
    const result = await service.checkUsernameAvailable(raw)
    return Response.json(result)
  })
}

export async function POST(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const body = await readJsonBody(request)
    if (typeof body.username !== 'string') {
      return Response.json({ error: 'نام کاربری الزامی است.' }, { status: 400 })
    }
    const service = new ProfileService(svc)
    const normalized = await service.claimUsername(appUserId, body.username)
    return Response.json({ ok: true, username: normalized })
  })
}
