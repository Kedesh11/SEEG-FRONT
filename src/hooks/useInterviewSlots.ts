import { useState, useEffect, useCallback, useMemo } from 'react';
import { listSlots, createSlot as beCreateSlot, updateSlot as beUpdateSlot, type InterviewSlotDTO } from '@/integrations/api/interviews';

export interface InterviewSlot {
  id: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:MM
  application_id: string;
  candidate_name: string;
  job_title: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  applicationId?: string;
  candidateName?: string;
}

export const useInterviewSlots = () => {
  const [bookedSlots, setBookedSlots] = useState<InterviewSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Créneaux horaires d'1 heure (9h-12h, 13h, 14h-17h)
  const timeSlots = useMemo(() => (
    [
      '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00'
    ]
  ), []);

  // Mapper DTO backend -> UI
  const mapBeToUi = (be: InterviewSlotDTO): InterviewSlot => ({
    id: String(be.id),
    application_id: String(be.application_id),
    candidate_name: be.candidate_name,
    job_title: be.job_title,
    date: be.date,
    time: be.time,
    status: be.status as InterviewSlot['status'],
    created_at: String(be.created_at ?? ''),
    updated_at: String(be.updated_at ?? ''),
  });

  // Charger tous les créneaux réservés (statut scheduled)
  const loadBookedSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listSlots({ status: 'scheduled', limit: 1000 });
      const slots = Array.isArray(list) ? list : [];
      setBookedSlots(slots.map(mapBeToUi));
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Vérifier si un créneau est occupé
  const isSlotBooked = useCallback((date: Date, time: string): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedSlots.some(slot => 
      slot.date === dateStr && 
      slot.time === time && 
      slot.status === 'scheduled'
    );
  }, [bookedSlots]);

  // Obtenir les créneaux disponibles pour une date
  const getAvailableSlots = useCallback((date: Date): TimeSlot[] => {
    const dateStr = date.toISOString().split('T')[0];
    
    return timeSlots.map(time => {
      const bookedSlot = bookedSlots.find(slot => 
        slot.date === dateStr && 
        slot.time === time && 
        slot.status === 'scheduled'
      );
      
      return {
        time,
        isAvailable: !bookedSlot,
        applicationId: bookedSlot?.application_id,
        candidateName: bookedSlot?.candidate_name
      };
    });
  }, [bookedSlots, timeSlots]);

  // Réserver un créneau
  const bookSlot = useCallback(async (
    date: Date, 
    time: string, 
    applicationId: string, 
    candidateName: string, 
    jobTitle: string,
    options?: { sendEmail?: boolean }
  ): Promise<boolean> => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      if (isSlotBooked(date, time)) throw new Error('Ce créneau est déjà réservé');

      // Annuler l'ancien créneau: on marque l'existant en cancelled (si trouvé)
      const existing = bookedSlots.find(s => s.application_id === applicationId && s.status === 'scheduled');
      if (existing) {
        try {
          await beUpdateSlot(existing.id, { status: 'cancelled' });
        } catch (e) {
          // non bloquant
        }
      }

      // Créer le nouveau créneau
      await beCreateSlot({
        application_id: applicationId as unknown as string,
        candidate_name: candidateName,
        job_title: jobTitle,
        date: dateStr,
        time,
        status: 'scheduled',
      });

      // Option email: conservée côté client via endpoint custom si besoin (non bloquant)
      if (options?.sendEmail) {
        try {
          const dateStrKeep = date.toISOString().split('T')[0];
          await fetch('/api/send-interview-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'support@seeg-talentsource.com',
              candidateFullName: candidateName,
              jobTitle,
              date: dateStrKeep,
              time,
              applicationId
            })
          });
        } catch (e) {
          // non bloquant
        }
      }

      await loadBookedSlots();
      return true;
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      return false;
    }
  }, [isSlotBooked, loadBookedSlots, bookedSlots]);

  // Annuler un créneau pour une candidature
  const cancelSlot = useCallback(async (applicationId: string): Promise<boolean> => {
    try {
      const existing = bookedSlots.find(s => s.application_id === applicationId && s.status === 'scheduled');
      if (existing) {
        await beUpdateSlot(existing.id, { status: 'cancelled' });
      }
      await loadBookedSlots();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      return false;
    }
  }, [bookedSlots, loadBookedSlots]);

  // Obtenir le créneau réservé pour une candidature
  const getBookedSlotForApplication = useCallback((applicationId: string): InterviewSlot | undefined => {
    return bookedSlots.find(slot => 
      slot.application_id === applicationId && 
      slot.status === 'scheduled'
    );
  }, [bookedSlots]);

  // Vérifier si une date est complètement occupée
  const isDateFullyBooked = useCallback((date: Date): boolean => {
    const availableSlots = getAvailableSlots(date);
    return availableSlots.every(slot => !slot.isAvailable);
  }, [getAvailableSlots]);

  // Vérifier si une date est partiellement occupée
  const isDatePartiallyBooked = useCallback((date: Date): boolean => {
    const availableSlots = getAvailableSlots(date);
    const hasAvailable = availableSlots.some(slot => slot.isAvailable);
    const hasBooked = availableSlots.some(slot => !slot.isAvailable);
    return hasAvailable && hasBooked;
  }, [getAvailableSlots]);

  // Charger les créneaux au montage du composant
  useEffect(() => {
    loadBookedSlots();
  }, [loadBookedSlots]);

  return {
    bookedSlots,
    isLoading,
    timeSlots,
    isSlotBooked,
    getAvailableSlots,
    bookSlot,
    cancelSlot,
    getBookedSlotForApplication,
    isDateFullyBooked,
    isDatePartiallyBooked,
    loadBookedSlots
  };
};