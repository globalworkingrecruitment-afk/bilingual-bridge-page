import type {
  Candidate,
  CandidateExperience,
  CandidateLocale,
  CandidateLocalizedProfile,
} from "@/types/candidate";

const SUPPORTED_LOCALES: CandidateLocale[] = ["en", "no"];

export const isCandidateLocale = (value: string): value is CandidateLocale =>
  SUPPORTED_LOCALES.includes(value as CandidateLocale);

export const getCandidateProfile = (
  candidate: Candidate,
  locale: CandidateLocale,
): CandidateLocalizedProfile => {
  const fallback: CandidateLocalizedProfile = {
    profession: candidate.profession,
    experience: candidate.experience,
    languages: candidate.languages,
    cover_letter_summary: candidate.cover_letter_summary,
    cover_letter_full: candidate.cover_letter_full,
    education: candidate.education,
  };

  const translations = candidate.translations ?? {};
  const localized = translations[locale];

  if (!localized) {
    return fallback;
  }

  return {
    profession: localized.profession || fallback.profession,
    experience: localized.experience || fallback.experience,
    languages: localized.languages || fallback.languages,
    cover_letter_summary: localized.cover_letter_summary || fallback.cover_letter_summary,
    cover_letter_full: localized.cover_letter_full || fallback.cover_letter_full,
    education: localized.education || fallback.education,
  };
};

export const getExperienceTitle = (
  experience: CandidateExperience,
  locale: CandidateLocale,
): string => {
  if (!experience.titles) {
    return experience.title;
  }

  return experience.titles[locale] ?? experience.title;
};

export const getExperienceDuration = (
  experience: CandidateExperience,
  locale: CandidateLocale,
): string => {
  if (!experience.durations) {
    return experience.duration;
  }

  return experience.durations[locale] ?? experience.duration;
};
