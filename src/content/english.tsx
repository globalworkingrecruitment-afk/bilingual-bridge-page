export const englishContent = {
  nav: {
    candidates: "Candidates",
    about: "About",
    contact: "Contact",
    login: "Login"
  },
  hero: {
    title: "Find Top Healthcare Professionals",
    subtitle: "Access qualified healthcare professionals ready to join your team in Norway",
    cta: "Search Candidates",
    secondaryCta: "Contact Us"
  },
  stats: {
    title: "Quality Healthcare Professionals",
    items: [
      { value: "500+", label: "Qualified Professionals" },
      { value: "95%", label: "Retention Rate" },
      { value: "48h", label: "Average Response" },
      { value: "100%", label: "Verified" }
    ]
  },
  candidates: {
    title: "Available Professionals",
    subtitle: "Find the perfect healthcare professional for your team",
    noResults: "No candidates found",
    loading: "Loading candidates...",
    loadError: {
      title: "We couldn't load the candidate list",
      description: "Review your Supabase credentials and try again.",
      retry: "Try again",
    },
    refreshing: "Refreshing data...",
    filters: {
      title: "Status",
      all: "All profiles",
      groups: {
        activo: "Active",
        inactivo: "Inactive",
        reservado: "Reserved",
      },
    }
  },
  search: {
    placeholder: "Search by name, profession or summary...",
    button: "Search"
  },
  candidateCard: {
    profession: "Role",
    age: "Age",
    languages: "Languages",
    education: "Education",
    summary: "Cover letter summary",
    experiences: "Clinical Experience",
    experienceOverview: "Experience Overview",
    coverLetterFull: "Complete cover letter",
    openDetails: "View full profile",
    detailDescription: "Review the candidate's education and full cover letter.",
    noExperience: "No experience provided yet",
    noEducation: "No education details provided",
    noSummary: "No summary available",
    noCoverLetter: "No cover letter available",
    noLanguages: "No languages specified",
    ageUnavailable: "Age not available",
    scheduleMeeting: "Schedule meeting",
  },
  auth: {
    title: "Access Your Account",
    subtitle: "Sign in with your username or email and password to continue",
    usernameLabel: "Username or email",
    usernamePlaceholder: "yourusername@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginButton: "Sign in",
    loading: "Signing in...",
    successAdmin: "Welcome back, administrator!",
    successUser: "Welcome back!",
    error: "We couldn't verify your credentials. Please try again."
  },
  footer: {
    rights: "All rights reserved"
  }
};
