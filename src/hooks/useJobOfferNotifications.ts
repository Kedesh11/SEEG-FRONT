import { useEffect } from "react";
import { useNotifications } from "./useNotifications";
import { toast } from "sonner";

/**
 * Hook pour gérer les notifications des offres d'emploi
 * Utilise le système de notifications Backend avec polling
 */
export function useJobOfferNotifications() {
  const { data: notifications } = useNotifications();

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Filtrer les notifications non lues liées aux offres d'emploi
    const unreadJobNotifications = notifications.filter(
      (notif) => !notif.read && notif.title.toLowerCase().includes('offre')
    );

    // Afficher un toast pour chaque nouvelle notification
    unreadJobNotifications.forEach((notif) => {
      toast.info(notif.title, {
        description: notif.message,
      });
    });
  }, [notifications]);
}
