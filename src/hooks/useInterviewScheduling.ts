import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  listSlots, 
  createSlot, 
  updateSlot, 
  deleteSlot,
  type InterviewSlotDTO 
} from '@/integrations/api/interviews';

interface LinkedUserRecord {
  first_name?: string;
  last_name?: string;
}

interface LinkedJobOfferRecord {
  title?: string;
}

interface ApplicationDetails {
  candidate_id?: string | null;
  job_offer_id?: string | null;
  users?: LinkedUserRecord | LinkedUserRecord[];
  job_offers?: LinkedJobOfferRecord | LinkedJobOfferRecord[];
}

export interface InterviewSlot {
  id?: string;
  date: string; // Format YYYY-MM-DD
  time: string; // Format HH:MM:SS
  isAvailable: boolean;
  applicationId?: string;
  recruiterId?: string;
  candidateId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook pour la gestion de la planification des entretiens via l'API backend
 * Remplace l'ancienne version qui utilisait Supabase
 */
export function useInterviewScheduling(jobOfferId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fonction pour normaliser le format de l'heure
  const normalizeTimeToHms = (time: string) => {
    if (!time) return '00:00:00';
    const parts = time.split(':');
    if (parts.length === 2) return `${time}:00`;
    if (parts.length === 3) return time;
    return '00:00:00';
  };

  // Charger les créneaux disponibles depuis l'API backend
  const loadAvailableSlots = useCallback(async (dateFilter?: { start?: string; end?: string }) => {
    if (!jobOfferId && !dateFilter) return;
    
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      
      if (jobOfferId) {
        params.job_offer_id = jobOfferId;
      }
      
      if (dateFilter?.start) {
        params.date_from = dateFilter.start;
      }
      
      if (dateFilter?.end) {
        params.date_to = dateFilter.end;
      }

      const data = await listSlots(params);
      
      if (!mountedRef.current) return;

      // Convertir les données de l'API au format attendu
      const formattedSlots: InterviewSlot[] = data.map((slot: InterviewSlotDTO) => ({
        id: String(slot.id),
          date: slot.date,
        time: normalizeTimeToHms(slot.time),
        isAvailable: slot.status !== 'scheduled',
        applicationId: slot.application_id ? String(slot.application_id) : undefined,
          createdAt: slot.created_at,
        updatedAt: slot.updated_at,
      }));

      setSlots(formattedSlots);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des créneaux:', error);
      if (mountedRef.current) {
      toast({
          title: 'Erreur',
          description: 'Impossible de charger les créneaux d\'entretien',
          variant: 'destructive',
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [jobOfferId, toast]);

  // Planifier un entretien
  const scheduleInterview = useCallback(async (
    date: string,
    time: string,
    applicationId: string
  ) => {
    if (!user) {
        toast({
        title: 'Non autorisé',
        description: 'Vous devez être connecté pour planifier un entretien',
        variant: 'destructive',
      });
      return { success: false, error: 'Non autorisé' };
    }

    try {
      const normalizedTime = normalizeTimeToHms(time);

      const payload = {
            date,
            time: normalizedTime,
            application_id: applicationId,
            status: 'scheduled',
      };

      await createSlot(payload);

      if (mountedRef.current) {
        toast({
          title: 'Succès',
          description: 'Entretien planifié avec succès',
        });
        
        // Recharger les créneaux
        await loadAvailableSlots();
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la planification:', error);
      
      if (mountedRef.current) {
        toast({
          title: 'Erreur',
          description: 'Impossible de planifier l\'entretien',
          variant: 'destructive',
        });
      }

      return { success: false, error: String(error) };
    }
  }, [user, toast, loadAvailableSlots]);

  // Annuler un entretien
  const cancelInterview = useCallback(async (slotId: string) => {
    if (!user) {
      toast({
        title: 'Non autorisé',
        description: 'Vous devez être connecté',
        variant: 'destructive',
      });
      return { success: false, error: 'Non autorisé' };
    }

    try {
      await updateSlot(slotId, {
        status: 'cancelled',
      });

      if (mountedRef.current) {
        toast({
          title: 'Succès',
          description: 'Entretien annulé',
        });
        
        // Recharger les créneaux
        await loadAvailableSlots();
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      
      if (mountedRef.current) {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'annuler l\'entretien',
          variant: 'destructive',
        });
      }

      return { success: false, error: String(error) };
    }
  }, [user, toast, loadAvailableSlots]);

  // Supprimer un créneau
  const removeSlot = useCallback(async (slotId: string) => {
    if (!user) {
      toast({
        title: 'Non autorisé',
        description: 'Vous devez être connecté',
        variant: 'destructive',
      });
      return { success: false, error: 'Non autorisé' };
    }

    try {
      await deleteSlot(slotId);

      if (mountedRef.current) {
      toast({
          title: 'Succès',
          description: 'Créneau supprimé',
      });

      // Recharger les créneaux
        await loadAvailableSlots();
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      
      if (mountedRef.current) {
      toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le créneau',
          variant: 'destructive',
        });
      }

      return { success: false, error: String(error) };
    }
  }, [user, toast, loadAvailableSlots]);

  // Charger les créneaux au montage et quand jobOfferId change
  useEffect(() => {
    if (jobOfferId) {
      loadAvailableSlots();
    }
  }, [jobOfferId, loadAvailableSlots]);

  const availableSlots = useMemo(() => {
    return slots.filter(slot => slot.isAvailable);
  }, [slots]);

  const bookedSlots = useMemo(() => {
    return slots.filter(slot => !slot.isAvailable);
  }, [slots]);

  return {
    slots,
    availableSlots,
    bookedSlots,
    isLoading,
    loadAvailableSlots,
    scheduleInterview,
    cancelInterview,
    removeSlot,
  };
}
