import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { CandidateSearch } from "@/components/CandidateSearch";
import { CandidatesSection } from "@/components/CandidatesSection";
import { ExperienceFilters } from "@/components/ExperienceFilters";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";
import { mockCandidates } from "@/data/mockCandidates";
import { Candidate, CareSetting } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { clearActivePortalUser, getActivePortalUser } from "@/lib/portalAuth";
import { ALLOW_DOMAIN_FALLBACK, APP_DOMAIN, getCurrentHost } from "@/lib/domainConfig";

const Index = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"en" | "no">("en");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSetting, setSelectedSetting] = useState<CareSetting | null>(null);
  const [n8nWebhook] = useState<string>(""); // Aquí el usuario puede añadir su webhook de n8n
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentHost, setCurrentHost] = useState<string>("");

  const content = language === "en" ? englishContent : norwegianContent;

  useEffect(() => {
    const user = getActivePortalUser();

    if (!user) {
      navigate("/auth", { replace: true });
    } else {
      setActiveUser(user);
    }

    setCheckingAuth(false);
  }, [navigate]);

  useEffect(() => {
    setCurrentHost(getCurrentHost());
  }, []);

  const handleLogout = () => {
    clearActivePortalUser();
    navigate("/auth", { replace: true });
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "no" : "en");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query.trim());
  };

  const experienceSections = useMemo(() => {
    const counts = new Map<CareSetting, Set<string>>([
      ["domicilio_geriatrico", new Set()],
      ["hospitalario", new Set()],
      ["urgencias", new Set()],
    ]);

    mockCandidates.forEach(candidate => {
      candidate.experiences.forEach(experience => {
        const bucket = counts.get(experience.care_setting);
        bucket?.add(candidate.id);
      });
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

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();

    return mockCandidates.filter((candidate: Candidate) => {
      const matchesExperience = selectedSetting
        ? candidate.experiences.some(experience => experience.care_setting === selectedSetting)
        : true;

      if (!matchesExperience) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        candidate.full_name.toLowerCase().includes(normalizedQuery) ||
        candidate.cover_letter.toLowerCase().includes(normalizedQuery) ||
        candidate.experiences.some(experience =>
          experience.title.toLowerCase().includes(normalizedQuery) ||
          experience.duration.toLowerCase().includes(normalizedQuery)
        )
      );
    });
  }, [searchQuery, selectedSetting]);

  const handleSelectExperience = (setting: CareSetting | null) => {
    setSelectedSetting(prev => (prev === setting ? null : setting));
  };

  const domainMatches = currentHost === APP_DOMAIN;

  const domainHelper = !domainMatches ? (
    !ALLOW_DOMAIN_FALLBACK ? (
      <Alert variant="destructive" className="mx-6 mt-4">
        <AlertTitle>{content.auth.domainErrorTitle}</AlertTitle>
        <AlertDescription>
          {content.auth.domainErrorMessage
            .replace("{{domain}}", APP_DOMAIN)
            .replace("{{current}}", currentHost || "")}
        </AlertDescription>
      </Alert>
    ) : (
      <Alert className="mx-6 mt-4">
        <AlertTitle>{content.auth.domainWarningTitle}</AlertTitle>
        <AlertDescription>
          {content.auth.domainWarningMessage
            .replace("{{domain}}", APP_DOMAIN)
            .replace("{{current}}", currentHost || "")}
        </AlertDescription>
      </Alert>
    )
  ) : null;

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">{content.portal.redirecting}</p>
      </div>
    );
  }

  if (!activeUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <LanguageToggle language={language} onToggle={toggleLanguage} />

      <div className="bg-slate-900 text-white px-6 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>
          {content.portal.signedInAs} <span className="font-semibold">{activeUser}</span>
        </p>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          {content.portal.logout}
        </Button>
      </div>

      {domainHelper}

      <Hero content={content.hero} />
      <Stats content={content.stats} />
      
      <section className="py-16 px-6">
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
          <CandidatesSection candidates={filteredCandidates} content={content} />
        </div>
      </section>
      
      <footer className="py-8 text-center text-muted-foreground border-t mt-16">
        <p>© 2025 Global Working. {language === "en" ? "All rights reserved" : "Alle rettigheter reservert"}.</p>
      </footer>
    </div>
  );
};

export default Index;
