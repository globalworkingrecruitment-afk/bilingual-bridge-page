import { Candidate } from "@/types/candidate";

const joinParagraphs = (lines: string[]): string => lines.join("\n");
const summarize = (lines: string[]): string => lines.slice(0, 2).join(" ");

const normalizeLanguages = (input: string | string[]): string[] => {
  if (Array.isArray(input)) {
    return input.map((item) => item.trim()).filter(Boolean);
  }

  return input
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
};

type LocaleSeed = {
  profession: string;
  medicalExperience?: string | null;
  nonMedicalExperience?: string | null;
  education?: string | null;
  languages: string | string[];
  coverLetterParagraphs: string[];
  summaryOverride?: string | null;
};

type CandidateSeed = {
  id: string;
  nombre: string;
  birthYear: number;
  correo: string;
  estado?: string;
  createdAt: string;
  updatedAt: string;
  en: LocaleSeed;
  no: LocaleSeed;
};

const createCandidate = (seed: CandidateSeed): Candidate => {
  const { en, no } = seed;

  const languagesEn = normalizeLanguages(en.languages);
  const languagesNo = normalizeLanguages(no.languages);

  const coverSummaryEn = en.summaryOverride ?? summarize(en.coverLetterParagraphs);
  const coverFullEn = joinParagraphs(en.coverLetterParagraphs);
  const coverSummaryNo = no.summaryOverride ?? summarize(no.coverLetterParagraphs);
  const coverFullNo = joinParagraphs(no.coverLetterParagraphs);

  return {
    id: seed.id,
    nombre: seed.nombre,
    experiencia_medica_en: en.medicalExperience ?? null,
    experiencia_medica_no: no.medicalExperience ?? null,
    experiencia_no_medica_en: en.nonMedicalExperience ?? null,
    experiencia_no_medica_no: no.nonMedicalExperience ?? null,
    formacion_en: en.education ?? null,
    formacion_no: no.education ?? null,
    profesion_en: en.profession,
    profesion_no: no.profession,
    idiomas_en: languagesEn,
    idiomas_no: languagesNo,
    carta_resumen_en: coverSummaryEn,
    carta_en: coverFullEn,
    carta_resumen_no: coverSummaryNo,
    carta_no: coverFullNo,
    estado: seed.estado ?? "activo",
    anio_nacimiento: seed.birthYear,
    correo: seed.correo,
    created_at: seed.createdAt,
    updated_at: seed.updatedAt,
  };
};

const candidatesSeeds: CandidateSeed[] = [
  {
    id: "1",
    nombre: "Ana Martínez",
    birthYear: 1988,
    correo: "ana.martinez@example.com",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-05-01T10:30:00Z",
    en: {
      profession: "Geriatric nurse",
      medicalExperience: "Lead nurse in assisted living facility (4 years)",
      languages: ["Spanish (native)", "English (B2)"],
      education: "Bachelor of Nursing – University of Salamanca (2010)",
      coverLetterParagraphs: [
        "I am a registered nurse who thrives in geriatric settings and comprehensive home support programs.",
        "I quickly adapt to multicultural routines and collaborate smoothly with multidisciplinary teams.",
        "I enjoy building personalised care plans together with families and social workers.",
        "My focus is to provide continuity for chronic patients while monitoring early signs of decline.",
        "I value open communication with colleagues and facility managers.",
        "I am ready to bring this stability to long-term care services across Norway.",
      ],
    },
    no: {
      profession: "Geriatrisk sykepleier",
      medicalExperience: "Fagleder ved omsorgsbolig for eldre (4 år)",
      languages: ["Spansk (morsmål)", "Engelsk (B2)"],
      education: "Bachelor i sykepleie – Universidad de Salamanca (2010)",
      coverLetterParagraphs: [
        "Jeg er en autorisert sykepleier som trives med helhetlig geriatrisk omsorg og hjemmeoppfølging.",
        "Jeg tilpasser meg raskt flerkulturelle arbeidsrutiner og samarbeider tett med tverrfaglige team.",
        "Jeg liker å utarbeide individuelle pleieplaner i dialog med familier og sosialtjeneste.",
        "Målet mitt er å gi kontinuitet for kroniske pasienter og oppdage endringer tidlig.",
        "Jeg setter pris på åpen kommunikasjon med kollegaer og avdelingsledere.",
        "Nå ønsker jeg å bidra med denne roen i norske bofellesskap og omsorgsboliger.",
      ],
    },
  },
  {
    id: "2",
    nombre: "Carlos Rodríguez",
    birthYear: 1990,
    correo: "carlos.rodriguez@example.com",
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-05-01T11:00:00Z",
    en: {
      profession: "Emergency nurse",
      medicalExperience: "Emergency department nurse in tertiary hospital (5 years)",
      languages: ["Spanish (native)", "English (C1)"],
      education: "Bachelor of Nursing – Complutense University of Madrid (2012)",
      coverLetterParagraphs: [
        "Emergency nurse focused on critical care pathways and rapid triage.",
        "Managed high-pressure shifts while keeping protocols and response times on track.",
        "Enjoy working in coordinated teams where mutual support is essential.",
        "Stay calm in demanding scenarios and prioritise patient safety.",
        "Share knowledge through simulations and clinical briefings.",
        "Looking to grow in Nordic hospitals with advanced technology.",
      ],
    },
    no: {
      profession: "Akuttsykepleier",
      medicalExperience: "Sykepleier ved akuttmottak på regionsykehus (5 år)",
      languages: ["Spansk (morsmål)", "Engelsk (C1)"],
      education: "Bachelor i sykepleie – Universidad Complutense de Madrid (2012)",
      coverLetterParagraphs: [
        "Akuttsykepleier med fokus på kritiske pasientforløp og rask triagering.",
        "Har ledet travle vakter og sikret etterlevelse av prosedyrer og responstider.",
        "Trives i koordinerte team der vi støtter hverandre.",
        "Bevarer roen i krevende situasjoner og setter pasientsikkerhet først.",
        "Deler erfaring via simuleringer og faglige gjennomganger.",
        "Ønsker å utvikle meg videre ved nordiske sykehus med moderne teknologi.",
      ],
    },
  },
  {
    id: "3",
    nombre: "María López",
    birthYear: 1985,
    correo: "maria.lopez@example.com",
    createdAt: "2024-01-17T09:00:00Z",
    updatedAt: "2024-05-01T11:30:00Z",
    en: {
      profession: "Neurological physiotherapist",
      medicalExperience: "Hospital-based neurological rehabilitation specialist (6 years)",
      languages: ["Spanish (native)", "English (B2)", "Norwegian (A2)"],
      education: "Physiotherapy degree – University of Valencia (2007)",
      coverLetterParagraphs: [
        "Physiotherapist dedicated to neurological and geriatric rehabilitation.",
        "Work closely with occupational therapists and rehab physicians.",
        "Focus on measurable functional goals with continuous follow-up.",
        "Promote patient autonomy with tailored exercise programmes.",
        "Enthusiastic about bringing evidence-based therapies into practice.",
        "Eager to contribute in specialised Scandinavian centres.",
      ],
    },
    no: {
      profession: "Nevrologisk fysioterapeut",
      medicalExperience: "Fysioterapeut innen nevrologisk rehabilitering på sykehus (6 år)",
      languages: ["Spansk (morsmål)", "Engelsk (B2)", "Norsk (A2)"],
      education: "Bachelor i fysioterapi – Universidad de Valencia (2007)",
      coverLetterParagraphs: [
        "Fysioterapeut med hovedfokus på nevrologisk og geriatrisk rehabilitering.",
        "Samarbeider tett med ergoterapeuter og rehabiliteringsleger.",
        "Setter målbare funksjonsmål og følger opp kontinuerlig.",
        "Fremmer pasientens selvstendighet med skreddersydde treningsopplegg.",
        "Bruker gjerne forskningsbaserte metoder i hverdagen.",
        "Vil gjerne bidra ved spesialiserte klinikker i Skandinavia.",
      ],
    },
  },
  {
    id: "4",
    nombre: "Juan Sánchez",
    birthYear: 1989,
    correo: "juan.sanchez@example.com",
    createdAt: "2024-01-18T09:00:00Z",
    updatedAt: "2024-05-01T12:00:00Z",
    en: {
      profession: "Intensive care nurse",
      medicalExperience: "Multidisciplinary ICU nurse (4 years)",
      languages: ["Spanish (native)", "English (B2)"],
      education: "Master in Critical Care Nursing – University of Barcelona (2015)",
      coverLetterParagraphs: [
        "Intensive care nurse with solid knowledge in ventilatory support.",
        "Active member of clinical safety committees and simulation drills.",
        "Interested in implementing sedation and analgesia protocols based on guidelines.",
        "Value ongoing training and mentoring for junior colleagues.",
        "Collaborate with anaesthetists and perfusionists on integrated plans.",
        "Aim to join human-centred ICUs with advanced technology.",
      ],
    },
    no: {
      profession: "Intensivsykepleier",
      medicalExperience: "Sykepleier ved tverrfaglig intensivavdeling (4 år)",
      languages: ["Spansk (morsmål)", "Engelsk (B2)"],
      education: "Master i intensivsykepleie – Universidad de Barcelona (2015)",
      coverLetterParagraphs: [
        "Intensivsykepleier med solid kompetanse på ventilasjonsstøtte.",
        "Deltar aktivt i pasientsikkerhetsutvalg og simuleringsøvelser.",
        "Vil implementere sedasjons- og smertelindringsprotokoller i tråd med retningslinjer.",
        "Vektlegger faglig utvikling og veiledning av nye kollegaer.",
        "Samarbeider med anestesileger og perfusjonister om helhetlige planer.",
        "Ønsker å bidra i norske intensivavdelinger med menneskelig fokus og moderne teknologi.",
      ],
    },
  },
  {
    id: "5",
    nombre: "Laura Fernández",
    birthYear: 1992,
    correo: "laura.fernandez@example.com",
    createdAt: "2024-01-19T09:00:00Z",
    updatedAt: "2024-05-01T12:30:00Z",
    en: {
      profession: "Community nurse",
      medicalExperience: "Chronic home-care nurse (3 years)",
      languages: ["Spanish (native)", "English (B1)", "Norwegian (A2)"],
      education: "Community Nursing degree – University of Zaragoza (2014)",
      coverLetterParagraphs: [
        "Community nurse oriented to home visits and health education.",
        "Enjoy coordinating schedules and resources with social workers.",
        "Encourage treatment adherence through regular follow-ups.",
        "Support informal caregivers with clear guidance and materials.",
        "Take part in prevention and vaccination campaigns in vulnerable districts.",
        "Keen to transfer this experience to growing Norwegian municipalities.",
      ],
    },
    no: {
      profession: "Hjemmesykepleier",
      medicalExperience: "Sykepleier i hjemmebaserte tjenester for kronikere (3 år)",
      languages: ["Spansk (morsmål)", "Engelsk (B1)", "Norsk (A2)"],
      education: "Bachelor i samfunnssykepleie – Universidad de Zaragoza (2014)",
      coverLetterParagraphs: [
        "Hjemmesykepleier med vekt på oppsøkende arbeid og helseinformasjon.",
        "Liker å koordinere planer og ressurser sammen med sosialtjenesten.",
        "Følger opp pasienter jevnlig for å styrke behandlingsetterlevelse.",
        "Veileder pårørende med konkrete råd og materiell.",
        "Bidrar i forebyggende kampanjer og vaksinasjoner i utsatte områder.",
        "Vil ta med erfaringen inn i norske kommuner i utvikling.",
      ],
    },
  },
  {
    id: "6",
    nombre: "Nora Aguilar",
    birthYear: 1995,
    correo: "nora.aguilar@example.com",
    createdAt: "2024-01-20T09:00:00Z",
    updatedAt: "2024-05-01T13:00:00Z",
    en: {
      profession: "Junior primary care nurse",
      medicalExperience: "Hospital clinical rotations (1 year)",
      languages: ["Spanish (native)", "English (B2)"],
      education: "Bachelor of Nursing – University of Granada (2023)",
      coverLetterParagraphs: [
        "Recently graduated nurse motivated by family medicine and prevention.",
        "Combined internships with volunteer health campaigns.",
        "Learn new protocols quickly and enjoy mastering languages.",
        "Looking for a setting to build solid clinical skills.",
        "Bring a proactive attitude, active listening, and teamwork.",
        "Ready to begin my professional career in Norwegian primary care.",
      ],
    },
    no: {
      profession: "Junior sykepleier i primærhelsetjenesten",
      medicalExperience: "Kliniske praksisperioder på sykehus (1 år)",
      languages: ["Spansk (morsmål)", "Engelsk (B2)"],
      education: "Bachelor i sykepleie – Universidad de Granada (2023)",
      coverLetterParagraphs: [
        "Nyutdannet sykepleier med motivasjon for allmennpraksis og forebygging.",
        "Har kombinert praksisperioder med frivillige helsekampanjer.",
        "Lærer raskt nye prosedyrer og språk.",
        "Søker et miljø der jeg kan utvikle solide kliniske ferdigheter.",
        "Bidrar med proaktiv holdning, aktiv lytting og lagspill.",
        "Klar for å starte yrkeskarrieren i norsk primærhelsetjeneste.",
      ],
    },
  },
];

export const mockCandidates: Candidate[] = candidatesSeeds.map(createCandidate);
