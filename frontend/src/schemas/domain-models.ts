import type {
  AvailabilityContext,
  ISODate,
  ISODateTime,
  ISOTime,
  JuryRole,
  PostType,
  Section,
  UUID,
  UserRole,
  WeekDay,
} from "./common";

export interface User {
  id: UUID;
  email: string;
  username: string;
  role: UserRole;
  created_at?: ISODateTime;
  last_login?: ISODateTime;
  is_active?: boolean;
  is_staff?: boolean;
}

export interface Teacher {
  user: UUID;
  department: string;
  ncin: string;
  age: number;
}

export interface Student {
  user: UUID;
  class_id: UUID | null;
  parent_contact: string | null;
  access_status: boolean;
}

export interface ClassEntity {
  id: UUID;
  niveau: string;
  classe_section: Section;
  classe_num: string;
}

export interface Schedule {
  id: UUID;
  teacher: UUID;
  class_id: UUID;
  day_of_week: WeekDay;
  start_time: ISOTime;
  end_time: ISOTime;
  room: string;
  subject: string;
}

export interface Post {
  id: UUID;
  author: UUID;
  class_id: UUID | null;
  title: string;
  url: string;
  content: string;
  type: PostType;
  created_at: ISODateTime;
}

export interface Attendance {
  id: UUID;
  student: UUID;
  schedule: UUID;
  session_date: ISODate;
  status: boolean | null;
  marked_at: ISODateTime;
  marked_by: UUID | null;
}

export interface Department {
  id: UUID;
  name: string;
  head: UUID | null;
  created_at: ISODateTime;
}

export interface ForumQuestion {
  id: UUID;
  author: UUID;
  class_id: UUID | null;
  title: string;
  content: string;
  is_resolved: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface ForumAnswer {
  id: UUID;
  question: UUID;
  author: UUID;
  content: string;
  created_at: ISODateTime;
}

export interface TeacherAvailability {
  id: UUID;
  teacher: UUID;
  context: AvailabilityContext;
  day_of_week: WeekDay;
  start_time: ISOTime;
  end_time: ISOTime;
  created_at: ISODateTime;
}

export interface ExamSession {
  id: UUID;
  class_id: UUID;
  subject: string;
  exam_date: ISODate;
  start_time: ISOTime;
  end_time: ISOTime;
  room: string;
  created_by: UUID | null;
  created_at: ISODateTime;
}

export interface ExamSurveillanceAssignment {
  id: UUID;
  exam_session: UUID;
  teacher: UUID;
  assigned_at: ISODateTime;
}

export interface PfeSubject {
  id: UUID;
  title: string;
  student_name: string;
  supervisor: UUID;
  created_by: UUID | null;
  created_at: ISODateTime;
}

export interface PfePresentationSlot {
  id: UUID;
  presentation_date: ISODate;
  start_time: ISOTime;
  end_time: ISOTime;
  room: string;
  created_by: UUID | null;
  created_at: ISODateTime;
}

export interface PfeJuryAssignment {
  id: UUID;
  pfe_subject: UUID;
  teacher: UUID;
  slot: UUID | null;
  role: JuryRole;
  assigned_by: UUID | null;
  assigned_at: ISODateTime;
}
