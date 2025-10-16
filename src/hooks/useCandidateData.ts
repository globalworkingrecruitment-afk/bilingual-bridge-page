import { useCallback, useEffect, useState } from "react";
import type { Candidate } from "@/types/candidate";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { ensureSupabaseSession } from "@/lib/supabase-auth";

type CandidateRow = Database["public"]["Tables"]["candidate_data"]["Row"];

type CandidateFetchState = "idle" | "loading" | "loaded" | "error";

const coerceStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const mapRowToCandidate = (row: CandidateRow): Candidate => ({
  id: row.id,
  nombre: row.nombre,
  experiencia_medica_en: row.experiencia_medica_en ?? null,
  experiencia_medica_no: row.experiencia_medica_no ?? null,
  experiencia_no_medica_en: row.experiencia_no_medica_en ?? null,
  experiencia_no_medica_no: row.experiencia_no_medica_no ?? null,
  formacion_en: row.formacion_en ?? null,
  formacion_no: row.formacion_no ?? null,
  profesion_en: row.profesion_en ?? null,
  profesion_no: row.profesion_no ?? null,
  idiomas_en: coerceStringArray(row.idiomas_en),
  idiomas_no: coerceStringArray(row.idiomas_no),
  carta_resumen_en: row.carta_resumen_en ?? null,
  carta_en: row.carta_en ?? null,
  carta_resumen_no: row.carta_resumen_no ?? null,
  carta_no: row.carta_no ?? null,
  estado: row.estado ?? "activo",
  anio_nacimiento: row.anio_nacimiento,
  correo: row.correo,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

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
