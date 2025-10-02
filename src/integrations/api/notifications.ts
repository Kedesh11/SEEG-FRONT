import { api } from "@/integrations/api/client";
import { API_BASE } from "@/integrations/api/routes";

export interface NotificationDTO {
  id: number | string;
  user_id: string | number;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  created_at: string;
}

const BASE = `${API_BASE}/notifications` as const;

export async function listNotifications() {
  const { data } = await api.get<{ data?: NotificationDTO[] }>(`${BASE}/`);
  return (data?.data ?? []) as NotificationDTO[];
}

export async function getNotification(id: string | number) {
  const { data } = await api.get<{ data?: NotificationDTO }>(`${BASE}/${encodeURIComponent(String(id))}`);
  return (data?.data ?? null) as NotificationDTO | null;
}

export async function markAsRead(id: string | number) {
  const { data } = await api.put<{ data?: NotificationDTO }>(`${BASE}/${encodeURIComponent(String(id))}/read`, {});
  return (data?.data ?? null) as NotificationDTO | null;
}

export async function markAllAsRead() {
  const { status } = await api.put(`${BASE}/read-all`, {});
  return status === 204;
}

export async function getUnreadCount() {
  const { data } = await api.get<{ count?: number }>(`${BASE}/stats/unread-count`);
  return (data?.count ?? 0) as number;
}

// GET stats/overview - Statistiques globales des notifications
export interface NotificationStatsDTO {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  notifications_by_type?: Record<string, number>;
  recent_notifications?: number;
}

export async function getNotificationStats(): Promise<NotificationStatsDTO | null> {
  try {
    const { data } = await api.get<NotificationStatsDTO>(`${BASE}/stats/overview`);
    return data as NotificationStatsDTO;
  } catch {
    return null;
  }
} 