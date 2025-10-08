import { Candidate } from "@/types/candidate";

export const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Ana Martínez",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    specialties: ["Geriatría", "Cuidados Paliativos"],
    experience: "8 años de experiencia en geriatría y cuidados especializados",
    availability: "Inmediata",
    languages: ["Español", "Inglés"],
    certifications: ["Enfermería Geriátrica", "Cuidados Paliativos"],
    location: "Oslo, Noruega"
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop",
    specialties: ["Hospitalización", "Urgencias"],
    experience: "6 años en unidades de hospitalización y emergencias",
    availability: "2 semanas",
    languages: ["Español", "Noruego", "Inglés"],
    certifications: ["Enfermería de Urgencias", "Soporte Vital Avanzado"],
    location: "Bergen, Noruega"
  },
  {
    id: "3",
    name: "María López",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop",
    specialties: ["Geriatría", "Rehabilitación"],
    experience: "10 años especializados en geriatría y rehabilitación",
    availability: "1 mes",
    languages: ["Español", "Noruego"],
    certifications: ["Fisioterapia Geriátrica", "Rehabilitación Funcional"],
    location: "Trondheim, Noruega"
  },
  {
    id: "4",
    name: "Juan Sánchez",
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
    specialties: ["Hospitalización", "Cuidados Intensivos"],
    experience: "7 años en cuidados intensivos y hospitalización",
    availability: "Inmediata",
    languages: ["Español", "Inglés", "Noruego"],
    certifications: ["UCI", "Ventilación Mecánica"],
    location: "Stavanger, Noruega"
  },
  {
    id: "5",
    name: "Laura Fernández",
    photo: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&h=400&fit=crop",
    specialties: ["Geriatría", "Atención Domiciliaria"],
    experience: "5 años en atención domiciliaria geriátrica",
    availability: "3 semanas",
    languages: ["Español", "Noruego"],
    certifications: ["Atención Domiciliaria", "Enfermería Comunitaria"],
    location: "Oslo, Noruega"
  },
  {
    id: "6",
    name: "Pedro Gómez",
    photo: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&h=400&fit=crop",
    specialties: ["Hospitalización", "Cirugía"],
    experience: "9 años en áreas quirúrgicas y hospitalización",
    availability: "1 semana",
    languages: ["Español", "Inglés"],
    certifications: ["Enfermería Quirúrgica", "Instrumentación"],
    location: "Bergen, Noruega"
  }
];
