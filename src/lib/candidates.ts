import type { Candidate, CandidateLocale, CandidateLocalizedProfile } from "@/types/candidate";

const SUPPORTED_LOCALES: CandidateLocale[] = ["en", "no"];

const normalizeTextValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const coerceLanguages = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : fallback;
};

export const isCandidateLocale = (value: string): value is CandidateLocale =>
  SUPPORTED_LOCALES.includes(value as CandidateLocale);

export const getCandidateProfile = (
  candidate: Candidate,
  locale: CandidateLocale,
): CandidateLocalizedProfile => {
  const fallbackProfile = candidate.profile.en;
  const localizedProfile = candidate.profile[locale] ?? fallbackProfile;

  const normalizedProfile: CandidateLocalizedProfile = {
    profession:
      normalizeTextValue(localizedProfile?.profession) ??
      normalizeTextValue(fallbackProfile?.profession) ??
      "",
    experience:
      normalizeTextValue(localizedProfile?.experience) ??
      normalizeTextValue(fallbackProfile?.experience) ??
      "",
    languages: coerceLanguages(localizedProfile?.languages, coerceLanguages(fallbackProfile?.languages)),
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

export const buildExperienceSummary = (profile: CandidateLocalizedProfile): string =>
  (profile.experience ?? "").trim();
