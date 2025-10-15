import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeExternalUrl } from "@/lib/security";

interface CandidateSearchProps {
  onSearch: (query: string) => void;
  n8nWebhookUrl?: string;
  placeholder?: string;
  searchLabel?: string;
}

export const CandidateSearch = ({ onSearch, n8nWebhookUrl, placeholder, searchLabel }: CandidateSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sanitizedWebhookUrl = useMemo(
    () =>
      sanitizeExternalUrl(n8nWebhookUrl, {
        variableName: "n8n webhook URL",
        allowHttpLocalhost: true,
      }),
    [n8nWebhookUrl],
  );

  const handleSearch = async () => {
    onSearch(searchQuery);
    
    if (n8nWebhookUrl && searchQuery.trim()) {
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
        await fetch(sanitizedWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          credentials: "omit",
          body: JSON.stringify({
            query: searchQuery,
            timestamp: new Date().toISOString(),
          }),
        });
        
        toast({
          title: "Búsqueda enviada",
          description: "La búsqueda se ha procesado correctamente",
        });
      } catch (error) {
        console.error("Error al enviar búsqueda a n8n:", error);
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
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button 
          onClick={handleSearch}
          disabled={isLoading}
          className="h-12 px-8 bg-gradient-to-r from-primary to-primary-glow"
        >
          {isLoading ? (searchLabel ?? "Buscar") + "..." : searchLabel ?? "Buscar"}
        </Button>
      </div>
    </div>
  );
};
