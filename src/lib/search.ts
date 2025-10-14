import { Candidate, CareSetting } from "@/types/candidate";

interface SearchCriteria {
  rawQuery: string;
  keywords: string[];
  requiredCareSettings: CareSetting[];
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

const experienceKeywords: Array<{ keywords: string[]; setting: CareSetting }> = [
  {
    keywords: ["hospital", "hospitalaria", "hospitalario", "hospitales"],
    setting: "hospitalario",
  },
  {
    keywords: ["urgencia", "urgencias", "emergencia", "emergency"],
    setting: "urgencias",
  },
  {
    keywords: ["domicilio", "residencia", "geriatr", "home care"],
    setting: "domicilio_geriatrico",
  },
];

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
    requiredCareSettings: [],
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

  experienceKeywords.forEach(({ keywords, setting }) => {
    if (keywords.some(keyword => processedQuery.includes(keyword))) {
      if (!criteria.requiredCareSettings.includes(setting)) {
        criteria.requiredCareSettings.push(setting);
      }
      keywords.forEach(keyword => {
        processedQuery = processedQuery.replaceAll(keyword, " ");
      });
    }
  });

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
  const {
    keywords,
    requiredCareSettings,
    ageGreaterThan,
    ageLessThan,
  } = criteria;

  if (requiredCareSettings.length > 0) {
    const hasAllRequiredExperiences = requiredCareSettings.every(setting =>
      candidate.experiences.some(experience => experience.care_setting === setting),
    );

    if (!hasAllRequiredExperiences) {
      return false;
    }
  }

  const birthDate = candidate.birth_date ? new Date(candidate.birth_date) : null;
  const birthTime = birthDate?.getTime();
  const candidateAge =
    birthTime !== undefined && !Number.isNaN(birthTime)
      ? new Date().getFullYear() - birthDate!.getFullYear()
      : null;

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

  const searchableText = normalizeText(
    [
      candidate.full_name,
      candidate.profession,
      candidate.languages,
      candidate.education,
      candidate.cover_letter_summary,
      candidate.cover_letter_full,
      candidate.experience,
      candidate.experiences.map(experience => `${experience.title} ${experience.duration}`),
    ]
      .flat()
      .join(" "),
  );

  return keywords.every(keyword => searchableText.includes(keyword));
};

export type { SearchCriteria };
