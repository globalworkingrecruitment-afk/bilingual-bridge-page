import { Candidate, CandidateLocale } from "@/types/candidate";
import { getCandidateProfile } from "@/lib/candidates";

interface SearchCriteria {
  rawQuery: string;
  keywords: string[];
  ageLessThan?: number;
  ageGreaterThan?: number;
}

const stopwords = new Set([
  "de",
  "la",
  "el",
  "que",
  "y",
  "en",
  "para",
  "con",
  "del",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "por",
  "se",
  "su",
  "sus",
  "lo",
  "al",
  "a",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
]);

const ignoredKeywords = new Set([
  "carrera",
  "universitaria",
  "universitario",
  "universidad",
  "licenciatura",
  "grado",
  "titulacion",
  "titulación",
  "titulo",
  "título",
  "master",
  "máster",
  "maestria",
  "maestría",
  "formacion",
  "formación",
]);

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export const parseSearchQuery = (query: string): SearchCriteria => {
  const normalizedQuery = query.toLowerCase();
  const criteria: SearchCriteria = {
    rawQuery: normalizedQuery,
    keywords: [],
  };

  if (!normalizedQuery.trim()) {
    return criteria;
  }

  let processedQuery = normalizedQuery;

  const ageLessMatch = processedQuery.match(/menor(?:es)?(?:\s+de)?\s+(\d{1,3})/);
  if (ageLessMatch) {
    criteria.ageLessThan = Number(ageLessMatch[1]);
    processedQuery = processedQuery.replace(ageLessMatch[0], " ");
  }

  const ageGreaterMatch = processedQuery.match(/mayor(?:es)?(?:\s+de)?\s+(\d{1,3})/);
  if (ageGreaterMatch) {
    criteria.ageGreaterThan = Number(ageGreaterMatch[1]);
    processedQuery = processedQuery.replace(ageGreaterMatch[0], " ");
  }

  const tokens = processedQuery
    .split(/[^a-záéíóúüñ0-9]+/)
    .map(token => token.trim())
    .filter(Boolean);

  const uniqueKeywords = new Set<string>();

  tokens.forEach(token => {
    if (stopwords.has(token) || ignoredKeywords.has(token)) {
      return;
    }

    if (/^\d+$/.test(token)) {
      return;
    }

    if (token.length < 3) {
      return;
    }

    uniqueKeywords.add(normalizeText(token));
  });

  criteria.keywords = Array.from(uniqueKeywords);

  return criteria;
};

export const candidateMatchesCriteria = (
  candidate: Candidate,
  criteria: SearchCriteria,
): boolean => {
  const { keywords, ageGreaterThan, ageLessThan } = criteria;

  const birthYear =
    typeof candidate.birthYear === "number" && Number.isFinite(candidate.birthYear)
      ? candidate.birthYear
      : null;
  const currentYear = new Date().getUTCFullYear();
  const candidateAge = birthYear ? currentYear - birthYear : null;

  if (typeof ageLessThan === "number" && candidateAge !== null) {
    if (!(candidateAge < ageLessThan)) {
      return false;
    }
  }

  if (typeof ageGreaterThan === "number" && candidateAge !== null) {
    if (!(candidateAge > ageGreaterThan)) {
      return false;
    }
  }

  if (keywords.length === 0) {
    return true;
  }

  const localizedChunks: string[] = [];

  const locales: CandidateLocale[] = ["en", "no"];

  locales.forEach(locale => {
    const profile = getCandidateProfile(candidate, locale);
    const languagesText = profile.languages.join(" ");

    localizedChunks.push(
      profile.profession,
      languagesText,
      profile.education ?? "",
      profile.experience,
      profile.medicalExperience ?? "",
      profile.nonMedicalExperience ?? "",
      profile.cover_letter_summary ?? "",
      profile.cover_letter_full ?? "",
    );
  });

  const fallbackProfile = getCandidateProfile(candidate, "en");
  const fallbackLanguages = fallbackProfile.languages.join(" ");

  const searchableText = normalizeText(
    [
      candidate.fullName,
      fallbackProfile.profession,
      fallbackProfile.education ?? "",
      fallbackProfile.cover_letter_summary ?? "",
      fallbackProfile.cover_letter_full ?? "",
      fallbackProfile.experience,
      fallbackProfile.medicalExperience ?? "",
      fallbackProfile.nonMedicalExperience ?? "",
      fallbackLanguages,
      candidate.status,
      fallbackProfile.education ?? "",
      ...localizedChunks,
    ]
      .join(" "),
  );

  return keywords.every(keyword => searchableText.includes(keyword));
};

export type { SearchCriteria };
