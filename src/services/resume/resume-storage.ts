import type { SupabaseClient } from '@supabase/supabase-js'

export interface ResumeMeta {
  title?: string
  summary?: string
}

export interface StoredResume {
  resumeId: string
  version: number
  createdAt: string
}

export interface StoredUserResume {
  resumeId: string
  version: number
  updatedAt: string | null
  data: Record<string, unknown>
}

export class ResumeStorageService {
  constructor(private supabase: SupabaseClient) {}

  async storeUserResume(userId: string, data: Record<string, unknown>, meta: ResumeMeta = {}): Promise<StoredResume> {
    const { data: existing, error: findError } = await this.supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (findError) throw new Error(`[ResumeStorage] resumes.select: ${findError.message}`)

    let resumeId: string
    if (existing) {
      resumeId = existing.id
    } else {
      const { data: created, error: insertError } = await this.supabase
        .from('resumes')
        .insert({ user_id: userId, title: meta.title ?? null, summary: meta.summary ?? null })
        .select('id')
        .single()
      if (insertError) throw new Error(`[ResumeStorage] resumes.insert: ${insertError.message}`)
      resumeId = created.id
    }

    const { data: lastVersion, error: lastError } = await this.supabase
      .from('resume_versions')
      .select('version')
      .eq('resume_id', resumeId)
      .order('version', { ascending: false })
      .limit(1)
    if (lastError) throw new Error(`[ResumeStorage] resume_versions.select: ${lastError.message}`)

    const nextVersion = (lastVersion?.[0]?.version ?? 0) + 1

    const { data: versionRow, error: versionInsertError } = await this.supabase
      .from('resume_versions')
      .insert({ resume_id: resumeId, version: nextVersion, data })
      .select('id, version, created_at')
      .single()
    if (versionInsertError) throw new Error(`[ResumeStorage] resume_versions.insert: ${versionInsertError.message}`)

    const { error: updateError } = await this.supabase
      .from('resumes')
      .update({
        active_version_id: versionRow.id,
        title: meta.title,
        summary: meta.summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeId)
    if (updateError) throw new Error(`[ResumeStorage] resumes.update: ${updateError.message}`)

    return { resumeId, version: nextVersion, createdAt: versionRow.created_at ?? new Date().toISOString() }
  }

  async getUserResume(userId: string): Promise<StoredUserResume | null> {
    const { data: resume, error } = await this.supabase
      .from('resumes')
      .select('id, active_version_id, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(`[ResumeStorage] resumes.select: ${error.message}`)
    if (!resume?.active_version_id) return null

    const { data: version, error: versionError } = await this.supabase
      .from('resume_versions')
      .select('version, data')
      .eq('id', resume.active_version_id)
      .maybeSingle()
    if (versionError) throw new Error(`[ResumeStorage] resume_versions.select: ${versionError.message}`)
    if (!version) return null

    return {
      resumeId: resume.id,
      version: version.version,
      updatedAt: resume.updated_at,
      data: (version.data as Record<string, unknown>) ?? {}
    }
  }
}
