export interface Candidate {
  id: string;
  name: string;
  photo: string | null;
  experience: string;
  birth_year: number;
  presentation: string;
  specialties: string[];
  availability: string | null;
  languages: string[] | null;
  certifications: string[] | null;
  location: string | null;
}
