import { api } from "@/integrations/api/client";
import { ROUTES, withQuery, type QueryParams } from "@/integrations/api/routes";

export interface UserDTO {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  matricule?: number | null;
  date_of_birth?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateProfileDTO {
  user_id: string;
  gender?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  current_position?: string | null;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

// Type guards
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractDataWrapper<T>(value: unknown): T | null {
  if (!isRecord(value)) return null;
  const maybeData = value["data"];
  return (isRecord(maybeData) || Array.isArray(maybeData)) ? (maybeData as T) : (value as T);
}

export async function listUsers(params?: QueryParams) {
  const url = withQuery(ROUTES.USERS.BASE, params);
  const { data } = await api.get<unknown>(url);
  const root = extractDataWrapper<unknown>(data) ?? data;
  const container = extractDataWrapper<Record<string, unknown>>(root) ?? (isRecord(root) ? root : {});
  const items = Array.isArray((container as Record<string, unknown>)["items"]) ? ((container as Record<string, unknown>)["items"] as UserDTO[]) : [];
  const total = typeof (container as Record<string, unknown>)["total"] === "number" ? (container as Record<string, unknown>)["total"] as number : items.length;
  const page = typeof (container as Record<string, unknown>)["page"] === "number" ? (container as Record<string, unknown>)["page"] as number : 1;
  const size = typeof (container as Record<string, unknown>)["size"] === "number" ? (container as Record<string, unknown>)["size"] as number : items.length;
  return { items, total, page, size } as Paginated<UserDTO>;
}

export async function getUserById(userId: string | number) {
  const { data } = await api.get<unknown>(`${ROUTES.USERS.BASE}/${encodeURIComponent(String(userId))}`);
  const root = extractDataWrapper<unknown>(data) ?? data;
  const record = isRecord(root) ? root : {};
  // Some responses wrap user under "data"
  const inner = extractDataWrapper<UserDTO>(record) ?? (record as unknown as UserDTO | null);
  return inner ?? null;
}

export async function deleteUser(userId: string | number) {
  const { status } = await api.delete(`${ROUTES.USERS.BASE}/${encodeURIComponent(String(userId))}`);
  return status === 204;
}

export async function updateMe(partial: Partial<UserDTO>) {
  const { data } = await api.put<unknown>(ROUTES.USERS.ME, partial);
  const root = extractDataWrapper<UserDTO>(data) ?? (data as UserDTO | null);
  return root ?? null;
}

export async function getMyProfile() {
  const { data } = await api.get<unknown>(`${ROUTES.USERS.BASE}/me/profile`);
  const root = extractDataWrapper<CandidateProfileDTO>(data) ?? (data as CandidateProfileDTO | null);
  return root ?? null;
} 