import type { ISODate, ISOTime, UUID } from '../schemas';

export type AppUserRole = 'chef' | 'enseignant' | 'etudiant';
export type TopicStatus = 'planifié' | 'validé' | 'en attente';
export type JuryRoleLabel = 'président' | 'rapporteur';

export interface AppUser {
  id: number;
  name: string;
  role: AppUserRole;
  avatar: string;
  email: string;
  password: string;
  department?: string;
  specialite?: string;
  nbSujets?: number;
  sujetId?: number;
  schemaUserId?: UUID;
  is_department_head?: boolean;
}

export interface StudentProfile {
  id?: number;
  name: string;
  avatar: string;
  email: string;
}

export interface TeacherProfile {
  id?: number;
  name: string;
  avatar: string;
}

export interface JuryMember {
  id: number;
  name: string;
  role: JuryRoleLabel;
}

export interface Sujet {
  id: number;
  titre: string;
  etudiant: StudentProfile;
  encadreur: TeacherProfile;
  statut: TopicStatus;
  datePresentation: ISODate | null;
  heure: ISOTime | null;
  salle: string | null;
  jury: JuryMember[];
}

export interface Enseignant {
  id: number;
  name: string;
  avatar: string;
  specialite: string;
  nbSujets: number;
  disponibilites: ISODate[];
}

export interface ForumAuthor {
  name: string;
  avatar: string;
  role: AppUserRole | 'enseignant' | 'etudiant';
}

export interface ForumReply {
  id: number;
  auteur: ForumAuthor;
  message: string;
  date: ISODate;
}

export interface ForumMessage {
  id: number;
  auteur: ForumAuthor;
  sujet: string;
  message: string;
  date: ISODate;
  reponses: ForumReply[];
}

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: number;
}

export type PageId =
  | 'dashboard'
  | 'timetable'
  | 'emploi'
  | 'accounts'
  | 'import'
  | 'pfe-import'
  | 'pfe-upload'
  | 'presence'
  | 'classes'
  | 'departments'
  | 'heads'
  | 'pfe-sessions'
  | 'pfe-scheduler'
  | 'sujets'
  | 'planning'
  | 'jurys'
  | 'forum'
  | 'export'
  | 'pfe-results'
  | 'pfe-campaign-management'
  | 'announcements'
  | 'disponibilites';
