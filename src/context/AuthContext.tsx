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
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      throw new Error("Debes ingresar un correo y una contraseña válidos.");
    }

    const isAdmin =
      ADMIN_EMAIL && ADMIN_PASSWORD &&
      normalizeEmail(ADMIN_EMAIL) === normalizedEmail &&
      ADMIN_PASSWORD === trimmedPassword;

    if (isAdmin) {
      const adminUser: SessionUser = { email: normalizedEmail, role: "admin" };
      setCurrentUser(adminUser);
      persistSession(adminUser);
      addAccessLog(adminUser.email, adminUser.role);
      return adminUser;
    }

    const matchedUser = validateUserCredentials(normalizedEmail, trimmedPassword);

    if (!matchedUser) {
      throw new Error("Credenciales incorrectas o usuario inactivo.");
    }

    if (!matchedUser.isActive) {
      throw new Error("El usuario se encuentra deshabilitado.");
    }

    const sessionUser: SessionUser = { email: matchedUser.email, role: "user" };
    setCurrentUser(sessionUser);
    persistSession(sessionUser);
    addAccessLog(sessionUser.email, sessionUser.role);

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
