import type { SupabaseClient } from '@supabase/supabase-js';

export interface EvaluationRowLite {
  id: string
  overall_score: number | null
  level: string | null
  confidence: number | null
  created_at: string | null
}

export interface DeveloperOverview {
  totalAssessments: number
  averageScore: number
  bestScore: number
  latestLevel: string | null
  recent: Array<{
    id: string
    score: number | null
    level: string | null
    completedAt: string | null
  }>
}

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getMyAppUserId(): Promise<string | null> {
    const { data, error } = await this.supabase.rpc('get_my_user_id')
    if (error) return null
    return (data as string) ?? null
  }

  async getUserRole(appUserId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', appUserId)
      .maybeSingle()
    return (data?.role as string) ?? null
  }

  async getDeveloperOverview(appUserId: string): Promise<DeveloperOverview> {
    const { data, error } = await this.supabase
      .from('evaluations')
      .select('id, overall_score, level, confidence, created_at')
      .eq('user_id', appUserId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(`[Dashboard] evaluations: ${error.message}`)

    const rows = (data ?? []) as EvaluationRowLite[]
    const scores = rows.map((r) => r.overall_score).filter((s): s is number => typeof s === 'number')
    const average = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0

    return {
      totalAssessments: rows.length,
      averageScore: average,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      latestLevel: rows[0]?.level ?? null,
      recent: rows.slice(0, 5).map((r) => ({
        id: r.id,
        score: r.overall_score,
        level: r.level,
        completedAt: r.created_at,
      })),
    }
  }
}
