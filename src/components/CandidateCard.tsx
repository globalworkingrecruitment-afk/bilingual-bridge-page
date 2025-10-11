import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Candidate } from "@/types/candidate";
import { Briefcase, User } from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  content: any;
}

export const CandidateCard = ({ candidate, content }: CandidateCardProps) => {
  const age = new Date().getFullYear() - candidate.birth_year;
  return (
    <Card className="hover:shadow-glow transition-all duration-300 border-2 hover:border-primary/50 group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{candidate.full_name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{content.candidateCard.age}:</span>
            <span className="font-medium">{age} {content.candidateCard.yearsOld}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
            {content.candidateCard.coverLetter}
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {candidate.cover_letter}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Briefcase className="w-4 h-4" />
            <span>{content.candidateCard.experiences}</span>
          </div>
          {candidate.experiences.length > 0 ? (
            <ul className="space-y-2">
              {candidate.experiences.map((experience, index) => (
                <li key={`${candidate.id}-${index}`} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{experience.title}</span>
                  {" "}
                  <span className="italic">({experience.duration})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {content.candidateCard.noExperience}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
