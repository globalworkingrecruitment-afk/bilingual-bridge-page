export type CandidateLocale = "en" | "no";

export interface CandidateLocalizedProfile {
  profession: string;
  experience: string;
  medical_experience?: string | null;
  non_medical_experience?: string | null;
  languages: string[];
  cover_letter_summary?: string | null;
  cover_letter_full?: string | null;
  education?: string | null;
}

export interface Candidate {
  id: string;
  nombre: string;
  experiencia_medica_en: string | null;
  experiencia_medica_no: string | null;
  experiencia_no_medica_en: string | null;
  experiencia_no_medica_no: string | null;
  formacion_en: string | null;
  formacion_no: string | null;
  profesion_en: string | null;
  profesion_no: string | null;
  idiomas_en: string[];
  idiomas_no: string[];
  carta_resumen_en: string | null;
  carta_en: string | null;
  carta_resumen_no: string | null;
  carta_no: string | null;
  estado: string;
  anio_nacimiento: number;
  correo: string;
  created_at: string;
  updated_at: string;
}
