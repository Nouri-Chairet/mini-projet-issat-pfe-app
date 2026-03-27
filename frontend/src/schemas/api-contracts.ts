import type {
  AvailabilityContext,
  GenericMessageResponse,
  ISODate,
  ISODateTime,
  ISOTime,
  PostType,
  Section,
  Tokens,
  UUID,
  WeekDay,
} from "./common";
import type { Teacher, User } from "./domain-models";

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = Tokens;

export interface RefreshTokenRequest {
  refresh: string;
}

export type RefreshTokenResponse = Tokens;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  detail: string;
}

export interface ResetPasswordRequest {
  uid: string;
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  detail: string;
}

export interface UpdatePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface UpdatePasswordResponse {
  detail: string;
}

export interface RegisterAdminRequest {
  email: string;
  username: string;
  password: string;
  role: "admin";
}

export interface RegisterTeacherRequest {
  email: string;
  username: string;
  password: string;
  role: "teacher";
  department: string;
  ncin: string;
  age: number;
}

export interface RegisterStudentRequest {
  email: string;
  username: string;
  password: string;
  role: "student";
  class_id: UUID;
  parent_contact?: string;
}

export type RegisterRequest = RegisterAdminRequest | RegisterTeacherRequest | RegisterStudentRequest;
export type RegisterResponse = Tokens;

export interface StudentProfileResponse {
  id: UUID;
  user: Pick<User, "id" | "email" | "username" | "role">;
  class_id: UUID;
  class_name: string;
  parent_contact: string | null;
  created_at: ISODateTime;
}

export interface TeacherProfileResponse {
  id: UUID;
  user: Pick<User, "id" | "email" | "username" | "role">;
  department: string;
  ncin: string;
  age: number;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

export interface UpdateAccountRequest {
  email?: string;
  username?: string;
  password?: string;
  department?: string;
  ncin?: string;
  age?: number;
  parent_contact?: string;
  access_status?: boolean;
}

export type UpdateAccountResponse = User | Teacher | StudentProfileResponse | TeacherProfileResponse;

export interface CreateClassesRequest {
  level: number;
  section: Section;
  nb: number;
}

export interface CreateClassesResponse {
  message: string;
}

export interface ClassSummary {
  id: UUID;
  niveau: string;
  section?: Section;
  classe_section?: Section;
  num?: string;
  classe_num?: string;
}

export interface GetClassesResponse {
  classes: ClassSummary[];
}

export interface ScheduleItem {
  id?: UUID;
  teacher?: string;
  class?: string;
  day_of_week: string;
  start_time: ISOTime;
  end_time: ISOTime;
  room: string;
  subject: string;
}

export interface GetClassScheduleResponse {
  schedules: ScheduleItem[];
}

export interface GetTeacherScheduleResponse {
  schedules: ScheduleItem[];
}

export interface TeacherSummary {
  id: UUID;
  username: string;
  email: string;
  department: string;
}

export interface GetTeachersResponse {
  teachers: TeacherSummary[];
}

export interface StudentSummary {
  username: string;
  parent_contact: string | null;
  access_status: boolean;
  email: string;
}

export interface GetStudentsResponse {
  students: StudentSummary[];
}

export interface UpdateStudentRequest {
  student_id: UUID;
  access_status?: boolean;
  parent_contact?: string;
  email?: string;
  password?: string;
}

export interface DeleteStudentRequest {
  student_id: UUID;
}

export interface AnnouncementOrLesson {
  id: UUID;
  title: string;
  content: string;
  url: string;
  type: PostType;
  created_at: ISODateTime;
  author: string;
}

export interface GetAnnouncementsResponse {
  posts: AnnouncementOrLesson[];
}

export interface GetLessonsResponse {
  lessons: AnnouncementOrLesson[];
}

export interface CreateForumQuestionRequest {
  title: string;
  content: string;
  class_id?: UUID;
}

export interface CreateForumQuestionResponse {
  id: UUID;
  message: string;
}

export interface AnswerForumQuestionRequest {
  question_id: UUID;
  content: string;
}

export interface AnswerForumQuestionResponse {
  id: UUID;
  message: string;
}

export interface ForumQuestionListItem {
  id: UUID;
  title: string;
  content: string;
  author: string;
  class_id: UUID | null;
  is_resolved: boolean;
  created_at: ISODateTime;
  answers_count: number;
}

export interface GetForumQuestionsResponse {
  questions: ForumQuestionListItem[];
}

export interface SetTeacherAvailabilityRequest {
  context: AvailabilityContext;
  day_of_week: WeekDay;
  start_time: ISOTime;
  end_time: ISOTime;
  teacher_id?: UUID;
}

export interface TeacherSurveillanceLoadResponse {
  teacher_id: UUID;
  teacher_name: string;
  weekly_teaching_hours: number;
  required_surveillance_hours: number;
  assigned_surveillance_hours: number;
  remaining_surveillance_hours: number;
}

export interface CreateExamManualRequest {
  class_id: UUID;
  subject: string;
  exam_date: ISODate;
  start_time: ISOTime;
  end_time: ISOTime;
  room: string;
  teacher_ids?: UUID[];
}

export interface CreateExamManualResponse {
  exam_id: UUID;
  message: string;
}

export interface CreateExamFromExcelResponse {
  message: string;
  created_count: number;
  pdf_url: string;
}

export interface CreatePfeFromExcelResponse {
  message: string;
  created_count: number;
}

export interface AssignPfeJuryRequest {
  pfe_subject_id: UUID;
  rapporteur_id?: UUID;
  president_id?: UUID;
  date?: ISODate;
  start_time?: ISOTime;
  end_time?: ISOTime;
  room?: string;
}

export interface PfeTeacherQuotaResponse {
  teacher_id: UUID;
  teacher_name: string;
  supervised_subjects: number;
  required_presentations: number;
  assigned_presentations: number;
  remaining_presentations: number;
}

export interface TeacherMakePresenceRequest {
  schedule_id: UUID;
  students: Array<{
    student_id: UUID;
    presence: boolean;
  }>;
}

export interface TeacherCurrentSessionResponse {
  day_of_week: string;
  start_time: ISOTime;
  end_time: ISOTime;
  class_id: UUID;
  room: string;
  subject: string;
  teacher_name: string;
}

export interface TeacherAbsenceItem {
  student_name: string;
  marked_time: ISODateTime;
  class_name: string;
  presence: boolean | null;
}

export interface TeacherAbsenceHistoryResponse {
  data: TeacherAbsenceItem[];
}

export type EndpointMessageResponse = GenericMessageResponse;
