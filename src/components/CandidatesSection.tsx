import { Candidate, CandidateLocale } from "@/types/candidate";
import type { AppContent } from "@/types/content";
import { CandidateCard } from "./CandidateCard";

interface CandidatesSectionProps {
  candidates: Candidate[];
  content: AppContent;
  locale: CandidateLocale;
}

export const CandidatesSection = ({ candidates, content, locale }: CandidatesSectionProps) => {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">{content.candidates.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} content={content} locale={locale} />
        ))}
      </div>
    </div>
  );
};
