/**
 * Domain Types
 *
 * Trawin domain types. Aligned with the 58-table schema in
 * docs/trawin-architecture.md. Replace with generated Supabase types as
 * features land.
 */

// Roles defined in `roles` table
export type UserRole = "developer" | "company" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  city: string | null;
  created_at: string;
};

export type QuestionType = "multiple_choice" | "fill_blank" | "code" | "essay";
export type Difficulty = "easy" | "medium" | "hard" | "challenge";

export type Exam = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type CodingEventType =
  | "paste"
  | "copy"
  | "cut"
  | "undo"
  | "run"
  | "submit"
  | "blur";

export type CodingEvent = {
  id: string;
  session_id: string;
  user_id: string;
  type: CodingEventType;
  payload: Record<string, unknown> | null;
  occurred_at: string;
};
