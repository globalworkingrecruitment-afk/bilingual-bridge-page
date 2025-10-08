import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface CallToActionProps {
  content: {
    title: string;
    description: string;
    button: string;
  };
}

export const CallToAction = ({ content }: CallToActionProps) => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-12 border-2 border-border relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-card border border-border rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Limited Time Offer</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {content.title}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {content.description}
            </p>
            
            <Button 
              size="lg"
              className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-secondary hover:shadow-glow transition-all duration-300"
            >
              {content.button}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
