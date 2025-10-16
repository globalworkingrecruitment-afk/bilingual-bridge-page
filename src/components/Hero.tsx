import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  content: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
  };
  onPrimaryAction?: () => void;
}

export const Hero = ({ content, onPrimaryAction }: HeroProps) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />

      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative max-w-5xl mx-auto text-center z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
          {content.title}
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
          {content.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
            onClick={onPrimaryAction}
          >
            {content.cta}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300"
          >
            {content.secondaryCta}
          </Button>
        </div>
      </div>
    </section>
  );
};
