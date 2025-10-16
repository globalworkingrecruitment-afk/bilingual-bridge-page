export const norwegianContent = {
  nav: {
    candidates: "Kandidater",
    about: "Om oss",
    contact: "Kontakt",
    login: "Logg inn"
  },
  hero: {
    title: "Finn Topp Helsepersonell",
    subtitle: "Få tilgang til kvalifiserte helsepersonell klare til å bli med i teamet ditt i Norge",
    cta: "Søk Kandidater",
    secondaryCta: "Kontakt Oss"
  },
  stats: {
    title: "Kvalitet Helsepersonell",
    items: [
      { value: "500+", label: "Kvalifiserte Fagfolk" },
      { value: "95%", label: "Oppbevaringsrate" },
      { value: "48t", label: "Gjennomsnittlig Respons" },
      { value: "100%", label: "Verifisert" }
    ]
  },
  candidates: {
    title: "Tilgjengelige Fagfolk",
    subtitle: "Finn den perfekte helsepersonell til teamet ditt",
    noResults: "Ingen kandidater funnet",
    loading: "Laster inn kandidater...",
    loadError: {
      title: "Kunne ikke laste kandidatlisten",
      description: "Kontroller Supabase-legitimasjonen og prøv igjen.",
      retry: "Prøv igjen",
    },
    refreshing: "Oppdaterer data...",
    filters: {
      title: "Status",
      all: "Alle profiler",
      groups: {
        activo: "Aktiv",
        inactivo: "Inaktiv",
        reservado: "Reservert",
      },
    }
  },
  search: {
    placeholder: "Søk etter navn, rolle eller sammendrag...",
    button: "Søk"
  },
  candidateCard: {
    profession: "Rolle",
    languages: "Språk",
    education: "Utdanning",
    summary: "Sammendrag av søknadsbrev",
    experiences: "Klinisk erfaring",
    experienceOverview: "Erfaringsoversikt",
    coverLetterFull: "Komplett søknadsbrev",
    openDetails: "Se hele profilen",
    detailDescription: "Les kandidatens utdanning og komplette søknadsbrev.",
    noExperience: "Ingen erfaring oppgitt ennå",
    noEducation: "Ingen utdanningsdetaljer tilgjengelig",
    noSummary: "Ingen sammendrag tilgjengelig",
    noCoverLetter: "Ingen søknadstekst tilgjengelig",
    noLanguages: "Ingen språk oppgitt",
    scheduleMeeting: "Planlegg møte",
  },
  auth: {
    title: "Tilgang til Kontoen Din",
    subtitle: "Logg inn med brukernavn eller e-post og passord for å fortsette",
    usernameLabel: "Brukernavn eller e-post",
    usernamePlaceholder: "dittbrukernavn@example.com",
    passwordLabel: "Passord",
    passwordPlaceholder: "Skriv inn passordet ditt",
    loginButton: "Logg inn",
    loading: "Logger inn...",
    successAdmin: "Velkommen tilbake, administrator!",
    successUser: "Velkommen tilbake!",
    error: "Vi kunne ikke bekrefte legitimasjonen din. Prøv igjen."
  },
  footer: {
    rights: "Alle rettigheter reservert"
  }
};
