import { sanitizeExternalUrl } from "./security";

const requireEnv = (value: string | undefined, name: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`[config] Missing required environment variable ${name}.`);
  }

  return trimmed;
};

export const getSupabaseClientConfig = () => {
  const urlValue = requireEnv(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL");
  const key = requireEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "VITE_SUPABASE_PUBLISHABLE_KEY");

  const url = sanitizeExternalUrl(urlValue, { variableName: "VITE_SUPABASE_URL" });

  if (!url) {
    throw new Error("[config] VITE_SUPABASE_URL must be a valid HTTPS URL.");
  }

  return { url, key };
};

export const getSupabaseServiceCredentials = () => {
  const email = import.meta.env.VITE_SUPABASE_SERVICE_EMAIL?.trim();
  const password = import.meta.env.VITE_SUPABASE_SERVICE_PASSWORD?.trim();

  if (email && password) {
    return { email, password };
  }

  return null;
};

export const getScheduleWebhookUrl = () =>
  sanitizeExternalUrl(import.meta.env.VITE_SCHEDULE_WEBHOOK_URL, {
    variableName: "VITE_SCHEDULE_WEBHOOK_URL",
    allowHttpLocalhost: true,
  });

export const getN8nWebhookUrl = () =>
  sanitizeExternalUrl(import.meta.env.VITE_N8N_WEBHOOK_URL, {
    variableName: "VITE_N8N_WEBHOOK_URL",
    allowHttpLocalhost: true,
  });
