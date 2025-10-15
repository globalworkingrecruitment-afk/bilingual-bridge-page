import { useMemo, useRef, useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { CandidateSearch } from "@/components/CandidateSearch";
import { CandidatesSection } from "@/components/CandidatesSection";
import { ExperienceFilters } from "@/components/ExperienceFilters";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";
import { mockCandidates } from "@/data/mockCandidates";
import { BrandingShowcase } from "@/components/BrandingShowcase";
import { BrandingHighlights } from "@/components/BrandingHighlights";
import { Candidate, CandidateLocale, CareSetting } from "@/types/candidate";
import { candidateMatchesCriteria, parseSearchQuery } from "@/lib/search";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [language, setLanguage] = useState<CandidateLocale>("en");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSetting, setSelectedSetting] = useState<CareSetting | null>(null);
  const [n8nWebhook] = useState<string>(""); // Aquí el usuario puede añadir su webhook de n8n
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const candidatesSectionRef = useRef<HTMLDivElement | null>(null);

  const content = language === "en" ? englishContent : norwegianContent;

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "no" : "en"));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query.trim());
  };

  const scrollToCandidates = () => {
    candidatesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const experienceSections = useMemo(() => {
    const counts = new Map<CareSetting, Set<string>>([
      ["domicilio_geriatrico", new Set()],
      ["hospitalario", new Set()],
      ["urgencias", new Set()],
    ]);

    mockCandidates.forEach(candidate => {
      const setting = candidate.experienceDetail?.care_setting;
      if (!setting) return;

      const bucket = counts.get(setting);
      bucket?.add(candidate.id);
    });

    const order: CareSetting[] = [
      "domicilio_geriatrico",
      "hospitalario",
      "urgencias",
    ];

    return order
      .map(setting => ({
        id: setting,
        label: content.candidates.filters.groups[setting],
        count: counts.get(setting)?.size ?? 0,
      }))
      .filter(section => section.count > 0);
  }, [content.candidates.filters.groups]);

  const searchCriteria = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter((candidate: Candidate) => {
      const matchesSelectedExperience = selectedSetting
        ? candidate.experienceDetail?.care_setting === selectedSetting
        : true;

      if (!matchesSelectedExperience) {
        return false;
      }

      return candidateMatchesCriteria(candidate, searchCriteria);
    });
  }, [searchCriteria, selectedSetting]);

  const handleSelectExperience = (setting: CareSetting | null) => {
    setSelectedSetting(prev => (prev === setting ? null : setting));
  };

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-start">
          <div className="flex items-center gap-4">
            <img
              src="/branding/globalworking-horizontal-color.svg"
              alt="Global Working"
              className="h-10 w-auto md:h-12"
            />
            <span className="hidden h-8 w-px bg-border md:block" aria-hidden="true" />
            <img
              src="/branding/redgw-color.svg"
              alt="RedGW"
              className="h-8 w-auto md:h-10"
            />
          </div>
          <LanguageToggle language={language} onToggle={toggleLanguage} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="text-right text-sm text-muted-foreground">
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
      </div>

      <Hero content={content.hero} onPrimaryAction={scrollToCandidates} />
      <Stats content={content.stats} />
      
      <section ref={candidatesSectionRef} className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {language === "en" ? "Available Professionals" : "Tilgjengelige Fagfolk"}
            </h2>
            <p className="text-lg text-muted-foreground">
              {language === "en" 
                ? "Find the perfect healthcare professional for your team" 
                : "Finn den perfekte helsepersonell til teamet ditt"}
            </p>
          </div>
          
          <CandidateSearch
            onSearch={handleSearch}
            n8nWebhookUrl={n8nWebhook}
            placeholder={content.search.placeholder}
            searchLabel={content.search.button}
          />
          <ExperienceFilters
            sections={experienceSections}
            selectedSection={selectedSetting}
            onSelect={handleSelectExperience}
            labels={content.candidates.filters}
          />
          <CandidatesSection
            candidates={filteredCandidates}
            content={content}
            locale={language}
          />
        </div>
      </section>

      <BrandingShowcase language={language} />

      <footer className="py-8 text-center text-muted-foreground border-t mt-16">
        <p>© 2025 Global Working. {language === "en" ? "All rights reserved" : "Alle rettigheter reservert"}.</p>
      </footer>
    </div>
  );
};

export default Index;
