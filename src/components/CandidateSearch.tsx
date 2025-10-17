import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { parseSearchQuery } from "@/lib/search";

interface CandidateSearchProps {
  onSearch: (query: string) => void | Promise<void>;
  placeholder?: string;
  searchLabel?: string;
}

export const CandidateSearch = ({ onSearch, placeholder, searchLabel }: CandidateSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    const extractedKeywords = trimmedQuery ? parseSearchQuery(trimmedQuery).keywords : [];
    setKeywords(extractedKeywords);

    if (!trimmedQuery) {
      return;
    }

    setIsLoading(true);
    try {
      await onSearch(trimmedQuery);
    } finally {
      setIsLoading(false);
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
      {keywords.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Palabras clave detectadas: <span className="font-medium text-foreground">{keywords.join(", ")}</span>
        </p>
      )}
    </div>
  );
};
