export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;
export type ISOTime = string;

export const USER_ROLES = ["admin", "teacher", "student"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SECTIONS = ["Prépa", "L-LSI", "L-Mécanique", "L-Energie", "Cycle Ingénieur"] as const;
export type Section = (typeof SECTIONS)[number];

export const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi", "Samedi"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const POST_TYPES = ["lesson", "announcement"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const AVAILABILITY_CONTEXTS = ["surveillance", "pfe"] as const;
export type AvailabilityContext = (typeof AVAILABILITY_CONTEXTS)[number];

export const JURY_ROLES = ["encadreur", "rapporteur", "president"] as const;
export type JuryRole = (typeof JURY_ROLES)[number];

export interface ApiErrorResponse {
  error?: string;
  detail?: string;
}

export interface GenericMessageResponse {
  message: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}
