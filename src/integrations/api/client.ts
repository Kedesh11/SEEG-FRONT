// Lightweight fetch-based API client
// Usage example:
// import { api } from "@/integrations/api/client";
// const { data } = await api.get("/path");

export type ResponseType = "json" | "blob" | "text";

export interface ApiOptions {
  headers?: Record<string, string>;
  responseType?: ResponseType;
  signal?: AbortSignal;
}

function getApiBaseUrl(): string {
  // Support Vite envs: VITE_API_BASE_URL without trailing slash
  const env = import.meta.env;
  const raw = env?.VITE_API_BASE_URL as string | undefined;
  
  // En développement (localhost), utiliser le proxy Vite (retourner une chaîne vide)
  // Le proxy Vite redirigera automatiquement /api/* vers le backend Azure
  const isDevelopment = env?.DEV === true || env?.MODE === 'development';
  
  if (isDevelopment) {
    // En mode développement, TOUJOURS utiliser le proxy (chaîne vide)
    // Même si VITE_API_BASE_URL est défini
    console.log('🔧 Mode développement détecté - utilisation du proxy Vite pour les requêtes API');
    return ""; // Utiliser le proxy Vite en développement
  }
  
  const fallback = "https://seeg-backend-api.azurewebsites.net"; // prod default
  const base = (raw && typeof raw === "string" ? raw : fallback).replace(/\/$/, "");
  return base;
}

function getAuthToken(): string | null {
  try {
    // Single place to read token set by our backend auth flow
    return localStorage.getItem("hcm_access_token");
  } catch {
    return null;
  }
}

async function handleResponse(res: Response, responseType: ResponseType = "json") {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    
    // 🔍 LOG DE DÉBOGAGE - Afficher l'erreur backend
    console.error(`❌ [API ERROR] Status ${res.status}:`, text);
    
    // Essayer de parser l'erreur JSON si possible
    try {
      const errorJson = JSON.parse(text);
      console.error('❌ [API ERROR] Détails:', errorJson);
    } catch {
      // L'erreur n'est pas en JSON
    }
    
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  switch (responseType) {
    case "blob":
      return await res.blob();
    case "text":
      return await res.text();
    case "json":
    default: {
      // Handle empty body safely
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const txt = await res.text().catch(() => "");
        try {
          return txt ? JSON.parse(txt) : null;
        } catch {
          return txt as unknown;
        }
      }
      return await res.json().catch(() => null);
    }
  }
}

function buildHeaders(init?: HeadersInit, hasBody?: boolean, isFormData?: boolean): HeadersInit {
  const base: Record<string, string> = {
    Accept: "application/json",
  };
  if (hasBody && !isFormData) {
    base["Content-Type"] = "application/json";
  }

  // Attach Authorization if available
  const token = getAuthToken();
  if (token && typeof token === "string" && token.trim().length > 0) {
    base["Authorization"] = `Bearer ${token}`;
  }

  return { ...base, ...(init as Record<string, string> | undefined) };
}

function resolveUrl(url: string): string {
  const apiBase = getApiBaseUrl();
  
  // If url starts with http(s), use as-is
  if (/^https?:\/\//i.test(url)) return url;
  
  // If it starts with '/', prefix with API base (or keep as-is if base is empty)
  let resolvedUrl: string;
  if (url.startsWith("/")) {
    resolvedUrl = `${apiBase}${url}`;
  } else {
    // Relative path fallback
    resolvedUrl = `${apiBase}/${url.replace(/^\//, "")}`;
  }
  
  // Log en développement pour déboguer
  if (import.meta.env.DEV) {
    console.log(`🌐 API Request: ${url} → ${resolvedUrl}`);
  }
  
  return resolvedUrl;
}

async function request<T = unknown>(
  method: string,
  url: string,
  body?: unknown,
  options: ApiOptions = {}
): Promise<{ data: T } & { status: number; headers: Headers }> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(resolveUrl(url), {
    method,
    headers: buildHeaders(options.headers, hasBody, isFormData),
    body: hasBody ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    signal: options.signal,
    // credentials: "include", // Uncomment if your API needs cookies
  });

  const data = (await handleResponse(res, options.responseType)) as T;
  return { data, status: res.status, headers: res.headers };
}

export const api = {
  get<T = unknown>(url: string, options?: ApiOptions) {
    return request<T>("GET", url, undefined, options);
  },
  delete<T = unknown>(url: string, options?: ApiOptions) {
    return request<T>("DELETE", url, undefined, options);
  },
  post<T = unknown>(url: string, body?: unknown, options?: ApiOptions) {
    return request<T>("POST", url, body, options);
  },
  put<T = unknown>(url: string, body?: unknown, options?: ApiOptions) {
    return request<T>("PUT", url, body, options);
  },
  patch<T = unknown>(url: string, body?: unknown, options?: ApiOptions) {
    return request<T>("PATCH", url, body, options);
  },
};
