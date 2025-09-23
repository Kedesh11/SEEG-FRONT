import { api } from "@/integrations/api/client";
import { API_BASE, withQuery, type QueryParams } from "@/integrations/api/routes";

export interface InterviewSlotDTO {
  id: string | number;
  application_id: string | number;
  candidate_name: string;
  job_title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  created_at?: string;
  updated_at?: string;
}

export interface InterviewStatsDTO {
  total_interviews: number;
  scheduled_interviews: number;
  completed_interviews: number;
  cancelled_interviews: number;
  interviews_by_status: Record<string, number>;
}

const BASE = `${API_BASE}/interviews` as const;

function baseUrl(path: string = "") { return `${BASE}${path}`; }

export async function createSlot(payload: Partial<InterviewSlotDTO>) {
  const { data } = await api.post<InterviewSlotDTO>(baseUrl("/slots"), payload);
  return data;
}

export async function listSlots(params?: QueryParams) {
  const url = withQuery(baseUrl("/slots"), params);
  const { data } = await api.get<{ slots: InterviewSlotDTO[] } | InterviewSlotDTO[]>(url);
  if (Array.isArray(data)) return data;
  const maybe = (data as { slots?: InterviewSlotDTO[] }).slots;
  return Array.isArray(maybe) ? maybe : [];
}

export async function getSlot(slotId: string | number) {
  const { data } = await api.get<InterviewSlotDTO>(baseUrl(`/slots/${encodeURIComponent(String(slotId))}`));
  return data;
}

export async function updateSlot(slotId: string | number, payload: Partial<InterviewSlotDTO>) {
  const { data } = await api.put<InterviewSlotDTO>(baseUrl(`/slots/${encodeURIComponent(String(slotId))}`), payload);
  return data;
}

export async function deleteSlot(slotId: string | number) {
  const { status } = await api.delete(baseUrl(`/slots/${encodeURIComponent(String(slotId))}`));
  return status === 204;
}

export async function listAvailableCalendar(params: { interviewer_id: string | number; date_from: string; date_to: string; }) {
  const url = withQuery(baseUrl("/calendar/available"), params as unknown as QueryParams);
  const { data } = await api.get<InterviewSlotDTO[]>(url);
  return data;
}

export async function getStatsOverview() {
  const { data } = await api.get<InterviewStatsDTO>(baseUrl("/stats/overview"));
  return data;
} 