export type CareSetting = "domicilio_geriatrico" | "hospitalario" | "urgencias";

export interface CandidateExperience {
  title: string;
  duration: string;
  care_setting: CareSetting;
}

export interface Candidate {
  id: string;
  full_name: string;
  profession: string;
  experience: string;
  languages: string;
  cover_letter_summary: string;
  cover_letter_full: string;
  education: string;
  birth_date: string;
  email: string;
  phone: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
  experienceDetail: CandidateExperience;
}
