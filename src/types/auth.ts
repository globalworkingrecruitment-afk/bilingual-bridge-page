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
  isActive: boolean;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  username: string;
  role: UserRole;
  loggedAt: string;
}
