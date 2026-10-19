export type LiveStatus = "scheduled" | "live" | "ended" | "cancelled";
export interface LiveSession {
  id: string;
  organization_id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  status: LiveStatus;
  video_provider?: "zoom-meeting" | "zoom-video";
  zoom_meeting_id: string | null;
  zoom_webinar_id?: string | null;
  session_type?: "meeting" | "webinar";
  created_at: string;
}
export interface LiveMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  author_name: string;
  kind: "user" | "soflia";
  content: string;
  created_at: string;
}
export interface LiveActivity {
  id: string;
  session_id: string;
  kind: "quiz" | "reading" | "file";
  title: string;
  content: string;
  options: string[];
  file_path: string | null;
  created_at: string;
}
export interface LiveCourse {
  id: string;
  title: string;
  instructor_id: string | null;
}
export interface LiveInstructor {
  user_id: string;
  name: string;
  zoom_user_id: string | null;
}
export interface LiveCatalog {
  sessions: LiveSession[];
  courses: LiveCourse[];
  instructors: LiveInstructor[];
  canTeach: boolean;
  isAdmin: boolean;
  userId: string;
  total: number;
  courseTotal: number;
  instructorTotal: number;
  stats: {
    sessions: number;
    attendees: number;
    responses: number;
    learners: number;
    completed: number;
    averageProgress: number;
  };
}
