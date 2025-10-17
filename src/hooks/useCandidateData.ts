import { useCallback, useEffect, useState } from "react";
import type { Candidate, CandidateLocalizedProfile } from "@/types/candidate";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { ensureSupabaseSession } from "@/lib/supabase-auth";

type CandidateRow = Database["public"]["Tables"]["candidate_data"]["Row"];

type CandidateFetchState = "idle" | "loading" | "loaded" | "error";

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeListEntry = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const withoutPrefix = trimmed.replace(/^[-•*]+\s*/, "").trim();
  return withoutPrefix.length > 0 ? withoutPrefix : null;
};

const parseListLikeValue = (value: unknown): string[] => {
  const items: string[] = [];

  const visit = (input: unknown) => {
    if (Array.isArray(input)) {
      input.forEach(visit);
      return;
    }

    if (typeof input !== "string") {
      return;
    }

    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return;
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          visit(parsed);
          return;
        }
      } catch (error) {
        /* noop */
      }
    }

    const normalized = trimmed.replace(/\r\n/g, "\n");
    const segments = normalized.split(/[\n;,•]+/);

    segments.forEach(segment => {
      const sanitized = sanitizeListEntry(segment);
      if (sanitized) {
        items.push(sanitized);
      }
    });
  };

  visit(value);

  return Array.from(new Set(items));
};

const formatListText = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }

  const listItems = parseListLikeValue(value);

  if (listItems.length === 0) {
    return normalizeText(value);
  }

  if (listItems.length === 1) {
    return listItems[0];
  }

  return listItems.map(item => `• ${item}`).join("\n");
};

interface LocalizedProfileParams {
  profession: unknown;
  medicalExperience: unknown;
  nonMedicalExperience: unknown;
  languages: unknown;
  education: unknown;
  summary: unknown;
  coverLetter: unknown;
}

const buildLocalizedProfile = (params: LocalizedProfileParams): CandidateLocalizedProfile => {
  const medicalExperience = formatListText(params.medicalExperience);
  const nonMedicalExperience = formatListText(params.nonMedicalExperience);

  const experienceSections = [medicalExperience, nonMedicalExperience].filter(
    (section): section is string => typeof section === "string" && section.length > 0,
  );

  return {
    profession: normalizeText(params.profession) ?? "",
    medicalExperience,
    nonMedicalExperience,
    experience: experienceSections.join("\n\n"),
    languages: parseListLikeValue(params.languages),
    cover_letter_summary: normalizeText(params.summary),
    cover_letter_full: normalizeText(params.coverLetter),
    education: normalizeText(params.education),
  };
};

const mapRowToCandidate = (row: CandidateRow): Candidate => {
  const profileEn = buildLocalizedProfile({
    profession: row.profesion_en,
    medicalExperience: row.experiencia_medica_en,
    nonMedicalExperience: row.experiencia_no_medica_en,
    languages: row.idiomas_en,
    education: row.formacion_en,
    summary: row.carta_resumen_en,
    coverLetter: row.carta_en,
  });

  const profileNo = buildLocalizedProfile({
    profession: row.profesion_no,
    medicalExperience: row.experiencia_medica_no,
    nonMedicalExperience: row.experiencia_no_medica_no,
    languages: row.idiomas_no,
    education: row.formacion_no,
    summary: row.carta_resumen_no,
    coverLetter: row.carta_no,
  });

  return {
    id: row.id,
    fullName: row.nombre,
    email: row.correo,
    status: row.estado,
    birthYear: typeof row.anio_nacimiento === "number" ? row.anio_nacimiento : Number(row.anio_nacimiento),
    profile: {
      en: profileEn,
      no: profileNo,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const useCandidateData = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [state, setState] = useState<CandidateFetchState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      await ensureSupabaseSession();

      const { data, error: supabaseError } = await supabase
        .from("candidate_data")
        .select("*")
        .order("nombre", { ascending: true });

      if (supabaseError) {
        throw new Error(`[supabase] ${supabaseError.message}`);
      }

      if (!data) {
        setCandidates([]);
        setState("loaded");
        return;
      }

      const mappedCandidates = data.map(mapRowToCandidate);
      setCandidates(mappedCandidates);
      setState("loaded");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cargar la lista de candidatos.";
      setError(message);
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return {
    candidates,
    loading: state === "loading" && candidates.length === 0,
    refreshing: state === "loading" && candidates.length > 0,
    error,
    refresh: fetchCandidates,
  };
};
