const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

type SanitizeUrlOptions = {
  variableName?: string;
  allowHttpLocalhost?: boolean;
};

const buildWarningMessage = (name: string, reason: string) => {
  const label = name ? `"${name}"` : "the provided URL";
  return `[security] Ignoring ${label} because ${reason}.`;
};

export const sanitizeExternalUrl = (
  value: string | undefined,
  { variableName, allowHttpLocalhost = false }: SanitizeUrlOptions = {},
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    console.warn(buildWarningMessage(variableName ?? "", "it is empty after trimming"));
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    const isHttps = parsed.protocol === "https:";
    const isLocalhost = LOCALHOST_HOSTS.has(parsed.hostname);

    if (isHttps) {
      return parsed.toString();
    }

    if (allowHttpLocalhost && isLocalhost && parsed.protocol === "http:") {
      return parsed.toString();
    }

    const reason = allowHttpLocalhost
      ? "it must use HTTPS or http://localhost for local development"
      : "it must use HTTPS";
    console.warn(buildWarningMessage(variableName ?? "", reason));
    return undefined;
  } catch (error) {
    console.warn(buildWarningMessage(variableName ?? "", "it is not a valid URL"), error);
    return undefined;
  }
};
