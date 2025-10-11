import { Candidate } from "@/types/candidate";

const coverLetter = (lines: string[]): string => lines.join("\n");

export const mockCandidates: Candidate[] = [
  {
    id: "1",
    full_name: "Ana Martínez",
    birth_year: 1988,
    cover_letter: coverLetter([
      "Soy enfermera titulada con vocación por la geriatría y el acompañamiento integral.",
      "Me adapto con rapidez a entornos multiculturales y equipos multidisciplinares.",
      "Disfruto creando planes de cuidado personalizados junto a las familias.",
      "Busco aportar estabilidad y continuidad a los pacientes crónicos.",
      "Valoro la comunicación abierta con colegas y gestores de residencias.",
      "Estoy lista para integrarme en nuevos dispositivos asistenciales en Noruega."
    ]),
    experiences: [
      {
        title: "Supervisión en residencia geriátrica",
        duration: "4 años",
        care_setting: "domicilio_geriatrico"
      },
      {
        title: "Coordinación de cuidados paliativos",
        duration: "3 años",
        care_setting: "hospitalario"
      },
      {
        title: "Formación interna en seguridad del paciente",
        duration: "1 año",
        care_setting: "hospitalario"
      }
    ]
  },
  {
    id: "2",
    full_name: "Carlos Rodríguez",
    birth_year: 1990,
    cover_letter: coverLetter([
      "Profesional de enfermería enfocado en la atención de urgencias y la medicina crítica.",
      "He gestionado turnos de alta demanda asegurando protocolos y tiempos de respuesta.",
      "Me motiva trabajar en equipos coordinados donde el apoyo mutuo es esencial.",
      "Mantengo la calma frente a escenarios de presión y priorizo la seguridad del paciente.",
      "Comparto conocimiento con colegas mediante simulaciones y sesiones clínicas.",
      "Quiero seguir creciendo en hospitales nórdicos con tecnologías avanzadas."
    ]),
    experiences: [
      {
        title: "Enfermería en urgencias hospitalarias",
        duration: "5 años",
        care_setting: "urgencias"
      },
      {
        title: "Responsable de triaje en emergencias",
        duration: "1 año",
        care_setting: "urgencias"
      }
    ]
  },
  {
    id: "3",
    full_name: "María López",
    birth_year: 1985,
    cover_letter: coverLetter([
      "Fisioterapeuta dedicada a la rehabilitación neurológica y geriátrica integral.",
      "Trabajo estrechamente con terapeutas ocupacionales y médicos rehabilitadores.",
      "Me enfoco en objetivos funcionales medibles y seguimiento continuo.",
      "Promuevo la autonomía del paciente con planes de ejercicios individualizados.",
      "Me entusiasma introducir terapias basadas en evidencia científica.",
      "Busco aportar mi experiencia en centros escandinavos especializados."
    ]),
    experiences: [
      {
        title: "Rehabilitación neurológica hospitalaria",
        duration: "6 años",
        care_setting: "hospitalario"
      },
      {
        title: "Programa de fisioterapia domiciliaria",
        duration: "2 años",
        care_setting: "domicilio_geriatrico"
      },
      {
        title: "Consultas ambulatorias geriátricas",
        duration: "2 años",
        care_setting: "domicilio_geriatrico"
      }
    ]
  },
  {
    id: "4",
    full_name: "Juan Sánchez",
    birth_year: 1989,
    cover_letter: coverLetter([
      "Especialista en cuidados intensivos con sólida base en soporte ventilatorio.",
      "Participo activamente en comités de seguridad clínica y simulacros.",
      "Me interesa implementar protocolos de sedación y analgesia basados en guías.",
      "Valoro la formación continua y la mentoría de personal junior.",
      "Colaboro con anestesistas y perfusionistas para planes integrales.",
      "Aspiro a integrarme en UCI con enfoque humano y alta tecnología."
    ]),
    experiences: [
      {
        title: "Cuidados intensivos polivalentes",
        duration: "4 años",
        care_setting: "hospitalario"
      },
      {
        title: "Unidad de recuperación postquirúrgica",
        duration: "2 años",
        care_setting: "hospitalario"
      },
      {
        title: "Equipo de respuesta rápida hospitalaria",
        duration: "1 año",
        care_setting: "urgencias"
      }
    ]
  },
  {
    id: "5",
    full_name: "Laura Fernández",
    birth_year: 1992,
    cover_letter: coverLetter([
      "Enfermera comunitaria orientada a la atención domiciliaria y educación sanitaria.",
      "Disfruto coordinando agendas y recursos con trabajadores sociales.",
      "Fomento la adherencia terapéutica mediante visitas periódicas y seguimiento.",
      "Apoyo a cuidadores informales con pautas claras y material educativo.",
      "Participo en campañas de prevención y vacunación en barrios vulnerables.",
      "Quiero trasladar esta experiencia a municipios noruegos en crecimiento."
    ]),
    experiences: [
      {
        title: "Atención domiciliaria crónica",
        duration: "3 años",
        care_setting: "domicilio_geriatrico"
      },
      {
        title: "Educación sanitaria comunitaria",
        duration: "2 años",
        care_setting: "domicilio_geriatrico"
      }
    ]
  },
  {
    id: "6",
    full_name: "Nora Aguilar",
    birth_year: 1995,
    cover_letter: coverLetter([
      "Enfermera recién graduada con fuerte motivación por la medicina familiar.",
      "He complementado mis prácticas con voluntariado en campañas de salud.",
      "Tengo facilidad para aprender idiomas y adaptarme a nuevos protocolos.",
      "Busco un entorno donde pueda desarrollar habilidades clínicas sólidas.",
      "Aporto actitud proactiva, escucha activa y trabajo colaborativo.",
      "Deseo iniciar mi carrera profesional en atención primaria noruega."
    ]),
    experiences: []
  }
];
