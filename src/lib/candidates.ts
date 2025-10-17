import type { Candidate, CandidateLocale, CandidateLocalizedProfile } from "@/types/candidate";

const SUPPORTED_LOCALES: CandidateLocale[] = ["en", "no"];

const normalizeTextValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickLanguages = (
  primary: CandidateLocalizedProfile | undefined,
  fallback: CandidateLocalizedProfile | undefined,
): string | null => {
  const getValidLanguages = (profile: CandidateLocalizedProfile | undefined): string | null => {
    if (!profile) return null;
    if (typeof profile.languages !== "string") return null;

    const value = profile.languages;
    return value.trim().length > 0 ? value : null;
  };

  return getValidLanguages(primary) ?? getValidLanguages(fallback);
};

const extractExperienceSections = (
  profile: CandidateLocalizedProfile | undefined,
): string[] => {
  if (!profile) return [];

  const sections: string[] = [];

  const pushSection = (value: unknown) => {
    const normalized = normalizeTextValue(value);
    if (normalized) {
      sections.push(normalized);
    }
  };

  pushSection(profile.medicalExperience);
  pushSection(profile.nonMedicalExperience);

  if (sections.length === 0) {
    pushSection(profile.experience);
  }

  return sections;
};

export const isCandidateLocale = (value: string): value is CandidateLocale =>
  SUPPORTED_LOCALES.includes(value as CandidateLocale);

export const getCandidateProfile = (
  candidate: Candidate,
  locale: CandidateLocale,
): CandidateLocalizedProfile => {
  const fallbackProfile = candidate.profile.en;
  const localizedProfile = candidate.profile[locale] ?? fallbackProfile;

  const experienceSections = extractExperienceSections(localizedProfile);
  const fallbackExperienceSections = extractExperienceSections(fallbackProfile);
  const combinedExperienceSections =
    experienceSections.length > 0 ? experienceSections : fallbackExperienceSections;

  const normalizedProfile: CandidateLocalizedProfile = {
    profession:
      normalizeTextValue(localizedProfile?.profession) ??
      normalizeTextValue(fallbackProfile?.profession) ??
      "",
    experience: combinedExperienceSections.join("\n\n"),
    medicalExperience:
      normalizeTextValue(localizedProfile?.medicalExperience) ??
      normalizeTextValue(fallbackProfile?.medicalExperience) ??
      null,
    nonMedicalExperience:
      normalizeTextValue(localizedProfile?.nonMedicalExperience) ??
      normalizeTextValue(fallbackProfile?.nonMedicalExperience) ??
      null,
    languages: pickLanguages(localizedProfile, fallbackProfile),
    cover_letter_summary:
      normalizeTextValue(localizedProfile?.cover_letter_summary) ??
      normalizeTextValue(fallbackProfile?.cover_letter_summary) ??
      null,
    cover_letter_full:
      normalizeTextValue(localizedProfile?.cover_letter_full) ??
      normalizeTextValue(fallbackProfile?.cover_letter_full) ??
      null,
    education:
      normalizeTextValue(localizedProfile?.education) ??
      normalizeTextValue(fallbackProfile?.education) ??
      null,
  };

  return normalizedProfile;
};

export const buildExperienceSummary = (profile: CandidateLocalizedProfile): string => {
  const sections = [profile.medicalExperience, profile.nonMedicalExperience]
    .map(section => (typeof section === "string" ? section.trim() : ""))
    .filter(Boolean);

  if (sections.length > 0) {
    return sections.join("\n\n");
  }

  return (profile.experience ?? "").trim();
};
