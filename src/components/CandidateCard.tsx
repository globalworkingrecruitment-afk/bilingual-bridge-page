import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";
import { MapPin, Calendar, Languages, Award, User } from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  language: "en" | "no";
  content: any;
}

export const CandidateCard = ({ candidate, language, content }: CandidateCardProps) => {
  const age = new Date().getFullYear() - candidate.birth_year;
  return (
    <Card className="hover:shadow-glow transition-all duration-300 border-2 hover:border-primary/50 group">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {candidate.photo && (
            <img 
              src={candidate.photo} 
              alt={candidate.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/50 transition-all duration-300"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{candidate.name}</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {candidate.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="bg-gradient-to-r from-primary/20 to-secondary/20">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{candidate.presentation}</p>
        <p className="text-sm text-muted-foreground italic">{candidate.experience}</p>
        
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">{content.candidateCard.age}:</span>
          <span className="font-medium">{age} {content.candidateCard.yearsOld}</span>
        </div>
        
        {candidate.availability && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{content.candidateCard.availability}:</span>
            <span className="font-medium">{candidate.availability}</span>
          </div>
        )}
        
        {candidate.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{candidate.location}</span>
          </div>
        )}
        
        {candidate.languages && candidate.languages.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Languages className="w-4 h-4 text-primary mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {candidate.languages.map((lang, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {candidate.certifications && candidate.certifications.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Award className="w-4 h-4 text-primary mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {candidate.certifications.map((cert, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
