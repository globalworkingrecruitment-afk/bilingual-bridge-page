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

const coerceStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean);
};

interface LocalizedProfileParams {
  profession: string | null;
  medicalExperience: string | null;
  nonMedicalExperience: string | null;
  languages: string[];
  education: string | null;
  summary: string | null;
  coverLetter: string | null;
}

const buildLocalizedProfile = (params: LocalizedProfileParams): CandidateLocalizedProfile => {
  const medicalExperience = normalizeText(params.medicalExperience);
  const nonMedicalExperience = normalizeText(params.nonMedicalExperience);

  const experienceSections = [medicalExperience, nonMedicalExperience].filter(
    (section): section is string => typeof section === "string" && section.length > 0,
  );

  return {
    profession: normalizeText(params.profession) ?? "",
    medicalExperience,
    nonMedicalExperience,
    experience: experienceSections.join("\n\n"),
    languages: params.languages,
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
    languages: coerceStringArray(row.idiomas_en),
    education: row.formacion_en,
    summary: row.carta_resumen_en,
    coverLetter: row.carta_en,
  });

  const profileNo = buildLocalizedProfile({
    profession: row.profesion_no,
    medicalExperience: row.experiencia_medica_no,
    nonMedicalExperience: row.experiencia_no_medica_no,
    languages: coerceStringArray(row.idiomas_no),
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
