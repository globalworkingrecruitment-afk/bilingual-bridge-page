import { useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { CandidateSearch } from "@/components/CandidateSearch";
import { CandidatesSection } from "@/components/CandidatesSection";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";
import { mockCandidates } from "@/data/mockCandidates";
import { Candidate } from "@/types/candidate";

const Index = () => {
  const [language, setLanguage] = useState<"en" | "no">("en");
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(mockCandidates);
  const [n8nWebhook] = useState<string>(""); // Aquí el usuario puede añadir su webhook de n8n
  
  const content = language === "en" ? englishContent : norwegianContent;
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "no" : "en");
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredCandidates(mockCandidates);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = mockCandidates.filter(candidate => 
      candidate.name.toLowerCase().includes(lowerQuery) ||
      candidate.specialties.some(s => s.toLowerCase().includes(lowerQuery)) ||
      candidate.location.toLowerCase().includes(lowerQuery) ||
      candidate.languages.some(l => l.toLowerCase().includes(lowerQuery)) ||
      candidate.experience.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredCandidates(filtered);
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
          
          <CandidateSearch onSearch={handleSearch} n8nWebhookUrl={n8nWebhook} />
          <CandidatesSection candidates={filteredCandidates} />
        </div>
      </section>
      
      <footer className="py-8 text-center text-muted-foreground border-t mt-16">
        <p>© 2025 Global Working. {language === "en" ? "All rights reserved" : "Alle rettigheter reservert"}.</p>
      </footer>
    </div>
  );
};

export default Index;
