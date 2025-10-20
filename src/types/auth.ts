export type UserRole = "admin" | "user";

export interface SessionUser {
  username: string;
  role: UserRole;
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  username: string;
  role: UserRole;
  loggedAt: string;
}

export interface CandidateViewLog {
  id: string;
  employerId: string;
  employerUsername: string;
  candidateId: string;
  candidateName: string;
  viewedAt: string;
}

export interface SearchLog {
  id: string;
  employerId: string;
  employerUsername: string;
  query: string;
  candidateNames: string[];
  searchedAt: string;
  updatedAt?: string;
}
