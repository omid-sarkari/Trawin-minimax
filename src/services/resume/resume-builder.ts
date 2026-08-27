import type { SupabaseClient } from '@supabase/supabase-js'

export type ResumeVersion = 'basic' | 'detailed' | 'pro'

const MAX_SKILLS: Record<ResumeVersion, number> = { basic: 10, detailed: 50, pro: 100 }
const USER_TYPE: Record<ResumeVersion, string> = { basic: 'user_basic', detailed: 'user_detailed', pro: 'user_pro' }
const COMPANY_TYPE: Record<ResumeVersion, string> = { basic: 'company_basic', detailed: 'company_detailed', pro: 'company_pro' }
const COMPANY_SHOWS_AI_USAGE: Record<ResumeVersion, boolean> = { basic: false, detailed: true, pro: true }
const COMPANY_SHOWS_BEHAVIOR: Record<ResumeVersion, boolean> = { basic: false, detailed: false, pro: true }

interface ProfileRow {
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  country: string | null
  experience_years: number | null
}

interface EvaluationRow {
  id: string
  overall_score: number | null
  level: string | null
  confidence: number | null
  created_at: string | null
}

interface SkillScoreRow {
  score: number | null
  skill_id: number
  skills: { name: string; slug: string } | Array<{ name: string; slug: string }> | null
  evaluations: { created_at: string | null } | Array<{ created_at: string | null }> | null
}

function firstOrNull<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

interface CodingSessionRow {
  id: string
  language: string | null
  behavior_state: unknown
  started_at: string | null
}

interface AssembledResume {
  personalInfo: Record<string, unknown>
  summary: string
  skills: Array<{ id: string; name: string; category: string; proficiency: number; evidenceCount: number; lastAssessedAt: string | null; verified: boolean }>
  stats: { totalAssessments: number; averageScore: number; bestScore: number; recentScores: number[] }
  recentActivity: Array<Record<string, unknown>>
  assessmentHistory: Record<string, unknown>
  languages: Record<string, { challengesCompleted: number; avgCleanSessionScore: number; lastUsedAt: string | null }>
  trustScore: Record<string, unknown>
  growthTimeline: Array<Record<string, unknown>>
  recommendations: string[]
  behaviorInsights: Record<string, unknown>
  aiUsage: Record<string, unknown>
}

export interface BuiltResume {
  type: string
  id: string
  userId: string
  version: ResumeVersion
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

type QueryResult = { error: { message: string } | null }

function average(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100
}

function stdDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  return Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function behaviorOf(state: unknown): { ensembleScore: number; flags: string[] } {
  if (state && typeof state === 'object' && !Array.isArray(state)) {
    const record = state as Record<string, unknown>
    return {
      ensembleScore: typeof record.ensembleScore === 'number' ? clamp01(record.ensembleScore) : 0,
      flags: Array.isArray(record.flags) ? record.flags.filter((f): f is string => typeof f === 'string') : []
    }
  }
  return { ensembleScore: 0, flags: [] }
}

function trustLevel(score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (score >= 85) return 'expert'
  if (score >= 70) return 'advanced'
  if (score >= 50) return 'intermediate'
  return 'beginner'
}

function qualityTrend(scoresAsc: number[]): 'improving' | 'stable' | 'declining' {
  if (scoresAsc.length < 4) return 'stable'
  const mid = Math.floor(scoresAsc.length / 2)
  const delta = average(scoresAsc.slice(mid)) - average(scoresAsc.slice(0, mid))
  if (delta > 5) return 'improving'
  if (delta < -5) return 'declining'
  return 'stable'
}

export class ResumeBuilderService {
  constructor(private supabase: SupabaseClient) {}

  async buildUserResume(userId: string, version: ResumeVersion = 'basic'): Promise<BuiltResume> {
    const assembled = await this.assemble(userId)
    const base = this.baseRecord(USER_TYPE[version], userId, version)

    if (version === 'basic') {
      return {
        ...base,
        contactInfo: {},
        personalInfo: assembled.personalInfo,
        summary: assembled.summary,
        topSkills: assembled.skills.slice(0, MAX_SKILLS.basic),
        stats: assembled.stats,
        recentActivity: assembled.recentActivity
      }
    }

    const detailed = {
      ...base,
      contactInfo: {},
      personalInfo: assembled.personalInfo,
      summary: assembled.summary,
      topSkills: assembled.skills.slice(0, MAX_SKILLS.detailed),
      stats: assembled.stats,
      recentActivity: assembled.recentActivity,
      skills: assembled.skills.slice(0, MAX_SKILLS.detailed),
      assessmentHistory: assembled.assessmentHistory,
      codingPerformance: { totalChallenges: Object.values(assembled.languages).reduce((sum, l) => sum + l.challengesCompleted, 0), languages: assembled.languages },
      trustScore: assembled.trustScore,
      growthTimeline: assembled.growthTimeline.slice(0, 20),
      recommendations: assembled.recommendations
    }

    if (version === 'detailed') return detailed

    return {
      ...detailed,
      type: USER_TYPE.pro,
      skills: assembled.skills.slice(0, MAX_SKILLS.pro),
      topSkills: assembled.skills.slice(0, MAX_SKILLS.pro),
      behaviorInsights: assembled.behaviorInsights,
      aiUsage: assembled.aiUsage,
      peerComparison: null
    }
  }

  async buildCompanyResume(userId: string, companyId?: string, jobId?: string, version: ResumeVersion = 'basic'): Promise<BuiltResume> {
    const assembled = await this.assemble(userId)
    const base = this.baseRecord(COMPANY_TYPE[version], userId, version)

    const quickAssessment = {
      summary: assembled.summary,
      trustLevel: trustLevel(assembled.stats.averageScore),
      totalAssessments: assembled.stats.totalAssessments
    }

    if (version === 'basic') {
      return {
        ...base,
        companyId: companyId ?? null,
        jobId: jobId ?? null,
        keySkills: assembled.skills.slice(0, MAX_SKILLS.basic),
        stats: assembled.stats,
        quickAssessment
      }
    }

    const detailed = {
      ...base,
      companyId: companyId ?? null,
      jobId: jobId ?? null,
      keySkills: assembled.skills.slice(0, MAX_SKILLS.detailed),
      skills: assembled.skills.slice(0, MAX_SKILLS.detailed),
      stats: assembled.stats,
      quickAssessment,
      assessmentHistory: assembled.assessmentHistory,
      codingPerformance: { totalChallenges: Object.values(assembled.languages).reduce((sum, l) => sum + l.challengesCompleted, 0), languages: assembled.languages },
      trustScore: assembled.trustScore,
      aiUsage: COMPANY_SHOWS_AI_USAGE[version] ? assembled.aiUsage : undefined,
      jobFit: null
    }

    if (version === 'detailed') return detailed

    return {
      ...detailed,
      type: COMPANY_TYPE.pro,
      behaviorInsights: COMPANY_SHOWS_BEHAVIOR.pro ? assembled.behaviorInsights : undefined,
      verification: { verified: true, checkedAt: base.createdAt },
      riskAssessment: { flagsSummary: assembled.behaviorInsights.flaggedSessionsRatio ?? 0 }
    }
  }

  private async assemble(userId: string): Promise<AssembledResume> {
    const [profileRes, evaluationsRes, skillScoresRes, sessionsRes] = await Promise.all([
      this.supabase.from('profiles').select('full_name, bio, avatar_url, country, experience_years').eq('user_id', userId).maybeSingle(),
      this.supabase.from('evaluations').select('id, overall_score, level, confidence, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
      this.supabase.from('skill_scores').select('score, skill_id, skills(name, slug), evaluations!inner(user_id, created_at)').eq('evaluations.user_id', userId),
      this.supabase.from('coding_sessions').select('id, language, behavior_state, started_at').eq('user_id', userId).order('started_at', { ascending: false }).limit(200)
    ])

    this.assertOk(profileRes, 'profiles')
    this.assertOk(evaluationsRes, 'evaluations')
    this.assertOk(skillScoresRes, 'skill_scores')
    this.assertOk(sessionsRes, 'coding_sessions')

    const profile = (profileRes.data ?? null) as ProfileRow | null
    const evaluations = (evaluationsRes.data ?? []) as EvaluationRow[]
    const skillScoreRows = (skillScoresRes.data ?? []) as unknown as SkillScoreRow[]
    const sessions = (sessionsRes.data ?? []) as CodingSessionRow[]

    const now = new Date().toISOString()
    const scores = evaluations.map((e) => e.overall_score).filter((s): s is number => typeof s === 'number')

    const skillMap = new Map<number, { name: string; slug: string; scores: number[]; evidenceCount: number; lastAssessedAt: string | null }>()
    for (const row of skillScoreRows) {
      const skillInfo = firstOrNull(row.skills)
      const evaluationInfo = firstOrNull(row.evaluations)
      const entry = skillMap.get(row.skill_id) ?? {
        name: skillInfo?.name ?? `skill-${row.skill_id}`,
        slug: skillInfo?.slug ?? '',
        scores: [],
        evidenceCount: 0,
        lastAssessedAt: null
      }
      if (typeof row.score === 'number') entry.scores.push(row.score)
      entry.evidenceCount += 1
      const assessedAt = evaluationInfo?.created_at ?? null
      if (assessedAt && (!entry.lastAssessedAt || assessedAt > entry.lastAssessedAt)) entry.lastAssessedAt = assessedAt
      skillMap.set(row.skill_id, entry)
    }

    const skills = [...skillMap.entries()]
      .map(([id, entry]) => ({
        id: String(id),
        name: entry.name,
        category: entry.slug,
        proficiency: average(entry.scores),
        evidenceCount: entry.evidenceCount,
        lastAssessedAt: entry.lastAssessedAt,
        verified: entry.scores.length >= 3 && average(entry.scores) >= 60
      }))
      .sort((a, b) => b.proficiency - a.proficiency)

    const languages: AssembledResume['languages'] = {}
    let ensembleSum = 0
    let flaggedSessions = 0
    for (const session of sessions) {
      const behavior = behaviorOf(session.behavior_state)
      ensembleSum += behavior.ensembleScore
      if (behavior.flags.length > 0) flaggedSessions += 1
      const lang = session.language || 'unknown'
      const cleanScore = Math.round((1 - behavior.ensembleScore) * 10000) / 100
      const existing = languages[lang] ?? { challengesCompleted: 0, avgCleanSessionScore: 0, lastUsedAt: null }
      const totalClean = existing.avgCleanSessionScore * existing.challengesCompleted + cleanScore
      existing.challengesCompleted += 1
      existing.avgCleanSessionScore = Math.round((totalClean / existing.challengesCompleted) * 100) / 100
      if (session.started_at && (!existing.lastUsedAt || session.started_at > existing.lastUsedAt)) existing.lastUsedAt = session.started_at
      languages[lang] = existing
    }

    const confidences = evaluations.map((e) => e.confidence).filter((c): c is number => typeof c === 'number')
    const consistency = Math.round(Math.max(0, 100 - stdDeviation(scores) * 2))
    const scoresAsc = [...scores].reverse()

    const growthTimeline: AssembledResume['growthTimeline'] = []
    let previousScore: number | null = null
    for (const evaluation of [...evaluations].reverse()) {
      const current = evaluation.overall_score
      if (typeof current !== 'number') continue
      growthTimeline.push({
        date: evaluation.created_at,
        previousScore,
        currentScore: current,
        improvement: previousScore === null ? 0 : Math.round((current - previousScore) * 100) / 100,
        source: evaluation.id
      })
      previousScore = current
    }

    const weakest = [...skills].reverse().filter((s) => s.proficiency < 70).slice(0, 3)

    const detections = await this.fetchDetections(sessions.map((s) => s.id))

    return {
      personalInfo: {
        fullName: profile?.full_name ?? '',
        bio: profile?.bio ?? '',
        avatarUrl: profile?.avatar_url ?? '',
        country: profile?.country ?? '',
        experienceYears: profile?.experience_years ?? undefined
      },
      summary:
        evaluations.length > 0
          ? `${evaluations.length} assessments completed · average ${average(scores)} · best ${Math.max(...scores)} · ${skills.length} skills evidenced.`
          : 'No assessments completed yet.',
      skills,
      stats: {
        totalAssessments: evaluations.length,
        averageScore: average(scores),
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        recentScores: scores.slice(0, 10)
      },
      recentActivity: evaluations.slice(0, 10).map((e) => ({
        type: 'assessment',
        id: e.id,
        score: e.overall_score,
        level: e.level,
        completedAt: e.created_at
      })),
      assessmentHistory: {
        totalAssessments: evaluations.length,
        averageScore: average(scores),
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        recentScores: scores.slice(0, 10),
        lastAssessmentAt: evaluations[0]?.created_at ?? undefined
      },
      languages,
      trustScore: {
        overallScore: average(scores),
        confidence: average(confidences),
        level: evaluations[0]?.level ?? trustLevel(average(scores)),
        factors: [
          { name: 'assessment_performance', score: average(scores), weight: 0.6, description: 'Average score across completed assessments' },
          { name: 'consistency', score: consistency, weight: 0.4, description: 'Stability of results across assessments' }
        ],
        lastUpdatedAt: now
      },
      growthTimeline,
      recommendations: weakest.map((s) => `Focus on "${s.name}" — current proficiency ${s.proficiency} based on ${s.evidenceCount} evidence items.`),
      behaviorInsights: {
        codingPattern: sessions.length > 0 && flaggedSessions / sessions.length > 0.4 ? 'scattered' : 'balanced',
        codeQualityTrend: qualityTrend(scoresAsc),
        flaggedSessions,
        totalSessions: sessions.length,
        averageEnsembleScore: sessions.length > 0 ? Math.round((ensembleSum / sessions.length) * 1000) / 1000 : 0,
        flaggedSessionsRatio: sessions.length > 0 ? Math.round((flaggedSessions / sessions.length) * 1000) / 1000 : 0
      },
      aiUsage: detections
    }
  }

  private async fetchDetections(sessionIds: string[]): Promise<Record<string, unknown>> {
    if (sessionIds.length === 0) return { available: false, detectionAverages: {} }

    const { data, error } = await this.supabase
      .from('ai_detection_results')
      .select('detection_type, probability')
      .in('coding_session_id', sessionIds)
    this.assertOk({ error }, 'ai_detection_results')

    const rows = (data ?? []) as Array<{ detection_type: string; probability: number }>
    if (rows.length === 0) return { available: false, detectionAverages: {} }

    const grouped = new Map<string, number[]>()
    for (const row of rows) {
      const list = grouped.get(row.detection_type) ?? []
      list.push(row.probability)
      grouped.set(row.detection_type, list)
    }

    const detectionAverages: Record<string, number> = {}
    for (const [type, list] of grouped) detectionAverages[type] = average(list)

    const overall = average(rows.map((r) => r.probability))
    return {
      available: true,
      detectionAverages,
      overallDetectionProbability: overall,
      humanWrittenCodePercentage: Math.round((1 - clamp01(overall)) * 100)
    }
  }

  private baseRecord(type: string, userId: string, version: ResumeVersion): BuiltResume {
    const now = new Date().toISOString()
    return { type, id: crypto.randomUUID(), userId, version, createdAt: now, updatedAt: now }
  }

  private assertOk(result: QueryResult, table: string): void {
    if (result.error) throw new Error(`[ResumeBuilder] ${table}: ${result.error.message}`)
  }
}
