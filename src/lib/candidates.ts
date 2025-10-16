import type { Candidate, CandidateLocale, CandidateLocalizedProfile } from "@/types/candidate";

const SUPPORTED_LOCALES: CandidateLocale[] = ["en", "no"];

type LocalizedFieldPrefix =
  | "experiencia_medica"
  | "experiencia_no_medica"
  | "formacion"
  | "profesion"
  | "carta_resumen"
  | "carta";

const LOCALIZED_SUFFIX: Record<CandidateLocale, "en" | "no"> = {
  en: "en",
  no: "no",
};

const normalizeTextValue = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getLocalizedCandidateField = (
  candidate: Candidate,
  prefix: LocalizedFieldPrefix,
  locale: CandidateLocale,
): string | null => {
  const suffix = LOCALIZED_SUFFIX[locale];
  const localizedKey = `${prefix}_${suffix}` as keyof Candidate;
  const fallbackKey = `${prefix}_en` as keyof Candidate;

  const localizedValue = candidate[localizedKey];
  const fallbackValue = candidate[fallbackKey];

  return (
    normalizeTextValue(typeof localizedValue === "string" ? localizedValue : null) ??
    normalizeTextValue(typeof fallbackValue === "string" ? fallbackValue : null)
  );
};

const getLocalizedLanguages = (candidate: Candidate, locale: CandidateLocale): string[] => {
  const localized = locale === "no" ? candidate.idiomas_no : candidate.idiomas_en;
  const fallback = candidate.idiomas_en;

  if (Array.isArray(localized) && localized.length > 0) {
    return localized;
  }

  return Array.isArray(fallback) ? fallback : [];
};

export const isCandidateLocale = (value: string): value is CandidateLocale =>
  SUPPORTED_LOCALES.includes(value as CandidateLocale);

export const getCandidateProfile = (
  candidate: Candidate,
  locale: CandidateLocale,
): CandidateLocalizedProfile => {
  const profession =
    getLocalizedCandidateField(candidate, "profesion", locale) ??
    getLocalizedCandidateField(candidate, "profesion", "en") ??
    "";

  const medicalExperience = getLocalizedCandidateField(candidate, "experiencia_medica", locale);
  const nonMedicalExperience = getLocalizedCandidateField(candidate, "experiencia_no_medica", locale);
  const education = getLocalizedCandidateField(candidate, "formacion", locale);
  const coverLetterSummary = getLocalizedCandidateField(candidate, "carta_resumen", locale);
  const coverLetterFull = getLocalizedCandidateField(candidate, "carta", locale);
  const languages = getLocalizedLanguages(candidate, locale);
  const experienceSegments = [medicalExperience, nonMedicalExperience]
    .map(segment => (segment ?? "").trim())
    .filter(Boolean);
  const experience = experienceSegments.join("\n\n");

  return {
    profession,
    experience,
    medical_experience: medicalExperience,
    non_medical_experience: nonMedicalExperience,
    languages,
    cover_letter_summary: coverLetterSummary,
    cover_letter_full: coverLetterFull,
    education,
  };
};

export const buildExperienceSummary = (profile: CandidateLocalizedProfile): string =>
  (profile.experience ?? "").trim();
