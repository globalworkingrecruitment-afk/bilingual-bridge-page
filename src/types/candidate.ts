export type CandidateLocale = "en" | "no";

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  status: string;
  birthYear: number | null;
  profile: Record<CandidateLocale, CandidateLocalizedProfile>;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateLocalizedProfile {
  profession: string;
  experience: string;
  medicalExperience?: string | null;
  nonMedicalExperience?: string | null;
  languages: string[];
  cover_letter_summary?: string | null;
  cover_letter_full?: string | null;
  education?: string | null;
}
