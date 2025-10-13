import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addAccessLog,
  initializeLocalDb,
  persistSession,
  validateUserCredentials,
  getStoredSession,
} from "@/lib/localDb";
import { SessionUser } from "@/types/auth";

interface AuthContextValue {
  currentUser: SessionUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<SessionUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const env = import.meta.env as Record<string, string | undefined>;
const ADMIN_USERNAME = (env.VITE_ADMIN_USERNAME ?? env.VITE_ADMIN_EMAIL ?? "admin").trim();
const ADMIN_PASSWORD = (env.VITE_ADMIN_PASSWORD ?? "123").trim();

const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeLocalDb();

    const storedSession = getStoredSession();
    if (storedSession) {
      setCurrentUser(storedSession);
    }

    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const normalizedUsername = normalizeIdentifier(username);
    const trimmedPassword = password.trim();

    if (!normalizedUsername || !trimmedPassword) {
      throw new Error("Debes ingresar un usuario y una contraseña válidos.");
    }

    const isAdmin =
      ADMIN_USERNAME && ADMIN_PASSWORD &&
      normalizeIdentifier(ADMIN_USERNAME) === normalizedUsername &&
      ADMIN_PASSWORD === trimmedPassword;

    if (isAdmin) {
      const adminUser: SessionUser = { username: ADMIN_USERNAME, role: "admin" };
      setCurrentUser(adminUser);
      persistSession(adminUser);
      addAccessLog(adminUser.username, adminUser.role);
      return adminUser;
    }

    const matchedUser = validateUserCredentials(normalizedUsername, trimmedPassword);

    if (!matchedUser) {
      throw new Error("Credenciales incorrectas o usuario inactivo.");
    }

    if (!matchedUser.isActive) {
      throw new Error("El usuario se encuentra deshabilitado.");
    }

    const sessionUser: SessionUser = { username: matchedUser.username, role: "user" };
    setCurrentUser(sessionUser);
    persistSession(sessionUser);
    addAccessLog(sessionUser.username, sessionUser.role);

    return sessionUser;
  };

  const logout = () => {
    setCurrentUser(null);
    persistSession(null);
  };

  const value = useMemo<AuthContextValue>(() => ({ currentUser, loading, login, logout }), [currentUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }

  return context;
};
