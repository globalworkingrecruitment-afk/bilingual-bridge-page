import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeExternalUrl } from "@/lib/security";

interface CandidateSearchProps {
  onSearch: (query: string, candidateNames?: string[]) => void | Promise<void>;
  n8nWebhookUrl?: string;
  placeholder?: string;
  searchLabel?: string;
}

export const CandidateSearch = ({ onSearch, n8nWebhookUrl, placeholder, searchLabel }: CandidateSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const extractCandidateNames = (payload: unknown): string[] => {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload.filter((name): name is string => typeof name === "string" && name.trim().length > 0);
    }

    if (typeof payload === "object") {
      const container = payload as Record<string, unknown>;
      const candidateKeys = ["candidates", "names", "data"];

      for (const key of candidateKeys) {
        const value = container[key];
        if (Array.isArray(value)) {
          const candidates = value.filter((name): name is string => typeof name === "string" && name.trim().length > 0);
          if (candidates.length > 0) {
            return candidates;
          }
        }
      }
    }

    return [];
  };

  const sanitizedWebhookUrl = useMemo(
    () =>
      sanitizeExternalUrl(n8nWebhookUrl, {
        variableName: "n8n webhook URL",
        allowHttpLocalhost: true,
      }),
    [n8nWebhookUrl],
  );

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    await onSearch(trimmedQuery);

    if (n8nWebhookUrl && trimmedQuery) {
      if (!sanitizedWebhookUrl) {
        toast({
          title: "Webhook no válido",
          description: "Actualiza la configuración con una URL HTTPS segura antes de enviar búsquedas.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(sanitizedWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "omit",
          body: JSON.stringify({
            query: trimmedQuery,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`El webhook respondió con el estado ${response.status}`);
        }

        let candidateNames: string[] = [];

        try {
          const bodyText = await response.text();

          if (bodyText) {
            try {
              const payload = JSON.parse(bodyText);
              candidateNames = extractCandidateNames(payload);

              if (candidateNames.length === 0 && typeof payload === "string") {
                candidateNames = [payload].filter((name) => name.trim().length > 0);
              }
            } catch (jsonError) {
              console.warn("No se pudo parsear la respuesta del webhook como JSON", jsonError);
              candidateNames = bodyText
                .split(/[\n,]/)
                .map((name) => name.trim())
                .filter((name) => name.length > 0);
              if (candidateNames.length === 0) {
                console.warn("Respuesta del webhook sin formato reconocido", bodyText);
              }
            }
          }
        } catch (parseError) {
          console.warn("No se pudo interpretar la respuesta del webhook", parseError);
        }

        const normalizedNames = candidateNames.map((name) => name.trim()).filter((name) => name.length > 0);
        await onSearch(trimmedQuery, normalizedNames);

        if (normalizedNames.length > 0) {
          toast({
            title: "Candidatos encontrados",
            description: `El webhook sugirió ${normalizedNames.length} candidato(s).`,
          });
        } else {
          toast({
            title: "Sin coincidencias del webhook",
            description: "El servicio no devolvió candidatos para esta búsqueda.",
          });
        }
      } catch (error) {
        console.error("Error al enviar búsqueda a n8n:", error);
        toast({
          title: "Error al consultar el webhook",
          description: error instanceof Error ? error.message : "No se pudo completar la solicitud.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder={placeholder ?? "Buscar por nombre o experiencia"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading && searchQuery.trim()) {
                handleSearch();
              }
            }}
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
          className="h-12 px-8 bg-gradient-to-r from-primary to-primary-glow"
        >
          {isLoading ? (searchLabel ?? "Buscar") + "..." : searchLabel ?? "Buscar"}
        </Button>
      </div>
    </div>
  );
};
