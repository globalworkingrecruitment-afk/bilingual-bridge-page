const fallbackHost =
  typeof window !== "undefined" ? window.location.hostname : "localhost";

export const ADMIN_DOMAIN =
  import.meta.env.VITE_ADMIN_DOMAIN ?? `admin.${fallbackHost}`;
export const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN ?? fallbackHost;
export const ALLOW_DOMAIN_FALLBACK =
  (import.meta.env.VITE_ALLOW_DOMAIN_FALLBACK ?? "true") !== "false";

export const getCurrentHost = () =>
  typeof window !== "undefined" ? window.location.hostname : "";

export const domainMatches = (expectedDomain: string) => {
  if (!expectedDomain) return true;

  const current = getCurrentHost();

  if (!current) return true;

  return current === expectedDomain;
};
