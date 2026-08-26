/**
 * Living Resume service (p3.md §9-§10, §19-§20, §42).
 *
 * DERIVED, never copied: verified evidence is read live from
 * evaluations / skill_scores / exam_sessions; self-reported content lives
 * in profiles + developer_resume_sections and is NEVER presented as
 * verified.
 *
 * Visibility rules (resume_visibility_rules) are enforced here — the
 * server returns only authorized sections per view type (§25).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { AssessmentError } from '@/lib/assessment/errors'
import {
  loadVisibilityRules,
  type ResumeViewType,
  type VisibilityRule,
} from '@/lib/profile/visibility'
import { computeCompleteness } from '@/lib/profile/completeness'

type Db = SupabaseClient<Database>

export interface ResumeSectionEntry {
  id: number
  kind: string
  title: string
  subtitle: string | null
  content: Record<string, unknown>
  isVisible: boolean
  displayOrder: number
  managedBy: 'developer' | 'admin'
}

export type SkillVerificationLevel = 'none' | 'emerging' | 'verified' | 'expert'

export interface VerifiedSkill {
  skillId: number
  name: string
  score: number | null
  confidence: number | null
  /** Kept for backward compatibility (number of scored evaluations). */
  evidenceCount: number
  /** Evidence-based verification level from the decision-engine policy. */
  level: SkillVerificationLevel
  levelLabel: string
  verified: boolean
  evidence: {
    gradedQuestions: number
    correctRate: number
    completedExams: number
    projects: number
  }
}

export interface SkillInsights {
  strengths: Array<{ name: string; score: number; rating: number | null; confidence: number | null }>
  weaknesses: Array<{ name: string; score: number; rating: number | null; uncertainty: number | null; note: string }>
  summary: string
}

export interface DeveloperResume {
  userId: string
  username: string | null
  fullName: string | null
  avatarUrl: string | null
  headline: string | null
  bio: string | null
  country: string | null
  experienceYears: number | null
  targetRole: string | null
  primaryTechnologyId: number | null
  primaryTechnologyName: string | null
  workPreference: string[]
  plan: 'free' | 'pro'
  status: string
  stats: { totalAssessments: number; averageScore: number; bestScore: number }
  verifiedSkills: VerifiedSkill[]
  sections: ResumeSectionEntry[]
  recentEvaluations: Array<{ id: string; score: number | null; level: string | null; at: string | null }>
  completeness: ReturnType<typeof computeCompleteness>
  allowedSections: Record<string, boolean>
  /** PRO-only per-skill strengths/weaknesses (§12) — absent on other views. */
  insights?: SkillInsights
}

/** Fallback policy — used only if the engine tables are unreachable. */
const DEFAULT_POLICY = {
  verified: { min_graded_questions: 200, min_completed_exams: 5, min_projects: 3, min_score: 70 },
  emerging: { min_graded_questions: 30, min_completed_exams: 1, min_score: 50 },
  labels: {
    none: 'بدون شواهد کافی',
    emerging: 'در حال شکل‌گیری',
    verified: 'تأییدشده',
    expert: 'تأییدشده · پیشرفته',
  } as Record<SkillVerificationLevel, string>,
}

export class LivingResumeService {
  constructor(private db: Db) {}

  /** Full assembly for one user; `view` decides what survives filtering. */
  async build(
    targetAppUserId: string,
    view: ResumeViewType,
    opts: { includeHiddenSections?: boolean } = {},
  ): Promise<DeveloperResume> {
    const [profileRes, userRes, evalsRes, skillsRes, sectionsRes] = await Promise.all([
      this.db
        .from('profiles')
        .select(
          `full_name, avatar_url, headline, bio, country, experience_years,
           target_role, work_preference, primary_technology_id, onboarding_completed`
        )
        .eq('user_id', targetAppUserId)
        .maybeSingle(),
      this.db
        .from('users')
        .select('username, status')
        .eq('id', targetAppUserId)
        .maybeSingle(),
      this.db
        .from('evaluations')
        .select('id, overall_score, level, created_at')
        .eq('user_id', targetAppUserId)
        .order('created_at', { ascending: false })
        .limit(50),
      this.db
        .from('skill_scores')
        .select('score, confidence, skill_id, skills(name), evaluations!inner(user_id)')
        .eq('evaluations.user_id', targetAppUserId),
      this.db
        .from('developer_resume_sections')
        .select('*')
        .eq('user_id', targetAppUserId)
        .order('display_order', { ascending: true }),
    ])

    if (profileRes.error) throw new AssessmentError('INTERNAL_ERROR', `resume/profile: ${profileRes.error.message}`)
    if (userRes.error) throw new AssessmentError('INTERNAL_ERROR', `resume/user: ${userRes.error.message}`)
    if (evalsRes.error) throw new AssessmentError('INTERNAL_ERROR', `resume/evals: ${evalsRes.error.message}`)
    if (skillsRes.error) throw new AssessmentError('INTERNAL_ERROR', `resume/skills: ${skillsRes.error.message}`)
    if (sectionsRes.error) throw new AssessmentError('INTERNAL_ERROR', `resume/sections: ${sectionsRes.error.message}`)

    const profile = profileRes.data as Record<string, unknown> | null
    const user = userRes.data as { username: string | null; status: string } | null
    if (!user) throw new AssessmentError('SESSION_NOT_FOUND', 'کاربر پیدا نشد.')

    // ---- Canonical verified evidence -----------------------------------
    const evaluations = evalsRes.data ?? []
    const scores = evaluations
      .map((e) => e.overall_score)
      .filter((s): s is number => typeof s === 'number')

    const skillAgg = new Map<number, { name: string; scores: number[]; confidences: number[] }>()
    type SkillScoreJoin = {
      score: number | null
      confidence: number | null
      skill_id: number
      skills: { name: string } | Array<{ name: string }> | null
    }
    for (const row of (skillsRes.data ?? []) as unknown as SkillScoreJoin[]) {
      const skillInfo = Array.isArray(row.skills) ? row.skills[0] : row.skills
      const entry = skillAgg.get(row.skill_id) ?? {
        name: skillInfo?.name ?? `skill-${row.skill_id}`,
        scores: [],
        confidences: [],
      }
      if (typeof row.score === 'number') entry.scores.push(row.score)
      if (typeof row.confidence === 'number') entry.confidences.push(row.confidence)
      skillAgg.set(row.skill_id, entry)
    }

    // ---- Evidence engine: policy + per-skill counts (decision tables) ----
    const [policy, evidenceBySkill] = await Promise.all([
      this.loadVerificationPolicy(),
      this.collectEvidence(targetAppUserId),
    ])

    const verifiedSkills: VerifiedSkill[] = [...skillAgg.entries()]
      .map(([skillId, e]) => {
        const score =
          e.scores.length > 0
            ? Math.round((e.scores.reduce((a, b) => a + b, 0) / e.scores.length) * 10) / 10
            : null
        const ev = evidenceBySkill.get(skillId) ?? {
          gradedQuestions: 0,
          correctCount: 0,
          completedExams: 0,
        }
        const projects = evidenceBySkill.get(-1)?.projectCount ?? 0
        const level = computeVerificationLevel(score, ev.gradedQuestions, ev.completedExams, projects, policy)
        return {
          skillId,
          name: e.name,
          score,
          confidence:
            e.confidences.length > 0
              ? Math.round((e.confidences.reduce((a, b) => a + b, 0) / e.confidences.length) * 100) / 100
              : null,
          evidenceCount: e.scores.length,
          level,
          levelLabel: policy.labels[level],
          verified: level === 'verified' || level === 'expert',
          evidence: {
            gradedQuestions: ev.gradedQuestions,
            correctRate:
              ev.gradedQuestions > 0
                ? Math.round((ev.correctCount / ev.gradedQuestions) * 100)
                : 0,
            completedExams: ev.completedExams,
            projects,
          },
        }
      })
      .sort((a, b) => Number(b.verified) - Number(a.verified) || (b.score ?? 0) - (a.score ?? 0))

    // ---- Custom sections -------------------------------------------------
    const allSections = (sectionsRes.data ?? []) as Array<Record<string, unknown>>
    const visibleSections: ResumeSectionEntry[] = allSections
      .filter((s) => opts.includeHiddenSections || s.is_visible === true)
      .map((s) => ({
        id: Number(s.id),
        kind: String(s.kind),
        title: String(s.title),
        subtitle: (s.subtitle as string) ?? null,
        content: (s.content ?? {}) as Record<string, unknown>,
        isVisible: s.is_visible === true,
        displayOrder: Number(s.display_order ?? 0),
        managedBy: s.managed_by === 'admin' ? 'admin' : 'developer',
      }))

    // ---- Visibility gate (server-side, §25) ------------------------------
    const rules = await loadVisibilityRules(this.db, view)

    // Privacy-critical floors: even if a rule were misconfigured these can
    // never reach non-owner views (§36 internal-intelligence protection).
    const PRIVACY_FLOORS: Record<string, boolean> = {
      contact_info: view !== 'company' && view !== 'pro',
      private_analytics: false,
      behavior_signals: false,
    }

    const allowed: Record<string, boolean> = {}
    for (const rule of rules.values()) {
      const floor = PRIVACY_FLOORS[rule.section_key]
      allowed[rule.section_key] = floor === undefined ? rule.enabled : rule.enabled && floor
    }

    const primaryTechName = await this.primaryTechnologyName(profile)
    const plan = await this.readPlan(targetAppUserId)

    const base: DeveloperResume = {
      userId: targetAppUserId,
      username: user.username,
      fullName: str(profile?.full_name),
      avatarUrl: str(profile?.avatar_url),
      headline: str(profile?.headline),
      bio: allowed.bio ? str(profile?.bio) : null,
      country: str(profile?.country),
      experienceYears: num(profile?.experience_years),
      targetRole: str(profile?.target_role),
      primaryTechnologyId: profile?.primary_technology_id != null ? Number(profile.primary_technology_id) : null,
      primaryTechnologyName: primaryTechName,
      workPreference: Array.isArray(profile?.work_preference) ? (profile!.work_preference as string[]) : [],
      plan,
      status: user.status,
      stats: {
        totalAssessments: evaluations.length,
        averageScore:
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      },
      verifiedSkills,
      sections: visibleSections,
      recentEvaluations: evaluations.slice(0, 8).map((e) => ({
        id: e.id,
        score: e.overall_score,
        level: e.level,
        at: e.created_at,
      })),
      completeness: computeCompleteness({
        avatarUrl: str(profile?.avatar_url),
        headline: str(profile?.headline),
        bio: str(profile?.bio),
        username: user.username,
        primaryTechnologyId:
          profile?.primary_technology_id != null ? Number(profile.primary_technology_id) : null,
        workPreference: Array.isArray(profile?.work_preference)
          ? (profile!.work_preference as string[])
          : [],
        experienceYears: num(profile?.experience_years),
        hasCustomSection: allSections.length > 0,
        completedAssessments: evaluations.length,
        verifiedSkills: verifiedSkills.filter((s) => s.verified).length,
      }),
      allowedSections: {},
    }

    // PRO-only per-skill insights (§12) — never on company view.
    if (view === 'developer' && plan === 'pro') {
      base.insights = this.buildInsights(verifiedSkills)
    }

    // Company view: strip private fields entirely before returning (§25).
    if (view === 'company') {
      return {
        ...base,
        bio: allowed.bio ? base.bio : null,
        workPreference: [],
        sections: allowed.sections_custom ? base.sections.filter((s) => s.isVisible) : [],
        recentEvaluations: allowed.assessments ? base.recentEvaluations : [],
        completeness: undefined as unknown as DeveloperResume['completeness'],
        allowedSections: allowed,
      }
    }

    base.allowedSections = allowed
    return base
  }

  private async readPlan(appUserId: string): Promise<'free' | 'pro'> {
    const { data } = await this.db
      .from('user_plans')
      .select('ends_at, plans!inner(code, active)')
      .eq('user_id', appUserId)
      .maybeSingle()
    if (!data) return 'free'
    const row = data as unknown as { ends_at: string | null; plans: { code: string; active: boolean } }
    const expired = row.ends_at ? new Date(row.ends_at).getTime() < Date.now() : false
    return row.plans.active && !expired && row.plans.code === 'pro' ? 'pro' : 'free'
  }

  /**
   * Loads the ACTIVE verification policy from the decision-engine tables
   * (evaluation_rules → rule_versions). Admin edits append versions; the
   * latest one always wins. Falls back to safe defaults on any gap.
   */
  async loadVerificationPolicy(): Promise<
    typeof DEFAULT_POLICY & { version: number }
  > {
    try {
      const { data: rule } = await this.db
        .from('evaluation_rules')
        .select('id')
        .eq('name', 'skill_verification')
        .eq('active', true)
        .maybeSingle()
      if (!rule) return { ...DEFAULT_POLICY, version: 0 }

      const { data: rv } = await this.db
        .from('rule_versions')
        .select('version, conditions, actions')
        .eq('rule_id', rule.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!rv) return { ...DEFAULT_POLICY, version: 0 }

      const conditions = (rv.conditions ?? {}) as Record<string, Record<string, number>>
      return {
        version: Number(rv.version),
        verified: { ...DEFAULT_POLICY.verified, ...(conditions.verified ?? {}) },
        emerging: { ...DEFAULT_POLICY.emerging, ...(conditions.emerging ?? {}) },
        labels: { ...DEFAULT_POLICY.labels },
      }
    } catch {
      return { ...DEFAULT_POLICY, version: 0 }
    }
  }

  /**
   * Per-skill evidence counts from CANONICAL data:
   *  - graded questions mapped to the skill (answers × question_skills)
   *  - distinct completed exam sessions touching the skill
   * Plus a global project counter (key −1) over visible custom sections.
   */
  private async collectEvidence(
    appUserId: string,
  ): Promise<Map<number, { gradedQuestions: number; correctCount: number; completedExams: number; projectCount?: number }>> {
    const map = new Map<number, { gradedQuestions: number; correctCount: number; completedExams: number; projectCount?: number }>()

    // Graded question counts — single indexed join, no N+1.
    const { data: skillRows, error: skillErr } = await this.db
      .from('question_skills')
      .select(
        `skill_id,
         answers!inner(id, is_correct, exam_sessions!inner(id, user_id, status))`
      )
      .eq('answers.exam_sessions.user_id', appUserId)

    if (!skillErr) {
      type JoinRow = {
        skill_id: number
        answers: Array<{ id: number; is_correct: boolean | null; exam_sessions: Array<{ id: string; status: string | null }> | { id: string; status: string | null } }>
      }
      for (const row of (skillRows ?? []) as unknown as JoinRow[]) {
        const entry = map.get(row.skill_id) ?? { gradedQuestions: 0, correctCount: 0, completedExams: 0 }
        const sessionIds = new Set<string>()
        for (const a of row.answers ?? []) {
          entry.gradedQuestions += 1
          if (a.is_correct === true) entry.correctCount += 1
          const es = Array.isArray(a.exam_sessions) ? a.exam_sessions[0] : a.exam_sessions
          if (es?.status === 'completed') sessionIds.add(es.id)
        }
        entry.completedExams += sessionIds.size
        map.set(row.skill_id, entry)
      }
    }

    // Approved project evidence (visible projects/competitions).
    const { count } = await this.db
      .from('developer_resume_sections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', appUserId)
      .eq('is_visible', true)
      .in('kind', ['project', 'competition'])

    map.set(-1, { gradedQuestions: 0, correctCount: 0, completedExams: 0, projectCount: count ?? 0 })
    return map
  }

  /** PRO insights: strengths vs weaknesses with actionable notes. */
  private buildInsights(skills: VerifiedSkill[]): SkillInsights {
    const scored = skills.filter((s) => s.score !== null)
    const strengths = scored
      .filter((s) => (s.score ?? 0) >= 80)
      .slice(0, 5)
      .map((s) => ({ name: s.name, score: s.score!, rating: s.confidence, confidence: s.confidence }))
    const weaknesses = scored
      .filter((s) => (s.score ?? 100) < 60)
      .slice(0, 5)
      .map((s) => ({
        name: s.name,
        score: s.score!,
        rating: s.confidence,
        uncertainty: s.confidence,
        note:
          s.evidence.gradedQuestions < 30
            ? 'شواهد کافی نیست؛ با آزمون‌های بیشتر این حوزه را دقیق بسنج.'
            : 'نمره پایین روی حجم قابل توجهی از سؤالات — نیاز به تمرین هدفمند.',
      }))

    const summary =
      strengths.length === 0 && weaknesses.length === 0
        ? 'هنوز داده کافی برای تحلیل مهارت جمع نشده است.'
        : `قوی در ${strengths.length} حوزه و نیازمند تمرین در ${weaknesses.length} حوزه.`
    return { strengths, weaknesses, summary }
  }

  private async primaryTechnologyName(profile: Record<string, unknown> | null): Promise<string | null> {
    const techId = profile?.primary_technology_id
    if (techId == null) return null
    const { data } = await this.db
      .from('technologies')
      .select('name')
      .eq('id', Number(techId))
      .maybeSingle()
    return data?.name ?? null
  }
}

/**
 * Pure policy evaluation — unit-testable, deterministic (§34).
 * `expert` = verified thresholds exceeded by a wide margin.
 */
export function computeVerificationLevel(
  score: number | null,
  gradedQuestions: number,
  completedExams: number,
  projects: number,
  policy: typeof DEFAULT_POLICY,
): SkillVerificationLevel {
  if (score === null) return 'none'
  const v = policy.verified
  const e = policy.emerging

  if (
    score >= v.min_score + 15 &&
    gradedQuestions >= v.min_graded_questions * 2 &&
    projects >= v.min_projects + 2
  ) {
    return 'expert'
  }
  if (
    score >= v.min_score &&
    gradedQuestions >= v.min_graded_questions &&
    completedExams >= v.min_completed_exams &&
    projects >= v.min_projects
  ) {
    return 'verified'
  }
  if (
    score >= e.min_score &&
    gradedQuestions >= e.min_graded_questions &&
    completedExams >= e.min_completed_exams
  ) {
    return 'emerging'
  }
  return 'none'
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}
function num(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}
