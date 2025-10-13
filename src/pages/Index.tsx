import { useMemo, useState } from "react";
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
import { candidateMatchesCriteria, parseSearchQuery } from "@/lib/search";

const Index = () => {
  const [language, setLanguage] = useState<"en" | "no">("en");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSetting, setSelectedSetting] = useState<CareSetting | null>(null);
  const [n8nWebhook] = useState<string>(""); // Aquí el usuario puede añadir su webhook de n8n

  const content = language === "en" ? englishContent : norwegianContent;

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

  const searchCriteria = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter((candidate: Candidate) => {
      const matchesSelectedExperience = selectedSetting
        ? candidate.experiences.some(experience => experience.care_setting === selectedSetting)
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

  return (
    <div className="min-h-screen bg-background">
      <LanguageToggle language={language} onToggle={toggleLanguage} />

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
