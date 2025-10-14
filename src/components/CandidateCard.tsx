import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Candidate } from "@/types/candidate";
import { Briefcase, FileText, GraduationCap, Languages, Plus } from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  content: any;
}

export const CandidateCard = ({ candidate, content }: CandidateCardProps) => {
  const experienceHighlights = candidate.experience
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  return (
    <Card className="hover:shadow-glow transition-all duration-300 border-2 hover:border-primary/50 group">
      <CardHeader className="pb-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{candidate.full_name}</h3>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {content.candidateCard.profession}
              </p>
              <p className="text-sm text-muted-foreground">{candidate.profession}</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={content.candidateCard.openDetails}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{candidate.full_name}</DialogTitle>
                <DialogDescription>{content.candidateCard.detailDescription}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {content.candidateCard.education}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {candidate.education}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {content.candidateCard.coverLetterFull}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {candidate.cover_letter_full}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <Languages className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {content.candidateCard.languages}
            </p>
            <p className="text-sm text-muted-foreground">{candidate.languages}</p>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
            {content.candidateCard.summary}
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {candidate.cover_letter_summary}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Briefcase className="w-4 h-4" />
              <span>{content.candidateCard.experiences}</span>
            </div>
            {candidate.experiences.length > 0 ? (
              <ul className="space-y-2">
                {candidate.experiences.map((experience, index) => (
                  <li key={`${candidate.id}-${index}`} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{experience.title}</span>{" "}
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

          {experienceHighlights.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">
                {content.candidateCard.experienceOverview}
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {experienceHighlights.map((item, index) => (
                  <li key={`${candidate.id}-highlight-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
