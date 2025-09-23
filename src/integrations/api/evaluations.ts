import { api } from "@/integrations/api/client";
import { API_BASE } from "@/integrations/api/routes";

export interface Protocol1EvaluationDTO {
  id: string | number;
  application_id: string | number;
  score?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Protocol2EvaluationDTO {
  id: string | number;
  application_id: string | number;
  exactitude?: number | null;
  details?: unknown;
  created_at?: string;
  updated_at?: string;
}

const BASE = `${API_BASE}/evaluations` as const;

export async function createProtocol1(payload: Partial<Protocol1EvaluationDTO>) {
  const { data } = await api.post<Protocol1EvaluationDTO>(`${BASE}/protocol1`, payload);
  return data;
}

export async function getProtocol1ById(id: string | number) {
  const { data } = await api.get<Protocol1EvaluationDTO>(`${BASE}/protocol1/${encodeURIComponent(String(id))}`);
  return data;
}

export async function updateProtocol1(id: string | number, payload: Partial<Protocol1EvaluationDTO>) {
  const { data } = await api.put<Protocol1EvaluationDTO>(`${BASE}/protocol1/${encodeURIComponent(String(id))}` , payload);
  return data;
}

export async function listProtocol1ByApplication(applicationId: string | number) {
  const { data } = await api.get<Protocol1EvaluationDTO[]>(`${BASE}/protocol1/application/${encodeURIComponent(String(applicationId))}`);
  return data;
}

export async function createProtocol2(payload: Partial<Protocol2EvaluationDTO>) {
  const { data } = await api.post<Protocol2EvaluationDTO>(`${BASE}/protocol2`, payload);
  return data;
}

export async function getProtocol2ById(id: string | number) {
  const { data } = await api.get<Protocol2EvaluationDTO>(`${BASE}/protocol2/${encodeURIComponent(String(id))}`);
  return data;
}

export async function updateProtocol2(id: string | number, payload: Partial<Protocol2EvaluationDTO>) {
  const { data } = await api.put<Protocol2EvaluationDTO>(`${BASE}/protocol2/${encodeURIComponent(String(id))}` , payload);
  return data;
}

export async function listProtocol2ByApplication(applicationId: string | number) {
  const { data } = await api.get<Protocol2EvaluationDTO[]>(`${BASE}/protocol2/application/${encodeURIComponent(String(applicationId))}`);
  return data;
} 