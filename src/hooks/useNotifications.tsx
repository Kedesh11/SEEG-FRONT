import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { listNotifications, markAsRead as beMarkAsRead, markAllAsRead as beMarkAllAsRead, type NotificationDTO } from "@/integrations/api/notifications";
import { useEffect, useMemo } from "react";

export interface Notification {
  id: number | string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['notifications', user?.id];

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery<Notification[], Error>({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const list = await listNotifications();
      return (list || [])
        .filter((n: NotificationDTO) => String(n.user_id) === String(user.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(n => ({
          id: n.id,
          user_id: String(n.user_id),
          title: n.title,
          message: n.message,
          read: n.read,
          link: (n as NotificationDTO).link ?? null,
          created_at: n.created_at,
        }));
    },
    enabled: !!user,
  });

  // WebSocket base URL (ws/wss) from API base env
  const wsUrl = useMemo(() => {
    if (!user) return null;
    const raw = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_API_BASE_URL as string | undefined;
    const httpBase = (raw && typeof raw === 'string' ? raw : window.location.origin.replace(/\/$/, ""));
    const wsBase = httpBase.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
    const token = (() => {
      try { return localStorage.getItem('hcm_access_token'); } catch { return null; }
    })();
    if (!token) return null;
    return `${wsBase}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;
  }, [user]);

  // Connect WebSocket and react to realtime events
  useEffect(() => {
    if (!wsUrl) return;
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        // optionnel: ping/ready
      };
      socket.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as { type?: string } & Record<string, unknown>;
          const type = msg?.type || '';
          switch (type) {
            case 'notifications:unread_count':
            case 'notifications:updated':
            case 'notifications:updated_all':
            case 'notifications:new':
              // Invalider la liste pour refetch
              queryClient.invalidateQueries({ queryKey });
              break;
            default:
              break;
          }
        } catch {
          // ignorer
        }
      };
      socket.onerror = () => {
        // silencieux
      };
    } catch {
      // silencieux
    }
    return () => {
      try { socket?.close(); } catch { /* noop */ }
    };
  }, [wsUrl, queryClient, queryKey]);

  // Mark one notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number | string) => {
      if (!user) return;
      await beMarkAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await beMarkAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notifications,
    isLoading,
    error,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
