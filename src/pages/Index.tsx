import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { CandidateSearch } from "@/components/CandidateSearch";
import { CandidatesSection } from "@/components/CandidatesSection";
import { ExperienceFilters } from "@/components/ExperienceFilters";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";
import { Candidate, CandidateLocale } from "@/types/candidate";
import { candidateMatchesCriteria, parseSearchQuery } from "@/lib/search";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getN8nWebhookUrl } from "@/lib/env";
import { recordSearchQuery, updateSearchLogCandidates } from "@/lib/localDb";
import { useCandidateData } from "@/hooks/useCandidateData";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_WEBHOOK_URL = "https://primary-production-cdb3.up.railway.app/webhook-test/f989f35e-86b1-461a-bf6a-4be69ecc8f3a";
const DEFAULT_STATUS = "activo";

const getCandidateStatus = (candidate: Candidate): string => DEFAULT_STATUS;

const Index = () => {
  const [language, setLanguage] = useState<CandidateLocale>("en");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [webhookCandidateNames, setWebhookCandidateNames] = useState<string[]>([]);
  const [n8nWebhook] = useState<string>(() => getN8nWebhookUrl() ?? DEFAULT_WEBHOOK_URL);
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    candidates,
    loading: candidatesLoading,
    refreshing: candidatesRefreshing,
    error: candidatesError,
    refresh: reloadCandidates,
  } = useCandidateData();
  const candidatesSectionRef = useRef<HTMLElement | null>(null);
  const lastSearchLogRef = useRef<{ query: string; logId: string | null } | null>(null);

  const content = language === "en" ? englishContent : norwegianContent;

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "no" : "en"));
  };

  const handleSearch = useCallback(
    async (query: string, candidateNames?: string[]) => {
      const normalizedQuery = query.trim();
      const normalizedCandidateNames = candidateNames
        ? candidateNames.map((name) => name.trim()).filter((name) => name.length > 0)
        : [];

      setSearchQuery(normalizedQuery);
      setWebhookCandidateNames(normalizedCandidateNames);

      if (currentUser?.role === "user" && normalizedQuery) {
        try {
          if (!candidateNames) {
            const newLog = await recordSearchQuery(
              currentUser.username,
              normalizedQuery,
              normalizedCandidateNames,
            );
            lastSearchLogRef.current = newLog
              ? { query: normalizedQuery, logId: newLog.id }
              : { query: normalizedQuery, logId: null };
          } else {
            const lastSearch = lastSearchLogRef.current;
            const matchesLastQuery =
              lastSearch && lastSearch.query.trim().toLowerCase() === normalizedQuery.toLowerCase();

            if (matchesLastQuery && lastSearch.logId) {
              await updateSearchLogCandidates(lastSearch.logId, normalizedCandidateNames);
            } else {
              const newLog = await recordSearchQuery(
                currentUser.username,
                normalizedQuery,
                normalizedCandidateNames,
              );
              lastSearchLogRef.current = newLog
                ? { query: normalizedQuery, logId: newLog.id }
                : { query: normalizedQuery, logId: null };
            }
          }
        } catch (error) {
          lastSearchLogRef.current = null;
          const message =
            error instanceof Error
              ? error.message
              : "No se pudo registrar la búsqueda del empleador.";
          toast({ title: "Error al registrar búsqueda", description: message, variant: "destructive" });
        }
      }
    },
    [currentUser, toast],
  );

  const scrollToCandidates = () => {
    candidatesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const experienceSections = useMemo(() => {
    if (candidates.length === 0) {
      return [];
    }

    const statusCounts = new Map<string, number>();

    candidates.forEach(candidate => {
      const statusKey = getCandidateStatus(candidate);
      statusCounts.set(statusKey, (statusCounts.get(statusKey) ?? 0) + 1);
    });

    const order = ["activo", "reservado", "inactivo"];
    const groups = content.candidates.filters.groups as Record<string, string>;

    const normalizeLabel = (status: string) => {
      const label = groups[status];
      if (label) {
        return label;
      }

      return status
        .split(/[_-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    };

    const sections = Array.from(statusCounts.entries()).map(([status, count]) => ({
      id: status,
      label: normalizeLabel(status),
      count,
    }));

    const orderedSections = sections.sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);

      if (indexA === -1 && indexB === -1) {
        return a.label.localeCompare(b.label);
      }

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    return orderedSections;
  }, [candidates, content.candidates.filters.groups]);

  const searchCriteria = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  const normalizedWebhookNames = useMemo(
    () => new Set(webhookCandidateNames.map((name) => name.toLowerCase())),
    [webhookCandidateNames],
  );

  const filteredCandidates = useMemo(() => {
    if (candidates.length === 0) {
      return [];
    }

    return candidates.filter((candidate: Candidate) => {
      const candidateStatus = getCandidateStatus(candidate);
      const matchesSelectedStatus = selectedStatus ? candidateStatus === selectedStatus : true;

      if (!matchesSelectedStatus) {
        return false;
      }

      if (normalizedWebhookNames.size > 0) {
        return normalizedWebhookNames.has(candidate.fullName.trim().toLowerCase());
      }

      return candidateMatchesCriteria(candidate, searchCriteria);
    });
  }, [candidates, searchCriteria, selectedStatus, normalizedWebhookNames]);

  useEffect(() => {
    if (webhookCandidateNames.length > 0) {
      candidatesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [webhookCandidateNames]);

  const handleSelectStatus = (status: string | null) => {
    setSelectedStatus(prev => (prev === status ? null : status));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-col gap-4 px-6 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
          <div className="text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{currentUser?.username}</p>
            {currentUser?.role === "admin" && (
              <Badge variant="outline" className="uppercase tracking-wide">
                Administrator
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">
          <img
            src="/branding/globalworking-horizontal-color.svg"
            alt="Global Working"
            className="h-12 w-auto object-contain md:h-16"
          />
          <span className="hidden h-10 w-px bg-border md:block" aria-hidden="true" />
          <img
            src="/branding/redgw-color.svg"
            alt="RedGW"
            className="h-10 w-auto object-contain md:h-14"
          />
        </div>
        <div className="flex justify-start md:justify-end">
          <LanguageToggle language={language} onToggle={toggleLanguage} />
        </div>
      </header>

      <Hero content={content.hero} onPrimaryAction={scrollToCandidates} />
      <Stats content={content.stats} />
      
      <section ref={candidatesSectionRef} className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {content.candidates.title}
            </h2>
            <p className="text-lg text-muted-foreground">{content.candidates.subtitle}</p>
          </div>

          <CandidateSearch
            onSearch={handleSearch}
            n8nWebhookUrl={n8nWebhook}
            placeholder={content.search.placeholder}
            searchLabel={content.search.button}
          />

          {candidatesLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              {content.candidates.loading}
            </div>
          ) : candidatesError && candidates.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-xl font-semibold text-destructive">
                {content.candidates.loadError.title}
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {content.candidates.loadError.description}
              </p>
              <div>
                <Button type="button" variant="outline" onClick={reloadCandidates}>
                  {content.candidates.loadError.retry}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {candidatesError && candidates.length > 0 && (
                <div className="flex flex-col items-center gap-3 mb-6 text-center">
                  <p className="text-sm text-destructive">
                    {content.candidates.loadError.description}
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={reloadCandidates}>
                    {content.candidates.loadError.retry}
                  </Button>
                </div>
              )}
              <ExperienceFilters
                sections={experienceSections}
                selectedSection={selectedStatus}
                onSelect={handleSelectStatus}
                labels={content.candidates.filters}
              />
              {candidatesRefreshing && (
                <div className="flex justify-center mb-6">
                  <Badge variant="outline">{content.candidates.refreshing}</Badge>
                </div>
              )}
              <CandidatesSection candidates={filteredCandidates} content={content} locale={language} />
            </>
          )}
        </div>
      </section>

      <footer className="py-8 text-center text-muted-foreground border-t mt-16">
        <p>© 2025 Global Working. {language === "en" ? "All rights reserved" : "Alle rettigheter reservert"}.</p>
      </footer>
    </div>
  );
};

export default Index;
