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

const coerceTextValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const coerceRawTextValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  return value;
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
  const medicalExperience = coerceTextValue(params.medicalExperience);
  const nonMedicalExperience = coerceTextValue(params.nonMedicalExperience);

  const experienceSections = [medicalExperience, nonMedicalExperience].filter(
    (section): section is string => typeof section === "string" && section.length > 0,
  );

  return {
    profession: normalizeText(params.profession) ?? "",
    medicalExperience,
    nonMedicalExperience,
    experience: experienceSections.join("\n\n"),
    languages: coerceRawTextValue(params.languages),
    cover_letter_summary: normalizeText(params.summary),
    cover_letter_full: normalizeText(params.coverLetter),
    education: normalizeText(params.education),
  };
};

const mapRowToCandidate = (row: CandidateRow): Candidate => {
  const birthYear = (() => {
    if (typeof row.anio_nacimiento === "number" && Number.isFinite(row.anio_nacimiento)) {
      return row.anio_nacimiento;
    }

    if (typeof row.anio_nacimiento === "string") {
      const parsed = Number(row.anio_nacimiento);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  })();

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
    birthYear,
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
