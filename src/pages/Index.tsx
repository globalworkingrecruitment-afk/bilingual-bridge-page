import { useState } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Stats } from "@/components/Stats";
import { CallToAction } from "@/components/CallToAction";
import { englishContent } from "@/content/english";
import { norwegianContent } from "@/content/norwegian";

const Index = () => {
  const [language, setLanguage] = useState<"en" | "no">("en");
  
  const content = language === "en" ? englishContent : norwegianContent;
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "no" : "en");
  };

  return (
    <div className="min-h-screen bg-background">
      <LanguageToggle language={language} onToggle={toggleLanguage} />
      
      <Hero content={content.hero} />
      <Features content={content.features} />
      <Stats content={content.stats} />
      <CallToAction content={content.cta} />
      
      <footer className="py-8 text-center text-muted-foreground border-t">
        <p>© 2025 Global Working. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
