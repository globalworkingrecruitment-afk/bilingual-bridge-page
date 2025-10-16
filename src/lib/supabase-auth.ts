import { supabase } from "@/integrations/supabase/client";
import { getSupabaseServiceCredentials } from "@/lib/env";

let inflightSessionPromise: Promise<void> | null = null;

const ensureExistingSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`[supabase] No se pudo obtener la sesión actual: ${error.message}`);
  }

  if (data.session) {
    return true;
  }

  return false;
};

const signInServiceUser = async () => {
  const credentials = getSupabaseServiceCredentials();

  if (!credentials) {
    throw new Error(
      "Configura VITE_SUPABASE_SERVICE_EMAIL y VITE_SUPABASE_SERVICE_PASSWORD para establecer la sesión de Supabase.",
    );
  }

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    if (error.message === "Failed to fetch") {
      throw new Error(
        [
          "[supabase] No se pudo contactar con Supabase.",
          "Verifica que la URL del proyecto y la anon key sean correctas,",
          "y que el dominio del despliegue esté incluido en Authentication → URL Configuration.",
        ].join(" "),
      );
    }

    throw new Error(`[supabase] No se pudo iniciar sesión: ${error.message}`);
  }
};

export const ensureSupabaseSession = async () => {
  if (inflightSessionPromise) {
    return inflightSessionPromise;
  }

  inflightSessionPromise = (async () => {
    const hasSession = await ensureExistingSession();
    if (hasSession) {
      return;
    }

    await signInServiceUser();
  })();

  try {
    await inflightSessionPromise;
  } finally {
    inflightSessionPromise = null;
  }
};

export const signOutSupabaseSession = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.warn("[supabase] Error al cerrar sesión", error);
  }
};
