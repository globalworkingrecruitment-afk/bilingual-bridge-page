import { AccessLog, AppUser, CandidateViewLog, SessionUser, UserRole } from "@/types/auth";

const USERS_KEY = "bbp-app-users";
const LOGS_KEY = "bbp-access-logs";
const SESSION_KEY = "bbp-auth-session";
const CANDIDATE_VIEWS_KEY = "bbp-candidate-views";

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

const createSeedUser = (
  username: string,
  password: string,
  fullName?: string,
  email?: string,
): AppUser => ({
  id: generateId(),
  username: username.trim(),
  password: password.trim(),
  fullName,
  email: email?.trim() || undefined,
  isActive: true,
  createdAt: new Date().toISOString(),
});

export const initializeLocalDb = () => {
  if (!isBrowser) return;

  if (!window.localStorage.getItem(USERS_KEY)) {
    const defaultUsers: AppUser[] = [
      createSeedUser("prueba", "123", "Usuario de prueba", "demo.empleador@example.com"),
    ];
    writeToStorage<AppUser[]>(USERS_KEY, defaultUsers);
  }

  if (!window.localStorage.getItem(LOGS_KEY)) {
    writeToStorage<AccessLog[]>(LOGS_KEY, []);
  }

  if (!window.localStorage.getItem(CANDIDATE_VIEWS_KEY)) {
    writeToStorage<CandidateViewLog[]>(CANDIDATE_VIEWS_KEY, []);
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
    const normalizedUsername = user.username?.trim();
    const normalizedEmail = (user as AppUser & { email?: string }).email?.trim();

    const nextUser: AppUser & { email?: string } = {
      ...user,
      username: normalizedUsername || normalizedEmail || "",
      email: normalizedEmail,
    };

    if (normalizedUsername !== user.username) {
      hasChanges = true;
    }

    if (normalizedEmail !== (user as AppUser & { email?: string }).email) {
      hasChanges = true;
    }

    if (!normalizedUsername && normalizedEmail) {
      hasChanges = true;
    }

    return nextUser;
  }).filter((user): user is AppUser => Boolean(user.username));

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

export const getCandidateViews = (): CandidateViewLog[] => {
  const stored = readFromStorage<CandidateViewLog[]>(CANDIDATE_VIEWS_KEY, []);

  const sanitized = stored
    .map((view) => {
      if (!view.employerUsername && (view as CandidateViewLog & { username?: string }).username) {
        const { username, ...rest } = view as CandidateViewLog & { username: string };
        return { ...rest, employerUsername: username };
      }

      return view;
    })
    .filter((view) => Boolean(view.employerUsername) && Boolean(view.candidateId) && Boolean(view.candidateName));

  if (sanitized.length !== stored.length) {
    writeToStorage<CandidateViewLog[]>(CANDIDATE_VIEWS_KEY, sanitized);
  }

  return sanitized.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
};

export const getCandidateViewsByUser = (): Record<string, CandidateViewLog[]> => {
  const views = getCandidateViews();

  return views.reduce<Record<string, CandidateViewLog[]>>((accumulator, view) => {
    const key = view.employerUsername.trim().toLowerCase();
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(view);
    return accumulator;
  }, {});
};

export const recordCandidateView = (
  employerUsername: string,
  candidateId: string,
  candidateName: string,
): CandidateViewLog | null => {
  if (!employerUsername?.trim() || !candidateId?.trim() || !candidateName?.trim()) {
    return null;
  }

  const normalizedUsername = employerUsername.trim();
  const normalizedCandidateId = candidateId.trim();
  const normalizedCandidateName = candidateName.trim();

  const currentViews = readFromStorage<CandidateViewLog[]>(CANDIDATE_VIEWS_KEY, []);

  const existingIndex = currentViews.findIndex(
    (view) =>
      view.employerUsername.trim().toLowerCase() === normalizedUsername.toLowerCase() &&
      view.candidateId === normalizedCandidateId,
  );

  const timestamp = new Date().toISOString();

  if (existingIndex >= 0) {
    const updatedView: CandidateViewLog = {
      ...currentViews[existingIndex],
      candidateName: normalizedCandidateName,
      viewedAt: timestamp,
    };

    currentViews[existingIndex] = updatedView;
    writeToStorage(CANDIDATE_VIEWS_KEY, currentViews);
    return updatedView;
  }

  const newView: CandidateViewLog = {
    id: generateId(),
    employerUsername: normalizedUsername,
    candidateId: normalizedCandidateId,
    candidateName: normalizedCandidateName,
    viewedAt: timestamp,
  };

  currentViews.push(newView);
  writeToStorage(CANDIDATE_VIEWS_KEY, currentViews);

  return newView;
};

export const validateUserCredentials = (identifier: string, password: string): AppUser | null => {
  const users = getUsers();
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const user = users.find(candidate => {
    const usernameMatch = candidate.username.trim().toLowerCase() === normalizedIdentifier;
    const emailMatch = candidate.email?.trim().toLowerCase() === normalizedIdentifier;

    return (
      (usernameMatch || emailMatch) &&
      candidate.password === normalizedPassword &&
      candidate.isActive
    );
  });

  return user ?? null;
};

export const addUser = (
  username: string,
  password: string,
  fullName?: string,
  email?: string,
): AppUser => {
  const users = getUsers();
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();
  const normalizedEmail = email?.trim();

  if (!normalizedUsername) {
    throw new Error("El nombre de usuario no es válido.");
  }

  if (!normalizedPassword) {
    throw new Error("La contraseña no es válida.");
  }

  const exists = users.some(candidate => {
    const usernameTaken = candidate.username.toLowerCase() === normalizedUsername.toLowerCase();
    const emailTaken = normalizedEmail
      ? candidate.email?.toLowerCase() === normalizedEmail.toLowerCase()
      : false;
    return usernameTaken || emailTaken;
  });

  if (exists) {
    throw new Error("Ya existe un usuario con este nombre o correo electrónico.");
  }

  const newUser: AppUser = {
    id: generateId(),
    username: normalizedUsername,
    password: normalizedPassword,
    fullName: fullName?.trim() || undefined,
    email: normalizedEmail || undefined,
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

export const updateUserEmail = (userId: string, email: string): AppUser | null => {
  const users = getUsers();
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error("El correo electrónico es obligatorio.");
  }

  const emailAlreadyUsed = users.some((user) => {
    if (user.id === userId) return false;
    return user.email?.trim().toLowerCase() === normalizedEmail.toLowerCase();
  });

  if (emailAlreadyUsed) {
    throw new Error("Ya existe un usuario con este correo electrónico.");
  }

  const updatedUsers = users.map((user) => {
    if (user.id !== userId) return user;

    return { ...user, email: normalizedEmail };
  });

  writeToStorage(USERS_KEY, updatedUsers);

  return updatedUsers.find((user) => user.id === userId) ?? null;
};

export const removeUser = (userId: string) => {
  const users = getUsers();
  const removedUser = users.find((user) => user.id === userId);
  const filtered = users.filter((user) => user.id !== userId);

  writeToStorage(USERS_KEY, filtered);

  if (removedUser) {
    const views = readFromStorage<CandidateViewLog[]>(CANDIDATE_VIEWS_KEY, []);
    const remainingViews = views.filter(
      (view) => view.employerUsername.trim().toLowerCase() !== removedUser.username.trim().toLowerCase(),
    );

    if (remainingViews.length !== views.length) {
      writeToStorage(CANDIDATE_VIEWS_KEY, remainingViews);
    }
  }
};
