export type CareSetting = "domicilio_geriatrico" | "hospitalario" | "urgencias";

export interface CandidateExperience {
  title: string;
  duration: string;
  care_setting: CareSetting;
}

export interface Candidate {
  id: string;
  full_name: string;
  birth_year: number;
  cover_letter: string;
  experiences: CandidateExperience[];
}
