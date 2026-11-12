import type { Database } from "@/lib/supabase/types";
import type { Json } from "@/lib/supabase/types";
import type { LiveActivity, LiveMessage, LiveSession } from "./types";
type Table<R> = {
  Row: { [K in keyof R]: R[K] };
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};
type LiveTables = {
  live_video_credentials: Table<{ session_id: string; session_name: string; remote_id: string; password: string; account_id: string }>;
  live_studio_assets: Table<{ path: string; session_id: string | null; status: 'staged' | 'attached' | 'purging'; created_at: string }>;
  live_studio_state: Table<{ session_id: string; revision: number; state: Json; updated_at: string }>;
  live_studio_commands: Table<{ session_id: string; user_id: string; id: string; payload_hash: string; revision: number; created_at: string }>;

  organization_instructors: Table<{
    organization_id: string;
    user_id: string;
    zoom_user_id: string | null;
    created_at: string;
  }>;
  live_sessions: Table<LiveSession>;
  live_zoom_credentials: Table<{
    session_id: string;
    host_id: string;
    password: string;
  }>;
  live_messages: Table<LiveMessage>;
  live_transcripts: Table<{
    id: string;
    session_id: string;
    source_id: string;
    speaker: string;
    content: string;
    spoken_at: string;
    created_at: string;
  }>;
  live_activities: Table<LiveActivity>;
  live_quiz_keys: Table<{ activity_id: string; correct_option: number }>;
  live_activity_responses: Table<{
    activity_id: string;
    user_id: string;
    answer: number | null;
    is_correct: boolean | null;
    created_at: string;
  }>;
  live_attendance: Table<{
    session_id: string;
    user_id: string;
    joined_at: string;
    last_seen_at: string;
  }>;
  live_private_messages: Table<{
    id: string;
    session_id: string;
    user_id: string;
    question: string;
    answer: string;
    created_at: string;
  }>;
  live_scheduling_requests: Table<{
    id: string;
    organization_id: string;
    user_id: string;
    payload_hash: string;
    state: "pending" | "completed" | "failed" | "uncertain";
    session_id: string | null;
    created_at: string;
  }>;
};
type LiveFunctions = {
  live_finalize_video_session: { Args: { p_request: string; p_session: Json; p_remote: string; p_password: string; p_account: string }; Returns: LiveSession };
  live_studio_claim_asset_gc: { Args: { p_limit: number }; Returns: string[] };
  live_studio_purge: { Args: Record<string, never>; Returns: undefined };
  live_studio_commit: { Args: { p_org: string; p_user: string; p_session: string; p_id: string; p_hash: string; p_expected: number; p_type: string; p_state: Json }; Returns: number };

  live_workspace_snapshot: {
    Args: { p_org: string; p_user: string; p_session: string };
    Returns: Json;
  };
  live_workspace_ai_context: { Args: { p_org: string; p_user: string; p_session: string }; Returns: Json };
  live_workspace_command: {
    Args: { p_org: string; p_user: string; p_session: string; p_id: string; p_command: Json };
    Returns: Json;
  };
  live_workspace_purge: { Args: Record<string, never>; Returns: undefined };
  live_catalog: {
    Args: {
      p_org: string;
      p_user: string;
      p_teaching: boolean;
      p_instructor?: string;
      p_offset: number;
      p_limit: number;
      p_course_offset: number;
      p_instructor_offset: number;
      p_period?: string;
    };
    Returns: Json;
  };
  live_finalize_session: {
    Args: {
      p_request: string;
      p_session: Json;
      p_host: string;
      p_password: string;
    };
    Returns: LiveSession;
  };
  live_publish_activity: {
    Args: { p_session: string; p_activity: Json; p_correct: number | null };
    Returns: LiveActivity;
  };
};
export type LiveDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & LiveTables;
    Functions: Database["public"]["Functions"] & LiveFunctions;
  };
};
