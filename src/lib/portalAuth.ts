const isBrowser = typeof window !== "undefined";

const USERS_KEY = "portal:users";
const ACCESS_LOGS_KEY = "portal:accessLogs";
const ACTIVE_USER_KEY = "portal:activeUser";
const ADMIN_SESSION_KEY = "portal:adminSession";

const DEFAULT_USER = {
  username: "demo.user",
  password: "Demo1234",
};

export const ADMIN_USERNAME = "admin123";
export const ADMIN_PASSWORD = "GWorking";

export interface PortalUser {
  username: string;
  password: string;
  createdAt: string;
}

export interface PortalAccessLog {
  username: string;
  accessedAt: string;
}

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn(`Could not parse storage key ${key}:`, error);
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const ensureDefaultUser = (users: PortalUser[]): PortalUser[] => {
  const hasDefaultUser = users.some(
    (user) => user.username.toLowerCase() === DEFAULT_USER.username.toLowerCase()
  );

  if (hasDefaultUser) {
    return users;
  }

  const defaultUser: PortalUser = {
    username: DEFAULT_USER.username,
    password: DEFAULT_USER.password,
    createdAt: new Date().toISOString(),
  };

  return [...users, defaultUser];
};

export const getPortalUsers = (): PortalUser[] => {
  const storedUsers = readStorage<PortalUser[]>(USERS_KEY, []);
  const usersWithDefault = ensureDefaultUser(storedUsers);

  if (isBrowser && usersWithDefault.length !== storedUsers.length) {
    writeStorage(USERS_KEY, usersWithDefault);
  }

  return usersWithDefault;
};

export const addPortalUser = (username: string, password: string) => {
  const users = getPortalUsers();
  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password.trim()) {
    throw new Error("Debes introducir un usuario y una contraseña válidos.");
  }

  const exists = users.some(
    (user) => user.username.toLowerCase() === normalizedUsername.toLowerCase()
  );

  if (exists) {
    throw new Error("Ese usuario ya existe.");
  }

  const newUser: PortalUser = {
    username: normalizedUsername,
    password: password.trim(),
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [...users, newUser];
  writeStorage(USERS_KEY, nextUsers);

  return newUser;
};

export const removePortalUser = (username: string) => {
  if (username.toLowerCase() === DEFAULT_USER.username.toLowerCase()) {
    throw new Error("No puedes eliminar el usuario de prueba predeterminado.");
  }

  const users = getPortalUsers();
  const filtered = users.filter(
    (user) => user.username.toLowerCase() !== username.toLowerCase()
  );
  writeStorage(USERS_KEY, filtered);
};

export const validatePortalUser = (username: string, password: string) => {
  const users = getPortalUsers();
  return users.some(
    (user) =>
      user.username.toLowerCase() === username.trim().toLowerCase() &&
      user.password === password.trim()
  );
};

export const logPortalAccess = (username: string) => {
  const logs = readStorage<PortalAccessLog[]>(ACCESS_LOGS_KEY, []);
  const nextLogs: PortalAccessLog[] = [
    {
      username,
      accessedAt: new Date().toISOString(),
    },
    ...logs,
  ];

  writeStorage(ACCESS_LOGS_KEY, nextLogs.slice(0, 1000));
};

export const getPortalAccessLogs = () => readStorage<PortalAccessLog[]>(ACCESS_LOGS_KEY, []);

export const setActivePortalUser = (username: string) => {
  writeStorage(ACTIVE_USER_KEY, username);
};

export const getActivePortalUser = () => readStorage<string | null>(ACTIVE_USER_KEY, null);

export const clearActivePortalUser = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(ACTIVE_USER_KEY);
};

export const setAdminSession = (active: boolean) => {
  writeStorage(ADMIN_SESSION_KEY, active);
};

export const getAdminSession = () => readStorage<boolean>(ADMIN_SESSION_KEY, false);

export const clearAdminSession = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
};
