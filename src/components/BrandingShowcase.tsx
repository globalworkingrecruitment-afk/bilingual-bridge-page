import { CandidateLocale } from "@/types/candidate";

const logos = [
  {
    src: "/branding/LogoGrandeHorizontal.png",
    alt: "Global Working LogoGrande horizontal logo in color",
    label: "LogoGrande — Horizontal (Color)",
  },
  {
    src: "/branding/globalworking-stacked-color.svg",
    alt: "Global Working stacked logo in color",
    label: "Global Working — Stacked (Color)",
  },
  {
    src: "/branding/globalworking-stacked-white.svg",
    alt: "Global Working stacked logo in white",
    label: "Global Working — Stacked (White)",
  },
  {
    src: "/branding/LogoGrandeHorizontal.png",
    alt: "Global Working LogoGrande horizontal logo in color",
    label: "LogoGrande — Horizontal",
  },
  {
    src: "/branding/redgw-color.svg",
    alt: "RedGW color logo",
    label: "RedGW — Color",
  },
  {
    src: "/branding/redgw-white.svg",
    alt: "RedGW white logo",
    label: "RedGW — White",
  },
];

const copy = {
  en: {
    title: "Brand assets",
    description:
      "Explore the official Global Working and RedGW logos. Download them directly from this page to ensure consistent use across your communications.",
    downloadHint:
      "Right-click or long-press any logo to download the original file without modifications.",
  },
  no: {
    title: "Merkevareelementer",
    description:
      "Utforsk de offisielle logoene til Global Working og RedGW. Last dem ned direkte fra denne siden for å sikre konsekvent bruk i kommunikasjonen deres.",
    downloadHint:
      "Høyreklikk eller trykk og hold på en logo for å laste ned originalfilen uten endringer.",
  },
} satisfies Record<CandidateLocale, { title: string; description: string; downloadHint: string }>;

interface BrandingShowcaseProps {
  language: CandidateLocale;
}

export const BrandingShowcase = ({ language }: BrandingShowcaseProps) => {
  const { title, description, downloadHint } = copy[language];

  return (
    <section className="bg-muted/30 py-16 px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="max-w-3xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
          <p className="text-base text-muted-foreground sm:text-lg">{description}</p>
          <p className="text-sm text-muted-foreground">{downloadHint}</p>
        </header>
        <ul className="grid gap-8 sm:grid-cols-2">
          {logos.map(logo => (
            <li
              key={logo.src}
              className="group relative flex flex-col items-center gap-4 rounded-lg border bg-background/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-48 w-full items-center justify-center rounded-md bg-gradient-to-br from-background via-background to-muted p-4">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-full w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground">{logo.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
