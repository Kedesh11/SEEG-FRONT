// Centralisation des routes API backend
// Utilisation: importer ROUTES et référencer ROUTES.AUTH.LOGIN, etc.

export const API_PREFIX = "/api" as const;
export const API_VERSION = "/v1" as const;
export const API_BASE = `${API_PREFIX}${API_VERSION}` as const;

export const ROUTES = {
  AUTH: {
    BASE: `${API_BASE}/auth` as const,
    LOGIN: `${API_BASE}/auth/login` as const,
    TOKEN: `${API_BASE}/auth/token` as const, // deprecated coté Swagger (hidden)
    SIGNUP: `${API_BASE}/auth/signup` as const,
    VERIFY_MATRICULE: `${API_BASE}/auth/verify-matricule` as const,
    CREATE_USER: `${API_BASE}/auth/create-user` as const,
  },
  USERS: {
    BASE: `${API_BASE}/users` as const,
    ME: `${API_BASE}/users/me` as const,
  },
  JOBS: {
    BASE: `${API_BASE}/jobs` as const,
    DETAIL: (id: string | number) => `${API_BASE}/jobs/${encodeURIComponent(String(id))}` as const,
  },
  APPLICATIONS: {
    BASE: `${API_BASE}/applications` as const,
    DETAIL: (id: string | number) => `${API_BASE}/applications/${encodeURIComponent(String(id))}` as const,
  },
  EVALUATIONS: {
    BASE: `${API_BASE}/evaluations` as const,
    DETAIL: (id: string | number) => `${API_BASE}/evaluations/${encodeURIComponent(String(id))}` as const,
  },
  EMAILS: {
    BASE: `${API_BASE}/emails` as const,
  },
  NOTIFICATIONS: {
    BASE: `${API_BASE}/notifications` as const,
  },
} as const;

// Helper pour construire des routes paramétrées si besoin
export function withId(base: string, id: string | number) {
  return `${base}/${encodeURIComponent(String(id))}`;
}

// Helper pour construire des URLs avec query params typés
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export function withQuery(url: string, params?: QueryParams): string {
  if (!params) return url;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v !== undefined && v !== null) usp.append(key, String(v));
      });
    } else if (value !== undefined && value !== null) {
      usp.set(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
} 