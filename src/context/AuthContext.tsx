import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addAccessLog,
  initializeLocalDb,
  persistSession,
  validateUserCredentials,
  getStoredSession,
} from "@/lib/localDb";
import { SessionUser } from "@/types/auth";
import { signOutSupabaseSession } from "@/lib/supabase-auth";

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

const logAccessSafely = async (user: SessionUser) => {
  try {
    await addAccessLog(user.username, user.role);
  } catch (error) {
    console.warn("[auth] No se pudo registrar el acceso en Supabase.", error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await initializeLocalDb();
        if (!active) return;

        const storedSession = getStoredSession();
        if (storedSession) {
          setCurrentUser(storedSession);
        }
      } catch (error) {
        console.error("No se pudo inicializar la sesión local", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
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
      await logAccessSafely(adminUser);
      return adminUser;
    }

    const matchedUser = await validateUserCredentials(normalizedUsername, trimmedPassword);

    if (!matchedUser) {
      throw new Error("Credenciales incorrectas o usuario inactivo.");
    }

    if (!matchedUser.isActive) {
      throw new Error("El usuario se encuentra deshabilitado.");
    }

    const sessionUser: SessionUser = { username: matchedUser.username, role: "user" };
    setCurrentUser(sessionUser);
    persistSession(sessionUser);
    await logAccessSafely(sessionUser);

    return sessionUser;
  };

  const logout = () => {
    setCurrentUser(null);
    persistSession(null);
    void signOutSupabaseSession();
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
