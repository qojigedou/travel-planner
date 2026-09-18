import { tokenStore } from "./tokenStore";

/** All requests go through the "/api" prefix; Vite (dev) or nginx (Docker) forwards them to FastAPI. */
const API_BASE = "/api";

export class ApiError extends Error {
  readonly status: number;
  /** Field name → message, when FastAPI returns a 422 validation error. */
  readonly fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

interface ValidationIssue {
  loc?: (string | number)[];
  msg?: string;
}

function cleanMessage(msg: string) {
  return msg.replace(/^Value error,\s*/i, "");
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON error body (proxy error page, empty 500 …)
  }

  const detail = (body as { detail?: unknown } | null)?.detail;

  if (typeof detail === "string") {
    return new ApiError(res.status, detail);
  }

  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    const messages: string[] = [];
    for (const issue of detail as ValidationIssue[]) {
      const msg = cleanMessage(issue.msg ?? "Invalid value");
      const field = issue.loc?.filter((part) => part !== "body").join(".");
      if (field && !(field in fields)) fields[field] = msg;
      messages.push(msg);
    }
    return new ApiError(res.status, messages[0] ?? "Validation failed", fields);
  }

  if (res.status >= 500 || res.status === 0) {
    return new ApiError(res.status, "The server hit an error. Try again in a moment.");
  }
  return new ApiError(res.status, res.statusText || "Request failed");
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  /** Skip the refresh-token retry (used by auth endpoints themselves). */
  skipRefresh?: boolean;
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.get()?.refresh_token;
  if (!refresh) return false;

  refreshing ??= fetch(`${API_BASE}/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  })
    .then(async (res) => {
      if (!res.ok) {
        tokenStore.clear();
        return false;
      }
      const data = (await res.json()) as { access_token: string };
      tokenStore.updateAccess(data.access_token);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, skipRefresh } = options;

  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const send = () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const access = tokenStore.get()?.access_token;
    if (access) headers.Authorization = `Bearer ${access}`;

    return fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  };

  let res: Response;
  try {
    res = await send();
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the API. Is the backend running?");
  }

  if (res.status === 401 && !skipRefresh && tokenStore.get()) {
    if (await refreshAccessToken()) res = await send();
  }

  if (!res.ok) throw await toApiError(res);

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
