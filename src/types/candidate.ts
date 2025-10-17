export type CandidateLocale = "en" | "no";

export interface CandidateLocalizedProfile {
  profession: string;
  experience: string;
  languages: string[];
  cover_letter_summary?: string | null;
  cover_letter_full?: string | null;
  education?: string | null;
}

export type CandidateCareSetting =
  | "domicilio"
  | "domicilio_geriatrico"
  | "hospitalario"
  | "urgencias";

export interface CandidateExperienceDetail {
  care_setting: CandidateCareSetting;
  title: string;
  duration: string;
  titles?: Record<string, string>;
  durations?: Record<string, string>;
  [key: string]: unknown;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  photoUrl: string | null;
  primaryCareSetting: CandidateCareSetting;
  experienceDetail: CandidateExperienceDetail;
  profile: Record<CandidateLocale, CandidateLocalizedProfile>;
  createdAt: string;
  updatedAt: string;
}
