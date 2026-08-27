/**
 * Domain Types
 *
 * Aligned with the generated Supabase contract (src/types/database.ts) and the
 * authoritative question contracts (src/lib/admin/question-contracts.ts).
 * Identity rule: application tables reference public.users.id — never auth.uid().
 */

// Role values stored in public.users.role (CHECK constraint)
export type UserRole = "developer" | "company" | "admin";

export type Profile = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  role_id: number | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  experience_years: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Company = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  website: string | null;
  created_at: string | null;
};

// Numeric difficulty stored in questions.difficulty (1..5)
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "coding"
  | "open_ended"
  | "debugging";

export type Exam = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  engine_version: string | null;
  status: string | null;
  track_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

// Mirrors public.coding_events
export type CodingEvent = {
  id: number;
  coding_session_id: string;
  event_type: string;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
