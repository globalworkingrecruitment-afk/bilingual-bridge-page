import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CandidateSearchProps {
  onSearch: (query: string) => void;
  n8nWebhookUrl?: string;
}

export const CandidateSearch = ({ onSearch, n8nWebhookUrl }: CandidateSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    onSearch(searchQuery);
    
    if (n8nWebhookUrl && searchQuery.trim()) {
      setIsLoading(true);
      try {
        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
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
            placeholder="Buscar por especialidad, ubicación, idioma..."
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
          {isLoading ? "Buscando..." : "Buscar"}
        </Button>
      </div>
    </div>
  );
};
