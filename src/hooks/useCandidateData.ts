import { useCallback, useEffect, useState } from "react";
import type { Candidate, CandidateCareSetting, CandidateLocalizedProfile } from "@/types/candidate";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { ensureSupabaseSession } from "@/lib/supabase-auth";

type CandidateRow = Database["public"]["Tables"]["candidates"]["Row"];

type CandidateFetchState = "idle" | "loading" | "loaded" | "error";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const coerceStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean);
};

const coerceLocalizedProfile = (value: unknown): CandidateLocalizedProfile => {
  if (!isRecord(value)) {
    return {
      profession: "",
      experience: "",
      languages: [],
      cover_letter_summary: null,
      cover_letter_full: null,
      education: null,
    };
  }

  return {
    profession: typeof value.profession === "string" ? value.profession : "",
    experience: typeof value.experience === "string" ? value.experience : "",
    languages: coerceStringArray(value.languages),
    cover_letter_summary:
      typeof value.cover_letter_summary === "string" ? value.cover_letter_summary : null,
    cover_letter_full: typeof value.cover_letter_full === "string" ? value.cover_letter_full : null,
    education: typeof value.education === "string" ? value.education : null,
  };
};

const coerceCareSetting = (value: unknown, fallback: CandidateCareSetting): CandidateCareSetting => {
  const candidateCareSetting = String(value ?? "") as CandidateCareSetting;

  const allowed: CandidateCareSetting[] = ["domicilio", "domicilio_geriatrico", "hospitalario", "urgencias"];

  return allowed.includes(candidateCareSetting) ? candidateCareSetting : fallback;
};

const mapRowToCandidate = (row: CandidateRow): Candidate => {
  const detailRecord = isRecord(row.experience_detail) ? { ...row.experience_detail } : {};
  const careSetting = coerceCareSetting(detailRecord.care_setting, row.primary_care_setting);

  const experienceDetail: Candidate["experienceDetail"] = {
    care_setting: careSetting,
    title: typeof detailRecord.title === "string" ? detailRecord.title : "",
    duration: typeof detailRecord.duration === "string" ? detailRecord.duration : "",
  };

  if (isRecord(detailRecord.titles)) {
    experienceDetail.titles = Object.fromEntries(
      Object.entries(detailRecord.titles).filter(([, value]) => typeof value === "string"),
    ) as Record<string, string>;
  }

  if (isRecord(detailRecord.durations)) {
    experienceDetail.durations = Object.fromEntries(
      Object.entries(detailRecord.durations).filter(([, value]) => typeof value === "string"),
    ) as Record<string, string>;
  }

  Object.entries(detailRecord).forEach(([key, value]) => {
    if (key in experienceDetail) return;
    (experienceDetail as Record<string, unknown>)[key] = value;
  });

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birth_date,
    photoUrl: row.photo_url ?? null,
    primaryCareSetting: row.primary_care_setting,
    experienceDetail,
    profile: {
      en: coerceLocalizedProfile(row.profile_en),
      no: coerceLocalizedProfile(row.profile_no),
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
        .from("candidates")
        .select("*")
        .order("full_name", { ascending: true });

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
