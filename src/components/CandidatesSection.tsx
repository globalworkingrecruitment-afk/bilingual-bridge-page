import { useMemo } from "react";
import { Candidate } from "@/types/candidate";
import { CandidateCard } from "./CandidateCard";

interface CandidatesSectionProps {
  candidates: Candidate[];
}

export const CandidatesSection = ({ candidates }: CandidatesSectionProps) => {
  // Agrupar candidatos automáticamente por especialidades
  const groupedCandidates = useMemo(() => {
    const groups: Record<string, Candidate[]> = {};
    
    candidates.forEach((candidate) => {
      candidate.specialties.forEach((specialty) => {
        if (!groups[specialty]) {
          groups[specialty] = [];
        }
        if (!groups[specialty].find(c => c.id === candidate.id)) {
          groups[specialty].push(candidate);
        }
      });
    });
    
    return groups;
  }, [candidates]);

  const specialties = Object.keys(groupedCandidates).sort();

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No se encontraron candidatos</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {specialties.map((specialty) => (
        <div key={specialty} className="scroll-mt-24">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {specialty}
            </h2>
            <p className="text-muted-foreground">
              {groupedCandidates[specialty].length} {groupedCandidates[specialty].length === 1 ? 'profesional disponible' : 'profesionales disponibles'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedCandidates[specialty].map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
