import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ensureSupabaseSession } from "@/lib/supabase-auth";
import type { AccessLog, AppUser, CandidateViewLog, SearchLog, SessionUser, UserRole } from "@/types/auth";
import type { ScheduleRequestLog } from "@/types/schedule";

const SESSION_KEY = "bbp-auth-session";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readFromStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return fallback;
  }
};

const writeToStorage = <T>(key: string, value: T) => {
  if (!isBrowser) return;

  window.localStorage.setItem(key, JSON.stringify(value));
};

type AppUserRow = Database["public"]["Tables"]["app_users"]["Row"];
type AccessLogRow = Database["public"]["Tables"]["access_logs"]["Row"];
type CandidateViewRow = Database["public"]["Tables"]["candidate_view_logs"]["Row"];
type ScheduleRequestRow = Database["public"]["Tables"]["schedule_requests"]["Row"];
type SearchLogRow = Database["public"]["Tables"]["employer_search_logs"]["Row"];

type MaybeSingleError = PostgrestError & { code: string };

const isNoRowsError = (error: PostgrestError | null): error is MaybeSingleError => {
  return Boolean(error && (error as MaybeSingleError).code === "PGRST116");
};

const sanitizeIlikeValue = (value: string) =>
  value
    .replace(/[%_]/g, (character) => `\\${character}`)
    .replace(/,/g, " ")
    .trim();

const mapAppUserRow = (row: AppUserRow): AppUser => ({
  id: row.id,
  username: row.username,
  password: row.password,
  fullName: row.full_name ?? undefined,
  email: row.email ?? undefined,
  isActive: row.is_active,
  createdAt: row.created_at,
});

const mapAccessLogRow = (row: AccessLogRow): AccessLog => ({
  id: row.id,
  username: row.username,
  role: row.role,
  loggedAt: row.logged_at,
});

const mapCandidateViewRow = (row: CandidateViewRow): CandidateViewLog => ({
  id: row.id,
  employerUsername: row.employer_username,
  candidateId: row.candidate_id,
  candidateName: row.candidate_name,
  viewedAt: row.viewed_at,
});

const mapScheduleRequestRow = (row: ScheduleRequestRow): ScheduleRequestLog => ({
  id: row.id,
  employerUsername: row.employer_username,
  employerEmail: row.employer_email,
  employerName: row.employer_name ?? undefined,
  candidateId: row.candidate_id,
  candidateName: row.candidate_name,
  candidateEmail: row.candidate_email,
  availability: row.availability,
  requestedAt: row.requested_at,
});

const mapSearchLogRow = (row: SearchLogRow): SearchLog => ({
  id: row.id,
  employerUsername: row.employer_username,
  query: row.query,
  candidateNames: row.candidate_names ?? [],
  searchedAt: row.searched_at,
  updatedAt: row.updated_at ?? undefined,
});

export const initializeLocalDb = async () => {
  await ensureSupabaseSession();
};

export const getStoredSession = (): SessionUser | null => {
  const stored = readFromStorage<(SessionUser & { email?: string }) | null>(SESSION_KEY, null);

  if (!stored) {
    return null;
  }

  if (!stored.username && stored.email) {
    const migratedSession: SessionUser = { username: stored.email, role: stored.role };
    persistSession(migratedSession);
    return migratedSession;
  }

  return stored;
};

export const persistSession = (session: SessionUser | null) => {
  if (!isBrowser) return;

  if (session) {
    writeToStorage(SESSION_KEY, session);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
};

export const getUsers = async (): Promise<AppUser[]> => {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return (data ?? []).map(mapAppUserRow);
};

const getUserByIdentifierInternal = async (identifier: string): Promise<AppUserRow | null> => {
  const normalized = identifier.trim();

  if (!normalized) {
    return null;
  }

  await ensureSupabaseSession();

  const sanitized = sanitizeIlikeValue(normalized.toLowerCase());

  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .or(`username.ilike.${sanitized},email.ilike.${sanitized}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isNoRowsError(error)) {
      return null;
    }

    throw new Error(`[supabase] ${error.message}`);
  }

  return data ?? null;
};

export const getUserByIdentifier = async (identifier: string): Promise<AppUser | null> => {
  const row = await getUserByIdentifierInternal(identifier);
  return row ? mapAppUserRow(row) : null;
};

export const validateUserCredentials = async (
  identifier: string,
  password: string,
): Promise<AppUser | null> => {
  const userRow = await getUserByIdentifierInternal(identifier);

  if (!userRow) {
    return null;
  }

  if (!userRow.is_active) {
    return null;
  }

  if (userRow.password !== password.trim()) {
    return null;
  }

  return mapAppUserRow(userRow);
};

export const addUser = async (
  username: string,
  password: string,
  fullName?: string,
  email?: string,
): Promise<AppUser> => {
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();
  const normalizedEmail = email?.trim();

  if (!normalizedUsername) {
    throw new Error("El nombre de usuario no es válido.");
  }

  if (!normalizedPassword) {
    throw new Error("La contraseña no es válida.");
  }

  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      username: normalizedUsername,
      password: normalizedPassword,
      full_name: fullName?.trim() || null,
      email: normalizedEmail || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return mapAppUserRow(data);
};

export const toggleUserStatus = async (userId: string): Promise<AppUser | null> => {
  await ensureSupabaseSession();

  const { data: existing, error: existingError } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existingError) {
    if (isNoRowsError(existingError)) {
      return null;
    }

    throw new Error(`[supabase] ${existingError.message}`);
  }

  if (!existing) {
    return null;
  }

  const { data, error } = await supabase
    .from("app_users")
    .update({ is_active: !existing.is_active })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return mapAppUserRow(data);
};

export const updateUserEmail = async (userId: string, email: string): Promise<AppUser | null> => {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error("El correo electrónico es obligatorio.");
  }

  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("app_users")
    .update({ email: normalizedEmail })
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isNoRowsError(error)) {
      return null;
    }

    throw new Error(`[supabase] ${error.message}`);
  }

  return data ? mapAppUserRow(data) : null;
};

export const removeUser = async (userId: string) => {
  await ensureSupabaseSession();

  const { error } = await supabase.from("app_users").delete().eq("id", userId);

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }
};

export const getAccessLogs = async (): Promise<AccessLog[]> => {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("access_logs")
    .select("*")
    .order("logged_at", { ascending: false });

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return (data ?? []).map(mapAccessLogRow);
};

export const addAccessLog = async (username: string, role: UserRole): Promise<AccessLog> => {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("access_logs")
    .insert({ username, role })
    .select("*")
    .single();

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return mapAccessLogRow(data);
};

export const getCandidateViews = async (): Promise<CandidateViewLog[]> => {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("candidate_view_logs")
    .select("*")
    .order("viewed_at", { ascending: false });

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return (data ?? []).map(mapCandidateViewRow);
};

export const getCandidateViewsByUser = async (): Promise<Record<string, CandidateViewLog[]>> => {
  const views = await getCandidateViews();

  return views.reduce<Record<string, CandidateViewLog[]>>((accumulator, view) => {
    const key = view.employerUsername.trim().toLowerCase();

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(view);
    return accumulator;
  }, {});
};

export const recordCandidateView = async (
  employerUsername: string,
  candidateId: string,
  candidateName: string,
): Promise<CandidateViewLog | null> => {
  const normalizedUsername = employerUsername?.trim();
  const normalizedCandidateId = candidateId?.trim();
  const normalizedCandidateName = candidateName?.trim();

  if (!normalizedUsername || !normalizedCandidateId || !normalizedCandidateName) {
    return null;
  }

  await ensureSupabaseSession();

  const { data: existing, error: existingError } = await supabase
    .from("candidate_view_logs")
    .select("*")
    .eq("employer_username", normalizedUsername)
    .eq("candidate_id", normalizedCandidateId)
    .maybeSingle();

  if (existingError && !isNoRowsError(existingError)) {
    throw new Error(`[supabase] ${existingError.message}`);
  }

  const timestamp = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from("candidate_view_logs")
      .update({
        candidate_name: normalizedCandidateName,
        viewed_at: timestamp,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`[supabase] ${error.message}`);
    }

    return mapCandidateViewRow(data);
  }

  const { data, error } = await supabase
    .from("candidate_view_logs")
    .insert({
      employer_username: normalizedUsername,
      candidate_id: normalizedCandidateId,
      candidate_name: normalizedCandidateName,
      viewed_at: timestamp,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return mapCandidateViewRow(data);
};

export const getScheduleRequests = async (): Promise<ScheduleRequestLog[]> => {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("schedule_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return (data ?? []).map(mapScheduleRequestRow);
};

export const recordScheduleRequest = async (params: {
  employerUsername: string;
  employerEmail: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  availability: string;
  employerName?: string;
}): Promise<ScheduleRequestLog | null> => {
  const normalizedEmployerUsername = params.employerUsername?.trim();
  const normalizedEmployerEmail = params.employerEmail?.trim();
  const normalizedCandidateId = params.candidateId?.trim();
  const normalizedCandidateName = params.candidateName?.trim();
  const normalizedCandidateEmail = params.candidateEmail?.trim();
  const normalizedAvailability = params.availability?.trim();

  if (
    !normalizedEmployerUsername ||
    !normalizedEmployerEmail ||
    !normalizedCandidateId ||
    !normalizedCandidateName ||
    !normalizedCandidateEmail ||
    !normalizedAvailability
  ) {
    return null;
  }

  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("schedule_requests")
    .insert({
      employer_username: normalizedEmployerUsername,
      employer_email: normalizedEmployerEmail,
      employer_name: params.employerName?.trim() || null,
      candidate_id: normalizedCandidateId,
      candidate_name: normalizedCandidateName,
      candidate_email: normalizedCandidateEmail,
      availability: normalizedAvailability,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return mapScheduleRequestRow(data);
};

export const getSearchLogs = async (): Promise<SearchLog[]> => {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("employer_search_logs")
    .select("*")
    .order("searched_at", { ascending: false });

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return (data ?? []).map(mapSearchLogRow);
};

export const getSearchLogsByUser = async (): Promise<Record<string, SearchLog[]>> => {
  const logs = await getSearchLogs();

  return logs.reduce<Record<string, SearchLog[]>>((accumulator, log) => {
    const key = log.employerUsername.trim().toLowerCase();

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(log);
    return accumulator;
  }, {});
};

export const recordSearchQuery = async (
  employerUsername: string,
  query: string,
  candidateNames?: string[],
): Promise<SearchLog | null> => {
  if (!employerUsername?.trim() || !query?.trim()) {
    return null;
  }

  const normalizedUsername = employerUsername.trim();
  const normalizedQuery = query.trim();
  const normalizedCandidates = (candidateNames ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("employer_search_logs")
    .insert({
      employer_username: normalizedUsername,
      query: normalizedQuery,
      candidate_names: normalizedCandidates,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`[supabase] ${error.message}`);
  }

  return mapSearchLogRow(data);
};

export const updateSearchLogCandidates = async (
  logId: string,
  candidateNames: string[],
): Promise<SearchLog | null> => {
  const normalizedCandidates = candidateNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("employer_search_logs")
    .update({ candidate_names: normalizedCandidates })
    .eq("id", logId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isNoRowsError(error)) {
      return null;
    }

    throw new Error(`[supabase] ${error.message}`);
  }

  return data ? mapSearchLogRow(data) : null;
};
