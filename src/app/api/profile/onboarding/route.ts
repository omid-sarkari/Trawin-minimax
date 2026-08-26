/**
 * GET  → onboarding state (resume support)
 * POST → persist one step or finalize the wizard (p3.md §3-§7)
 */

import {
  authenticate,
  handleAssessment,
  readJsonBody,
} from '@/lib/assessment/route-helpers'
import { ProfileService } from '@/services/profile.service'

export async function GET(): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const service = new ProfileService(svc)
    const state = await service.getOnboardingState(appUserId)
    return Response.json(state)
  })
}

export async function POST(request: Request): Promise<Response> {
  return handleAssessment(async () => {
    const { svc, appUserId } = await authenticate()
    const body = await readJsonBody(request)
    const stepKey = typeof body.step === 'string' ? body.step.slice(0, 40) : 'unknown'
    const finalize = body.finalize === true

    const service = new ProfileService(svc)
    await service.saveOnboardingStep(
      appUserId,
      stepKey,
      {
        intents: Array.isArray(body.intents) ? (body.intents as string[]) : undefined,
        primaryTechnologyId:
          body.primary_technology_id !== undefined
            ? Number(body.primary_technology_id)
            : undefined,
        targetRole: typeof body.target_role === 'string' ? body.target_role : undefined,
        experienceLevel: typeof body.experience_level === 'string' ? body.experience_level : undefined,
        workPreference: Array.isArray(body.work_preference)
          ? (body.work_preference as string[])
          : undefined,
      },
      finalize,
    )
    const state = await service.getOnboardingState(appUserId)
    return Response.json(state)
  })
}
