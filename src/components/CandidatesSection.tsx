import { useMemo, useState } from "react";
import { Candidate } from "@/types/candidate";
import { CandidateCard } from "./CandidateCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface CandidatesSectionProps {
  candidates: Candidate[];
  language: "en" | "no";
  content: any;
}

export const CandidatesSection = ({ candidates, language, content }: CandidatesSectionProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("all");

  // Get all unique specialties
  const specialties = useMemo(() => {
    const allSpecialties = new Set<string>();
    candidates.forEach((candidate) => {
      candidate.specialties.forEach((specialty) => {
        allSpecialties.add(specialty);
      });
    });
    return Array.from(allSpecialties).sort();
  }, [candidates]);

  // Filter candidates by selected specialty
  const filteredCandidates = useMemo(() => {
    if (selectedTab === "all") {
      return candidates;
    }
    return candidates.filter((candidate) =>
      candidate.specialties.includes(selectedTab)
    );
  }, [candidates, selectedTab]);

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">{content.candidates.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-card p-2">
          <TabsTrigger value="all" className="flex-1 min-w-[120px]">
            {content.candidates.allSpecialties}
          </TabsTrigger>
          {specialties.map((specialty) => (
            <TabsTrigger key={specialty} value={specialty} className="flex-1 min-w-[120px]">
              {specialty}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="mt-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                language={language}
                content={content}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
