const KEY = "waypoint.session";

export interface Session {
  access_token: string;
  refresh_token: string;
  email: string;
}

type Listener = (session: Session | null) => void;

const listeners = new Set<Listener>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let current: Session | null = read();

function write(next: Session | null) {
  current = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode) — keep the in-memory session.
  }
  listeners.forEach((listener) => listener(current));
}

export const tokenStore = {
  get: () => current,
  set: (session: Session) => write(session),
  updateAccess: (access_token: string) => {
    if (current) write({ ...current, access_token });
  },
  clear: () => write(null),
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
