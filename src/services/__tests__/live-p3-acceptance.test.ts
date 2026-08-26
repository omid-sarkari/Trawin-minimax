/**
 * LIVE p3 acceptance — onboarding → profile → living resume → visibility.
 * Runs ONLY with SUPABASE_SERVICE_ROLE_KEY present; CI skips otherwise.
 * Full cleanup after run.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { ProfileService } from '@/services/profile.service'
import { LivingResumeService } from '@/services/resume/living-resume.service'
import { EntitlementService } from '@/lib/profile/entitlements'
import { validateUsername } from '@/lib/profile/username-policy'
import { computeCompleteness } from '@/lib/profile/completeness'

const SVC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SVC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const d = SVC_URL && SVC_KEY ? describe : describe.skip

function svc() {
  return createSupabaseClient<Database>(SVC_URL!, SVC_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const STAMP = Date.now().toString(36)
let authUserId = ''
let appUserId = ''

d('LIVE p3 onboarding/resume acceptance', () => {
  afterAll(async () => {
    if (!appUserId) return
    const db = svc()
    await db.from('developer_resume_sections').delete().eq('user_id', appUserId)
    await db.from('user_plans').delete().eq('user_id', appUserId)
    await db.from('users').delete().eq('id', appUserId)
    if (authUserId) await db.auth.admin.deleteUser(authUserId)
  }, 30_000)

  test(
    'setup: real user via auth trigger',
    async () => {
      const db = svc()
      const { data: created, error } = await db.auth.admin.createUser({
        email: `p3-${STAMP}@trawin-local.test`,
        password: `pw-${STAMP}-Aa1!`,
        email_confirm: true,
      })
      expect(error).toBeNull()
      authUserId = created!.user!.id

      let id: string | null = null
      for (let i = 0; i < 10 && !id; i++) {
        await new Promise((r) => setTimeout(r, 300))
        const { data: u } = await db.from('users').select('id').eq('auth_user_id', authUserId).maybeSingle()
        id = u?.id ?? null
      }
      expect(id).toBeTruthy()
      appUserId = id!
    },
    30_000,
  )

  test(
    'new developer starts NOT onboarded',
    async () => {
      const db = svc()
      const service = new ProfileService(db)
      const state = await service.getOnboardingState(appUserId)
      expect(state.completed).toBe(false)
    },
    20_000,
  )

  test(
    'username policy: reserved + invalid rejected, claim works, duplicate rejected',
    async () => {
      const db = svc()
      const service = new ProfileService(db)

      expect(validateUsername('admin').ok).toBe(false)
      expect(validateUsername('ab').ok).toBe(false)
      expect(validateUsername('Bad Space').ok).toBe(false)

      const username = `dev${STAMP}`
      const normalized = await service.claimUsername(appUserId, username.toUpperCase())
      expect(normalized).toBe(username.toLowerCase())

      // Duplicate (case-insensitive) is refused even for a different user row.
      const { data: other } = await db.auth.admin.createUser({
        email: `p3b-${STAMP}@trawin-local.test`,
        password: 'x-Aa1!2345',
        email_confirm: true,
      })
      try {
        let otherId: string | null = null
        for (let i = 0; i < 10 && !otherId; i++) {
          await new Promise((r) => setTimeout(r, 300))
          const { data: u } = await db
            .from('users')
            .select('id')
            .eq('auth_user_id', other!.user!.id)
            .maybeSingle()
          otherId = u?.id ?? null
        }
        await expect(service.claimUsername(otherId!, username)).rejects.toThrow()
      } finally {
        if (other?.user) await db.auth.admin.deleteUser(other.user.id)
      }
    },
    60_000,
  )

  test(
    'onboarding steps persist + finalize flips the flag once',
    async () => {
      const db = svc()
      const service = new ProfileService(db)

      const { data: techs } = await db.from('technologies').select('id').limit(1)
      const techId = techs?.[0]?.id ?? null

      await service.saveOnboardingStep(appUserId, 'intent', { intents: ['find_job'] }, false)
      let state = await service.getOnboardingState(appUserId)
      expect(state.completed).toBe(false)
      expect((state.data.intents as string[])).toEqual(['find_job'])

      await service.saveOnboardingStep(
        appUserId,
        'final',
        {
          intents: ['find_job', 'verified_resume'],
          primaryTechnologyId: techId,
          targetRole: 'Frontend Developer',
          experienceLevel: 'junior',
          workPreference: ['remote', 'full_time'],
        },
        true,
      )
      state = await service.getOnboardingState(appUserId)
      expect(state.completed).toBe(true)
      expect(state.profile?.target_role).toBe('Frontend Developer')
      expect(state.profile?.work_preference).toEqual(['remote', 'full_time'])
    },
    30_000,
  )

  test(
    'profile edit updates canonical fields',
    async () => {
      const db = svc()
      const service = new ProfileService(db)
      await service.updateProfile(appUserId, {
        fullName: 'تست تراوین',
        headline: 'Frontend Developer | React',
        bio: 'این بیوگرافی تستی برای بررسی کامل بودن رزومه است و بیش از چهل کاراکتر است.',
        experienceYears: 3,
      })
      const state = await service.getOnboardingState(appUserId)
      expect(state.profile?.headline).toContain('React')
      expect(state.profile?.experience_years).toBe(3)
    },
    20_000,
  )

  test(
    'resume derives completeness + custom sections; company view strips private fields',
    async () => {
      const db = svc()

      // Custom section (developer-owned).
      const { data: section, error: sectionError } = await db
        .from('developer_resume_sections')
        .insert({
          user_id: appUserId,
          kind: 'project',
          title: 'فروشگاه آنلاین',
          content: { description: 'Next.js + Tailwind' },
          managed_by: 'developer',
        })
        .select('id')
        .single()
      expect(sectionError).toBeNull()

      const service = new LivingResumeService(db)
      const dev = await service.build(appUserId, 'developer', { includeHiddenSections: true })

      expect(dev.sections.some((s) => s.title === 'فروشگاه آنلاین')).toBe(true)
      expect(dev.completeness.percent).toBeGreaterThan(0)
      // No completed assessments yet → these MUST be reported missing.
      expect(dev.completeness.missing.map((m) => m.key)).toContain('first_assessment')
      expect(dev.completeness.missing.map((m) => m.key)).toContain('verified_skill')
      // Self-reported + custom content already satisfied.
      expect(dev.completeness.met).toContain('custom_section')
      expect(dev.username).toBeTruthy()

      // Completeness model sanity directly:
      const direct = computeCompleteness({
        avatarUrl: null,
        headline: 'x',
        bio: null,
        username: 'u',
        primaryTechnologyId: 1,
        workPreference: ['remote'],
        experienceYears: 2,
        hasCustomSection: true,
        completedAssessments: 0,
        verifiedSkills: 0,
      })
      expect(direct.missing.map((m) => m.key)).toContain('first_assessment')

      // Company view must not leak private analytics/completeness.
      const company = await service.build(appUserId, 'company')
      expect(company.completeness).toBeUndefined()
      expect(company.allowedSections['private_analytics']).toBe(false)
      expect(company.allowedSections['behavior_signals']).toBe(false)

      // Toggle rule off for company profile section → payload unchanged shape but flag off.
      await db
        .from('resume_visibility_rules')
        .update({ enabled: false })
        .eq('view_type', 'company')
        .eq('section_key', 'verified_skills')
      const companyAfter = await service.build(appUserId, 'company')
      expect(companyAfter.allowedSections['verified_skills']).toBe(false)

      // Restore default.
      await db
        .from('resume_visibility_rules')
        .update({ enabled: true })
        .eq('view_type', 'company')
        .eq('section_key', 'verified_skills')

      void section
    },
    40_000,
  )

  test(
    'entitlement service grants and revokes pro cleanly',
    async () => {
      const db = svc()
      const entitlements = new EntitlementService(db)

      expect((await entitlements.getPlan(appUserId)).plan).toBe('free')

      await entitlements.setPlan(appUserId, 'pro', null)
      expect((await entitlements.getPlan(appUserId)).plan).toBe('pro')
      expect(await entitlements.has('advanced_analytics', appUserId)).toBe(true)

      await entitlements.setPlan(appUserId, 'free', null)
      expect((await entitlements.getPlan(appUserId)).plan).toBe('free')
      expect(await entitlements.has('advanced_analytics', appUserId)).toBe(false)
    },
    30_000,
  )
})
