export type UserRole = "admin" | "user";

export interface SessionUser {
  email: string;
  role: UserRole;
}

export interface AppUser {
  id: string;
  email: string;
  password: string;
  fullName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  userEmail: string;
  role: UserRole;
  loggedAt: string;
}
