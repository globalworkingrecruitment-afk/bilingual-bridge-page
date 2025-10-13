import { AccessLog, AppUser, SessionUser, UserRole } from "@/types/auth";

const USERS_KEY = "bbp-app-users";
const LOGS_KEY = "bbp-access-logs";
const SESSION_KEY = "bbp-auth-session";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readFromStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return fallback;
  }
};

const writeToStorage = <T>(key: string, value: T) => {
  if (!isBrowser) return;

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const initializeLocalDb = () => {
  if (!isBrowser) return;

  if (!window.localStorage.getItem(USERS_KEY)) {
    writeToStorage<AppUser[]>(USERS_KEY, []);
  }

  if (!window.localStorage.getItem(LOGS_KEY)) {
    writeToStorage<AccessLog[]>(LOGS_KEY, []);
  }
};

export const getStoredSession = (): SessionUser | null => {
  return readFromStorage<SessionUser | null>(SESSION_KEY, null);
};

export const persistSession = (session: SessionUser | null) => {
  if (!isBrowser) return;

  if (session) {
    writeToStorage(SESSION_KEY, session);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
};

export const getUsers = (): AppUser[] => {
  return readFromStorage<AppUser[]>(USERS_KEY, []);
};

export const getAccessLogs = (): AccessLog[] => {
  const logs = readFromStorage<AccessLog[]>(LOGS_KEY, []);

  return logs.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
};

export const addAccessLog = (userEmail: string, role: UserRole) => {
  const logs = readFromStorage<AccessLog[]>(LOGS_KEY, []);

  const newLog: AccessLog = {
    id: generateId(),
    userEmail,
    role,
    loggedAt: new Date().toISOString(),
  };

  logs.push(newLog);
  writeToStorage(LOGS_KEY, logs);

  return newLog;
};

export const validateUserCredentials = (email: string, password: string): AppUser | null => {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail &&
      candidate.password === password &&
      candidate.isActive,
  );

  return user ?? null;
};

export const addUser = (email: string, password: string, fullName?: string): AppUser => {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("El correo electrónico no es válido.");
  }

  if (password.trim().length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const exists = users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail);

  if (exists) {
    throw new Error("Ya existe un usuario con este correo electrónico.");
  }

  const newUser: AppUser = {
    id: generateId(),
    email: normalizedEmail,
    password: password.trim(),
    fullName: fullName?.trim() || undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  writeToStorage(USERS_KEY, updatedUsers);

  return newUser;
};

export const toggleUserStatus = (userId: string): AppUser | null => {
  const users = getUsers();
  const updatedUsers = users.map((user) => {
    if (user.id !== userId) return user;

    return { ...user, isActive: !user.isActive };
  });

  writeToStorage(USERS_KEY, updatedUsers);

  return updatedUsers.find((user) => user.id === userId) ?? null;
};

export const removeUser = (userId: string) => {
  const users = getUsers();
  const filtered = users.filter((user) => user.id !== userId);

  writeToStorage(USERS_KEY, filtered);
};
