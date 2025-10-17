import { CandidateLocale } from "@/types/candidate";

const colorLogos = [
  {
    src: "/branding/LogoGrandeHorizontal.png",
    alt: "Global Working LogoGrande horizontal logo in color",
    label: "LogoGrande Horizontal",
  },
  {
    src: "/branding/globalworking-stacked-color.svg",
    alt: "Global Working stacked logo in color",
    label: "Global Working Stacked",
  },
  {
    src: "/branding/redgw-color.svg",
    alt: "RedGW color logo",
    label: "RedGW Color",
  },
];

const monochromeLogos = [
  {
    src: "/branding/globalworking-horizontal-white-signature.svg",
    alt: "Global Working horizontal signature logo in white",
    label: "Global Working Signature",
  },
  {
    src: "/branding/globalworking-stacked-white.svg",
    alt: "Global Working stacked logo in white",
    label: "Global Working White",
  },
  {
    src: "/branding/redgw-white.svg",
    alt: "RedGW white logo",
    label: "RedGW White",
  },
];

const copy = {
  en: {
    colorTitle: "Our brand, front and center",
    colorDescription:
      "Display our vibrant Global Working and RedGW marks prominently across your communication to reinforce a united presence.",
    colorDetails: "Primary full-color logos for light backgrounds",
    monochromeTitle: "Confident in contrast",
    monochromeDescription:
      "When layouts call for darker palettes, rely on the white signatures to maintain clarity and recognition.",
    monochromeDetails: "White marks for dark and immersive sections",
  },
  no: {
    colorTitle: "Vår merkevare i fokus",
    colorDescription:
      "Vis de livlige logoene til Global Working og RedGW tydelig for å styrke en samlet merkevare i kommunikasjonen deres.",
    colorDetails: "Primære fullfargelogoer for lyse bakgrunner",
    monochromeTitle: "Tydelig i kontrast",
    monochromeDescription:
      "Når designet krever mørkere flater, kan dere bruke hvite signaturer for å sikre tydelighet og gjenkjenning.",
    monochromeDetails: "Hvite merker for mørke og stemningsfulle seksjoner",
  },
} satisfies Record<
  CandidateLocale,
  {
    colorTitle: string;
    colorDescription: string;
    colorDetails: string;
    monochromeTitle: string;
    monochromeDescription: string;
    monochromeDetails: string;
  }
>;

interface BrandingHighlightsProps {
  language: CandidateLocale;
}

export const BrandingHighlights = ({ language }: BrandingHighlightsProps) => {
  const {
    colorTitle,
    colorDescription,
    colorDetails,
    monochromeTitle,
    monochromeDescription,
    monochromeDetails,
  } = copy[language];

  return (
    <section className="px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <div className="grid gap-10 rounded-3xl border bg-card/90 p-10 shadow-sm backdrop-blur lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{colorDetails}</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{colorTitle}</h2>
            <p className="text-base text-muted-foreground sm:text-lg">{colorDescription}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {colorLogos.map(logo => (
              <div
                key={logo.src}
                className="flex flex-col items-center gap-3 rounded-2xl border bg-background/80 p-6 text-center shadow-sm"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-20 w-auto object-contain"
                  loading="lazy"
                />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{logo.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-white shadow-lg">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-secondary/80">{monochromeDetails}</p>
              <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">{monochromeTitle}</h3>
              <p className="text-base text-slate-200 sm:text-lg">{monochromeDescription}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {monochromeLogos.map(logo => (
                <div
                  key={logo.src}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                  />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-200">{logo.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
