export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_detection_results: {
        Row: {
          coding_session_id: string
          created_at: string | null
          detection_type: string | null
          id: number
          probability: number | null
          result: Json | null
        }
        Insert: {
          coding_session_id: string
          created_at?: string | null
          detection_type?: string | null
          id?: never
          probability?: number | null
          result?: Json | null
        }
        Update: {
          coding_session_id?: string
          created_at?: string | null
          detection_type?: string | null
          id?: never
          probability?: number | null
          result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_detection_results_coding_session_id_fkey"
            columns: ["coding_session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_evaluations: {
        Row: {
          answer_id: number
          created_at: string | null
          evaluator_type: string
          id: number
          result: Json
        }
        Insert: {
          answer_id: number
          created_at?: string | null
          evaluator_type: string
          id?: never
          result?: Json
        }
        Update: {
          answer_id?: number
          created_at?: string | null
          evaluator_type?: string
          id?: never
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "answer_evaluations_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answer_data: Json
          created_at: string | null
          id: number
          is_correct: boolean | null
          question_id: number
          session_id: string
          time_spent_seconds: number | null
        }
        Insert: {
          answer_data?: Json
          created_at?: string | null
          id?: never
          is_correct?: boolean | null
          question_id: number
          session_id: string
          time_spent_seconds?: number | null
        }
        Update: {
          answer_data?: Json
          created_at?: string | null
          id?: never
          is_correct?: boolean | null
          question_id?: number
          session_id?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      api_actions: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          resume_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          resume_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          resume_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "user_resume_summary"
            referencedColumns: ["resume_id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: number
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: never
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_events: {
        Row: {
          coding_session_id: string
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: number
        }
        Insert: {
          coding_session_id: string
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: never
        }
        Update: {
          coding_session_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "behavior_events_coding_session_id_fkey"
            columns: ["coding_session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      building_blocks_registry: {
        Row: {
          category: string
          created_at: string | null
          id: string
          integration_status: string
          name: string
          notes: string | null
          purpose: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          integration_status?: string
          name: string
          notes?: string | null
          purpose: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          integration_status?: string
          name?: string
          notes?: string | null
          purpose?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clipboard_markers: {
        Row: {
          coding_session_id: string
          created_at: string
          id: number
          is_internal: boolean
          marker_hash: string | null
          marker_type: string
          metadata: Json
        }
        Insert: {
          coding_session_id: string
          created_at?: string
          id?: never
          is_internal?: boolean
          marker_hash?: string | null
          marker_type: string
          metadata?: Json
        }
        Update: {
          coding_session_id?: string
          created_at?: string
          id?: never
          is_internal?: boolean
          marker_hash?: string | null
          marker_type?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "clipboard_markers_coding_session_id_fkey"
            columns: ["coding_session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      code_metrics: {
        Row: {
          coding_session_id: string
          created_at: string | null
          id: number
          metadata: Json | null
          metric_type: string
          metric_value: number | null
        }
        Insert: {
          coding_session_id: string
          created_at?: string | null
          id?: never
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
        }
        Update: {
          coding_session_id?: string
          created_at?: string | null
          id?: never
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "code_metrics_coding_session_id_fkey"
            columns: ["coding_session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      code_similarity_reports: {
        Row: {
          compared_submission_id: string | null
          created_at: string | null
          id: string
          report_data: Json | null
          similarity_score: number | null
          submission_id: string | null
        }
        Insert: {
          compared_submission_id?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json | null
          similarity_score?: number | null
          submission_id?: string | null
        }
        Update: {
          compared_submission_id?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json | null
          similarity_score?: number | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_similarity_reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "code_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      code_submissions: {
        Row: {
          created_at: string | null
          id: string
          judge0_submission_id: string | null
          language: string
          question_id: number | null
          source_code: string | null
          source_code_hash: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          judge0_submission_id?: string | null
          language: string
          question_id?: number | null
          source_code?: string | null
          source_code_hash?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          judge0_submission_id?: string | null
          language?: string
          question_id?: number | null
          source_code?: string | null
          source_code_hash?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "code_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_events: {
        Row: {
          coding_session_id: string
          created_at: string
          event_type: string
          id: number
          metadata: Json
          source: string
        }
        Insert: {
          coding_session_id: string
          created_at?: string
          event_type: string
          id?: never
          metadata?: Json
          source?: string
        }
        Update: {
          coding_session_id?: string
          created_at?: string
          event_type?: string
          id?: never
          metadata?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_events_coding_session_id_fkey"
            columns: ["coding_session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_sessions: {
        Row: {
          behavior_intelligence_version: string
          behavior_state: Json
          exam_session_id: string | null
          finished_at: string | null
          id: string
          language: string | null
          last_behavior_flush_at: string | null
          metadata: Json | null
          peak_activity_window: Json
          started_at: string | null
          user_id: string
        }
        Insert: {
          behavior_intelligence_version?: string
          behavior_state?: Json
          exam_session_id?: string | null
          finished_at?: string | null
          id?: string
          language?: string | null
          last_behavior_flush_at?: string | null
          metadata?: Json | null
          peak_activity_window?: Json
          started_at?: string | null
          user_id: string
        }
        Update: {
          behavior_intelligence_version?: string
          behavior_state?: Json
          exam_session_id?: string | null
          finished_at?: string | null
          id?: string
          language?: string | null
          last_behavior_flush_at?: string | null
          metadata?: Json | null
          peak_activity_window?: Json
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_sessions_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coding_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_snapshots: {
        Row: {
          base_hash: string | null
          coding_session_id: string
          content: Json
          created_at: string
          event_type: string | null
          file_path: string | null
          id: string
          language: string | null
          snapshot_kind: string
          source_hash: string | null
        }
        Insert: {
          base_hash?: string | null
          coding_session_id: string
          content?: Json
          created_at?: string
          event_type?: string | null
          file_path?: string | null
          id?: string
          language?: string | null
          snapshot_kind?: string
          source_hash?: string | null
        }
        Update: {
          base_hash?: string | null
          coding_session_id?: string
          content?: Json
          created_at?: string
          event_type?: string | null
          file_path?: string | null
          id?: string
          language?: string | null
          snapshot_kind?: string
          source_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coding_snapshots_coding_session_id_fkey"
            columns: ["coding_session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: number
          payload: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: never
          payload?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: never
          payload?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editor_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_versions: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          version: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          version: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          version?: string
        }
        Relationships: []
      }
      evaluation_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          confidence: number | null
          created_at: string | null
          engine_version_id: number | null
          id: string
          level: string | null
          overall_score: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          engine_version_id?: number | null
          id?: string
          level?: string | null
          overall_score?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          engine_version_id?: number | null
          id?: string
          level?: string | null
          overall_score?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_engine_version_id_fkey"
            columns: ["engine_version_id"]
            isOneToOne: false
            referencedRelation: "engine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          exam_id: number
          id: number
          question_id: number
          question_order: number
          weight: number | null
        }
        Insert: {
          exam_id: number
          id?: never
          question_id: number
          question_order: number
          weight?: number | null
        }
        Update: {
          exam_id?: number
          id?: never
          question_id?: number
          question_order?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          exam_id: number
          finished_at: string | null
          id: string
          score: number | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          exam_id: number
          finished_at?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          exam_id?: number
          finished_at?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exam_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          engine_version: string | null
          id: number
          slug: string
          status: string | null
          title: string
          track_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          engine_version?: string | null
          id?: never
          slug: string
          status?: string | null
          title: string
          track_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          engine_version?: string | null
          id?: never
          slug?: string
          status?: string | null
          title?: string
          track_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_results: {
        Row: {
          created_at: string | null
          error_output: string | null
          execution_status: string | null
          execution_time: number | null
          id: string
          memory_used: number | null
          output: string | null
          submission_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_output?: string | null
          execution_status?: string | null
          execution_time?: number | null
          id?: string
          memory_used?: number | null
          output?: string | null
          submission_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_output?: string | null
          execution_status?: string | null
          execution_time?: number | null
          id?: string
          memory_used?: number | null
          output?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_results_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "code_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          provider: string | null
          room_id: string | null
          status: string | null
        }
        Insert: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          provider?: string | null
          room_id?: string | null
          status?: string | null
        }
        Update: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          provider?: string | null
          room_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          requirements: Json | null
          status: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          requirements?: Json | null
          status?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          requirements?: Json | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          created_at: string | null
          id: string
          job_type: string
          progress: number | null
          result: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_type: string
          progress?: number | null
          result?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_type?: string
          progress?: number | null
          result?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "processing_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: number
          payload: Json | null
          session_id: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: never
          payload?: Json | null
          session_id?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: never
          payload?: Json | null
          session_id?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "proctoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_sessions: {
        Row: {
          created_at: string | null
          exam_id: number | null
          id: string
          provider: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: number | null
          id?: string
          provider?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          exam_id?: number | null
          id?: string
          provider?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proctoring_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proctoring_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memory: {
        Row: {
          category: string
          created_at: string | null
          id: string
          key: string
          tags: Json
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          key: string
          tags?: Json
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          key?: string
          tags?: Json
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      question_skills: {
        Row: {
          id: number
          question_id: number
          skill_id: number
          weight: number | null
        }
        Insert: {
          id?: never
          question_id: number
          skill_id: number
          weight?: number | null
        }
        Update: {
          id?: never
          question_id?: number
          skill_id?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      question_tag_map: {
        Row: {
          question_id: number
          tag_id: number
        }
        Insert: {
          question_id: number
          tag_id: number
        }
        Update: {
          question_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_tag_map_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "question_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      question_tags: {
        Row: {
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      question_templates: {
        Row: {
          created_at: string | null
          id: number
          name: string
          schema: Json
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          name: string
          schema?: Json
          type: string
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string
          schema?: Json
          type?: string
        }
        Relationships: []
      }
      question_versions: {
        Row: {
          content: Json
          created_at: string | null
          description: string | null
          id: number
          language: string | null
          question_id: number
          test_cases: Json | null
          title: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: never
          language?: string | null
          question_id: number
          test_cases?: Json | null
          title: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: never
          language?: string | null
          question_id?: number
          test_cases?: Json | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          difficulty: number | null
          id: number
          slug: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: number | null
          id?: never
          slug: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: number | null
          id?: never
          slug?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      realtime_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: number
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: never
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: never
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "realtime_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          created_at: string | null
          data: Json
          id: number
          resume_id: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: never
          resume_id?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: never
          resume_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_resume_versions_resume"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_resume_versions_resume"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "user_resume_summary"
            referencedColumns: ["resume_id"]
          },
        ]
      }
      resumes: {
        Row: {
          active_version_id: number | null
          created_at: string | null
          id: string
          summary: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_version_id?: number | null
          created_at?: string | null
          id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_version_id?: number | null
          created_at?: string | null
          id?: string
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resumes_active_version"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: number
          role_id: number
        }
        Insert: {
          permission_id: number
          role_id: number
        }
        Update: {
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      rule_versions: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          id: number
          rule_id: number
          version: number
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          id?: never
          rule_id: number
          version?: number
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          id?: never
          rule_id?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rule_versions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "evaluation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_levels: {
        Row: {
          description: string | null
          id: number
          name: string
          rank: number
        }
        Insert: {
          description?: string | null
          id?: never
          name: string
          rank: number
        }
        Update: {
          description?: string | null
          id?: never
          name?: string
          rank?: number
        }
        Relationships: []
      }
      skill_relations: {
        Row: {
          child_skill_id: number
          id: number
          parent_skill_id: number
          relation_type: string
        }
        Insert: {
          child_skill_id: number
          id?: never
          parent_skill_id: number
          relation_type?: string
        }
        Update: {
          child_skill_id?: number
          id?: never
          parent_skill_id?: number
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_relations_child_skill_id_fkey"
            columns: ["child_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_relations_parent_skill_id_fkey"
            columns: ["parent_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_scores: {
        Row: {
          confidence: number | null
          evaluation_id: string
          id: number
          metadata: Json | null
          score: number | null
          skill_id: number
        }
        Insert: {
          confidence?: number | null
          evaluation_id: string
          id?: never
          metadata?: Json | null
          score?: number | null
          skill_id: number
        }
        Update: {
          confidence?: number | null
          evaluation_id?: string
          id?: never
          metadata?: Json | null
          score?: number | null
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_scores_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          active: boolean | null
          id: number
          name: string
          parent_id: number | null
          slug: string
          technology_id: number
        }
        Insert: {
          active?: boolean | null
          id?: never
          name: string
          parent_id?: number | null
          slug: string
          technology_id: number
        }
        Update: {
          active?: boolean | null
          id?: never
          name?: string
          parent_id?: number | null
          slug?: string
          technology_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "skills_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      technologies: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          id?: never
          name: string
          slug: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      track_technologies: {
        Row: {
          id: number
          priority: number | null
          technology_id: number
          track_id: number
          weight: number | null
        }
        Insert: {
          id?: never
          priority?: number | null
          technology_id: number
          track_id: number
          weight?: number | null
        }
        Update: {
          id?: never
          priority?: number | null
          technology_id?: number
          track_id?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "track_technologies_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_technologies_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          slug: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          role_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          phone: string | null
          role: string
          status: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_user_overview: {
        Row: {
          country: string | null
          experience_years: number | null
          full_name: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      user_resume_summary: {
        Row: {
          resume_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          resume_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          resume_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dashboard_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_summary: {
        Row: {
          confidence: number | null
          evaluation_id: string | null
          score: number | null
          skill_id: number | null
          skill_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_scores_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_my_user_id: { Args: never; Returns: string }
      has_permission: { Args: { permission_name: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
