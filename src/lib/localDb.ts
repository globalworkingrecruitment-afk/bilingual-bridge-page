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

const createSeedUser = (username: string, password: string, fullName?: string): AppUser => ({
  id: generateId(),
  username: username.trim(),
  password: password.trim(),
  fullName,
  isActive: true,
  createdAt: new Date().toISOString(),
});

export const initializeLocalDb = () => {
  if (!isBrowser) return;

  if (!window.localStorage.getItem(USERS_KEY)) {
    const defaultUsers: AppUser[] = [createSeedUser("prueba", "123", "Usuario de prueba")];
    writeToStorage<AppUser[]>(USERS_KEY, defaultUsers);
  }

  if (!window.localStorage.getItem(LOGS_KEY)) {
    writeToStorage<AccessLog[]>(LOGS_KEY, []);
  }
};

export const getStoredSession = (): SessionUser | null => {
  const stored = readFromStorage<(SessionUser & { email?: string }) | null>(SESSION_KEY, null);

  if (!stored) {
    return null;
  }

  if (!stored.username && stored.email) {
    const migratedSession: SessionUser = { username: stored.email, role: stored.role };
    persistSession(migratedSession);
    return migratedSession;
  }

  return stored;
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
  const stored = readFromStorage<(AppUser & { email?: string })[]>(USERS_KEY, []);

  let hasChanges = false;

  const migratedUsers = stored.map((user) => {
    if (user.username) {
      const trimmedUsername = user.username.trim();
      if (trimmedUsername !== user.username) {
        hasChanges = true;
      }
      return { ...user, username: trimmedUsername } as AppUser;
    }

    if ((user as AppUser & { email: string }).email) {
      const { email, ...rest } = user as AppUser & { email: string };
      hasChanges = true;
      return { ...rest, username: email.trim() } as AppUser;
    }

    return user as AppUser;
  });

  if (hasChanges) {
    writeToStorage<AppUser[]>(USERS_KEY, migratedUsers);
  }

  return migratedUsers;
};

export const getAccessLogs = (): AccessLog[] => {
  const stored = readFromStorage<(AccessLog & { userEmail?: string })[]>(LOGS_KEY, []);

  let hasChanges = false;

  const migratedLogs = stored.map((log) => {
    if (log.username) {
      return log;
    }

    if ((log as AccessLog & { userEmail: string }).userEmail) {
      const { userEmail, ...rest } = log as AccessLog & { userEmail: string };
      hasChanges = true;
      return { ...rest, username: userEmail } as AccessLog;
    }

    return log as AccessLog;
  });

  if (hasChanges) {
    writeToStorage<AccessLog[]>(LOGS_KEY, migratedLogs);
  }

  return migratedLogs.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
};

export const addAccessLog = (username: string, role: UserRole) => {
  const logs = readFromStorage<AccessLog[]>(LOGS_KEY, []);

  const newLog: AccessLog = {
    id: generateId(),
    username,
    role,
    loggedAt: new Date().toISOString(),
  };

  logs.push(newLog);
  writeToStorage(LOGS_KEY, logs);

  return newLog;
};

export const validateUserCredentials = (username: string, password: string): AppUser | null => {
  const users = getUsers();
  const normalizedUsername = username.trim().toLowerCase();

  const user = users.find(
    (candidate) =>
      candidate.username.toLowerCase() === normalizedUsername &&
      candidate.password === password &&
      candidate.isActive,
  );

  return user ?? null;
};

export const addUser = (username: string, password: string, fullName?: string): AppUser => {
  const users = getUsers();
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();

  if (!normalizedUsername) {
    throw new Error("El nombre de usuario no es válido.");
  }

  if (!normalizedPassword) {
    throw new Error("La contraseña no es válida.");
  }

  const exists = users.some((candidate) => candidate.username.toLowerCase() === normalizedUsername.toLowerCase());

  if (exists) {
    throw new Error("Ya existe un usuario con este nombre.");
  }

  const newUser: AppUser = {
    id: generateId(),
    username: normalizedUsername,
    password: normalizedPassword,
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
