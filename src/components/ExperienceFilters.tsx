import { Button } from "@/components/ui/button";
import { CareSetting } from "@/types/candidate";

interface ExperienceSection {
  id: CareSetting;
  label: string;
  count: number;
}

interface ExperienceFiltersProps {
  sections: ExperienceSection[];
  selectedSection: CareSetting | null;
  onSelect: (section: CareSetting | null) => void;
  labels: {
    title: string;
    all: string;
    groups: Record<CareSetting, string>;
  };
}

export const ExperienceFilters = ({
  sections,
  selectedSection,
  onSelect,
  labels,
}: ExperienceFiltersProps) => {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3 uppercase tracking-wide text-muted-foreground">
            {labels.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedSection === null ? "default" : "outline"}
              onClick={() => onSelect(null)}
              className={`${selectedSection === null ? "shadow-glow" : ""}`}
            >
              {labels.all}
            </Button>
            {sections.map((section) => {
              const isActive = selectedSection === section.id;
              return (
                <Button
                  key={section.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => onSelect(section.id)}
                  className={`${isActive ? "shadow-glow" : ""} flex items-center gap-2`}
                >
                  <span>{section.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? "border-primary-foreground/20 bg-primary-foreground/10"
                      : "border-border bg-background"
                  }`}>
                    {section.count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
