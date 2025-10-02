import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  listNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  type NotificationDTO,
} from "@/integrations/api/notifications";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  created_at: string;
}

function mapNotification(dto: NotificationDTO): Notification {
  return {
    id: String(dto.id),
    user_id: String(dto.user_id),
    title: dto.title,
    message: dto.message,
    read: dto.read,
    link: dto.link,
    created_at: dto.created_at,
  };
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const notifications = await listNotifications();
      return notifications.map(mapNotification);
    },
    enabled: !!user,
    refetchInterval: 30000, // Polling every 30s
  });
}

export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unreadNotificationsCount', user?.id],
    queryFn: async () => {
      return await getUnreadCount();
    },
    enabled: !!user,
    refetchInterval: 15000, // Polling every 15s
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const updated = await markAsRead(notificationId);
      return updated ? mapNotification(updated) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', user?.id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      return await markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', user?.id] });
    },
  });
}

