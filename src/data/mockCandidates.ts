import { Candidate, CandidateLocalizedProfile } from "@/types/candidate";

const joinParagraphs = (lines: string[]): string => lines.join("\n");
const summarize = (lines: string[]): string => lines.slice(0, 2).join(" ");

type ProfileInput = Omit<CandidateLocalizedProfile, "cover_letter_full" | "cover_letter_summary"> & {
  coverLetterParagraphs: string[];
};

const buildProfile = ({ coverLetterParagraphs, ...rest }: ProfileInput): CandidateLocalizedProfile => ({
  ...rest,
  cover_letter_full: joinParagraphs(coverLetterParagraphs),
  cover_letter_summary: summarize(coverLetterParagraphs),
});

const anaEnglish = buildProfile({
  profession: "Geriatric nurse",
  experience: "Lead nurse in assisted living facility (4 years)",
  languages: "Spanish (native), English (B2)",
  education: "Bachelor of Nursing – University of Salamanca (2010)",
  coverLetterParagraphs: [
    "I am a registered nurse who thrives in geriatric settings and comprehensive home support programs.",
    "I quickly adapt to multicultural routines and collaborate smoothly with multidisciplinary teams.",
    "I enjoy building personalised care plans together with families and social workers.",
    "My focus is to provide continuity for chronic patients while monitoring early signs of decline.",
    "I value open communication with colleagues and facility managers.",
    "I am ready to bring this stability to long-term care services across Norway.",
  ],
});

const anaNorwegian = buildProfile({
  profession: "Geriatrisk sykepleier",
  experience: "Fagleder ved omsorgsbolig for eldre (4 år)",
  languages: "Spansk (morsmål), engelsk (B2)",
  education: "Bachelor i sykepleie – Universidad de Salamanca (2010)",
  coverLetterParagraphs: [
    "Jeg er en autorisert sykepleier som trives med helhetlig geriatrisk omsorg og hjemmeoppfølging.",
    "Jeg tilpasser meg raskt flerkulturelle arbeidsrutiner og samarbeider tett med tverrfaglige team.",
    "Jeg liker å utarbeide individuelle pleieplaner i dialog med familier og sosialtjeneste.",
    "Målet mitt er å gi kontinuitet for kroniske pasienter og oppdage endringer tidlig.",
    "Jeg setter pris på åpen kommunikasjon med kollegaer og avdelingsledere.",
    "Nå ønsker jeg å bidra med denne roen i norske bofellesskap og omsorgsboliger.",
  ],
});

const carlosEnglish = buildProfile({
  profession: "Emergency nurse",
  experience: "Emergency department nurse in tertiary hospital (5 years)",
  languages: "Spanish (native), English (C1)",
  education: "Bachelor of Nursing – Complutense University of Madrid (2012)",
  coverLetterParagraphs: [
    "Emergency nurse focused on critical care pathways and rapid triage.",
    "Managed high-pressure shifts while keeping protocols and response times on track.",
    "Enjoy working in coordinated teams where mutual support is essential.",
    "Stay calm in demanding scenarios and prioritise patient safety.",
    "Share knowledge through simulations and clinical briefings.",
    "Looking to grow in Nordic hospitals with advanced technology.",
  ],
});

const carlosNorwegian = buildProfile({
  profession: "Akuttsykepleier",
  experience: "Sykepleier ved akuttmottak på regionsykehus (5 år)",
  languages: "Spansk (morsmål), engelsk (C1)",
  education: "Bachelor i sykepleie – Universidad Complutense de Madrid (2012)",
  coverLetterParagraphs: [
    "Akuttsykepleier med fokus på kritiske pasientforløp og rask triagering.",
    "Har ledet travle vakter og sikret etterlevelse av prosedyrer og responstider.",
    "Trives i koordinerte team der vi støtter hverandre.",
    "Bevarer roen i krevende situasjoner og setter pasientsikkerhet først.",
    "Deler erfaring via simuleringer og faglige gjennomganger.",
    "Ønsker å utvikle meg videre ved nordiske sykehus med moderne teknologi.",
  ],
});

const mariaEnglish = buildProfile({
  profession: "Neurological physiotherapist",
  experience: "Hospital-based neurological rehabilitation specialist (6 years)",
  languages: "Spanish (native), English (B2), Norwegian (A2)",
  education: "Physiotherapy degree – University of Valencia (2007)",
  coverLetterParagraphs: [
    "Physiotherapist dedicated to neurological and geriatric rehabilitation.",
    "Work closely with occupational therapists and rehab physicians.",
    "Focus on measurable functional goals with continuous follow-up.",
    "Promote patient autonomy with tailored exercise programmes.",
    "Enthusiastic about bringing evidence-based therapies into practice.",
    "Eager to contribute in specialised Scandinavian centres.",
  ],
});

const mariaNorwegian = buildProfile({
  profession: "Nevrologisk fysioterapeut",
  experience: "Fysioterapeut innen nevrologisk rehabilitering på sykehus (6 år)",
  languages: "Spansk (morsmål), engelsk (B2), norsk (A2)",
  education: "Bachelor i fysioterapi – Universidad de Valencia (2007)",
  coverLetterParagraphs: [
    "Fysioterapeut med hovedfokus på nevrologisk og geriatrisk rehabilitering.",
    "Samarbeider tett med ergoterapeuter og rehabiliteringsleger.",
    "Setter målbare funksjonsmål og følger opp kontinuerlig.",
    "Fremmer pasientens selvstendighet med skreddersydde treningsopplegg.",
    "Bruker gjerne forskningsbaserte metoder i hverdagen.",
    "Vil gjerne bidra ved spesialiserte klinikker i Skandinavia.",
  ],
});

const juanEnglish = buildProfile({
  profession: "Intensive care nurse",
  experience: "Multidisciplinary ICU nurse (4 years)",
  languages: "Spanish (native), English (B2)",
  education: "Master in Critical Care Nursing – University of Barcelona (2015)",
  coverLetterParagraphs: [
    "Intensive care nurse with solid knowledge in ventilatory support.",
    "Active member of clinical safety committees and simulation drills.",
    "Interested in implementing sedation and analgesia protocols based on guidelines.",
    "Value ongoing training and mentoring for junior colleagues.",
    "Collaborate with anaesthetists and perfusionists on integrated plans.",
    "Aim to join human-centred ICUs with advanced technology.",
  ],
});

const juanNorwegian = buildProfile({
  profession: "Intensivsykepleier",
  experience: "Sykepleier ved tverrfaglig intensivavdeling (4 år)",
  languages: "Spansk (morsmål), engelsk (B2)",
  education: "Master i intensivsykepleie – Universidad de Barcelona (2015)",
  coverLetterParagraphs: [
    "Intensivsykepleier med solid kompetanse på ventilasjonsstøtte.",
    "Deltar aktivt i pasientsikkerhetsutvalg og simuleringsøvelser.",
    "Vil implementere sedasjons- og smertelindringsprotokoller i tråd med retningslinjer.",
    "Vektlegger faglig utvikling og veiledning av nye kollegaer.",
    "Samarbeider med anestesileger og perfusjonister om helhetlige planer.",
    "Ønsker å bidra i norske intensivavdelinger med menneskelig fokus og moderne teknologi.",
  ],
});

const lauraEnglish = buildProfile({
  profession: "Community nurse",
  experience: "Chronic home-care nurse (3 years)",
  languages: "Spanish (native), English (B1), Norwegian (A2)",
  education: "Community Nursing degree – University of Zaragoza (2014)",
  coverLetterParagraphs: [
    "Community nurse oriented to home visits and health education.",
    "Enjoy coordinating schedules and resources with social workers.",
    "Encourage treatment adherence through regular follow-ups.",
    "Support informal caregivers with clear guidance and materials.",
    "Take part in prevention and vaccination campaigns in vulnerable districts.",
    "Keen to transfer this experience to growing Norwegian municipalities.",
  ],
});

const lauraNorwegian = buildProfile({
  profession: "Hjemmesykepleier",
  experience: "Sykepleier i hjemmebaserte tjenester for kronikere (3 år)",
  languages: "Spansk (morsmål), engelsk (B1), norsk (A2)",
  education: "Bachelor i samfunnssykepleie – Universidad de Zaragoza (2014)",
  coverLetterParagraphs: [
    "Hjemmesykepleier med vekt på oppsøkende arbeid og helseinformasjon.",
    "Liker å koordinere planer og ressurser sammen med sosialtjenesten.",
    "Følger opp pasienter jevnlig for å styrke behandlingsetterlevelse.",
    "Veileder pårørende med konkrete råd og materiell.",
    "Bidrar i forebyggende kampanjer og vaksinasjoner i utsatte områder.",
    "Vil ta med erfaringen inn i norske kommuner i utvikling.",
  ],
});

const noraEnglish = buildProfile({
  profession: "Junior primary care nurse",
  experience: "Hospital clinical rotations (1 year)",
  languages: "Spanish (native), English (B2)",
  education: "Bachelor of Nursing – University of Granada (2023)",
  coverLetterParagraphs: [
    "Recently graduated nurse motivated by family medicine and prevention.",
    "Combined internships with volunteer health campaigns.",
    "Learn new protocols quickly and enjoy mastering languages.",
    "Looking for a setting to build solid clinical skills.",
    "Bring a proactive attitude, active listening, and teamwork.",
    "Ready to begin my professional career in Norwegian primary care.",
  ],
});

const noraNorwegian = buildProfile({
  profession: "Junior sykepleier i primærhelsetjenesten",
  experience: "Kliniske praksisperioder på sykehus (1 år)",
  languages: "Spansk (morsmål), engelsk (B2)",
  education: "Bachelor i sykepleie – Universidad de Granada (2023)",
  coverLetterParagraphs: [
    "Nyutdannet sykepleier med motivasjon for allmennpraksis og forebygging.",
    "Har kombinert praksisperioder med frivillige helsekampanjer.",
    "Lærer raskt nye prosedyrer og språk.",
    "Søker et miljø der jeg kan utvikle solide kliniske ferdigheter.",
    "Bidrar med proaktiv holdning, aktiv lytting og lagspill.",
    "Klar for å starte yrkeskarrieren i norsk primærhelsetjeneste.",
  ],
});

export const mockCandidates: Candidate[] = [
  {
    id: "1",
    full_name: "Ana Martínez",
    birth_date: "1988-03-12",
    email: "ana.martinez@example.com",
    phone: "+34 600 123 456",
    profile_en: anaEnglish,
    profile_no: anaNorwegian,
    experienceDetail: {
      title: "Residential geriatric supervisor",
      duration: "4 years",
      care_setting: "domicilio_geriatrico",
      titles: {
        en: "Residential geriatric supervisor",
        no: "Avdelingssykepleier i omsorgsbolig",
      },
      durations: {
        en: "4 years",
        no: "4 år",
      },
    },
  },
  {
    id: "2",
    full_name: "Carlos Rodríguez",
    birth_date: "1990-07-04",
    email: "carlos.rodriguez@example.com",
    phone: "+34 600 234 567",
    profile_en: carlosEnglish,
    profile_no: carlosNorwegian,
    experienceDetail: {
      title: "Emergency department nurse",
      duration: "5 years",
      care_setting: "urgencias",
      titles: {
        en: "Emergency department nurse",
        no: "Sykepleier ved akuttmottak",
      },
      durations: {
        en: "5 years",
        no: "5 år",
      },
    },
  },
  {
    id: "3",
    full_name: "María López",
    birth_date: "1985-11-21",
    email: "maria.lopez@example.com",
    phone: "+34 600 345 678",
    profile_en: mariaEnglish,
    profile_no: mariaNorwegian,
    experienceDetail: {
      title: "Neurological rehabilitation physiotherapist",
      duration: "6 years",
      care_setting: "hospitalario",
      titles: {
        en: "Neurological rehabilitation physiotherapist",
        no: "Fysioterapeut innen nevrologisk rehabilitering",
      },
      durations: {
        en: "6 years",
        no: "6 år",
      },
    },
  },
  {
    id: "4",
    full_name: "Juan Sánchez",
    birth_date: "1989-02-17",
    email: "juan.sanchez@example.com",
    phone: "+34 600 456 789",
    profile_en: juanEnglish,
    profile_no: juanNorwegian,
    experienceDetail: {
      title: "Multidisciplinary intensive care",
      duration: "4 years",
      care_setting: "hospitalario",
      titles: {
        en: "Multidisciplinary intensive care",
        no: "Tverrfaglig intensivavdeling",
      },
      durations: {
        en: "4 years",
        no: "4 år",
      },
    },
  },
  {
    id: "5",
    full_name: "Laura Fernández",
    birth_date: "1992-09-08",
    email: "laura.fernandez@example.com",
    phone: "+34 600 567 890",
    profile_en: lauraEnglish,
    profile_no: lauraNorwegian,
    experienceDetail: {
      title: "Chronic home-care nurse",
      duration: "3 years",
      care_setting: "domicilio_geriatrico",
      titles: {
        en: "Chronic home-care nurse",
        no: "Sykepleier i hjemmebaserte tjenester for kronikere",
      },
      durations: {
        en: "3 years",
        no: "3 år",
      },
    },
  },
  {
    id: "6",
    full_name: "Nora Aguilar",
    birth_date: "1995-05-29",
    email: "nora.aguilar@example.com",
    phone: "+34 600 678 901",
    profile_en: noraEnglish,
    profile_no: noraNorwegian,
    experienceDetail: {
      title: "Hospital clinical rotations",
      duration: "1 year",
      care_setting: "hospitalario",
      titles: {
        en: "Hospital clinical rotations",
        no: "Kliniske praksisperioder på sykehus",
      },
      durations: {
        en: "1 year",
        no: "1 år",
      },
    },
  },
];
