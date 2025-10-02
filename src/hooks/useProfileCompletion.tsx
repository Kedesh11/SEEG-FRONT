import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useMyProfile } from "./useUsers";

/**
 * Hook pour calculer le pourcentage de complétion du profil
 * Calcul côté client basé sur les données du profil utilisateur
 */
export function useProfileCompletion() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();

  const completionPercentage = useMemo(() => {
    if (!user && !profile) return 0;

    const fields = [
      user?.email,
      user?.first_name,
      user?.last_name,
      user?.phone,
      user?.date_of_birth,
      profile?.gender,
      profile?.current_position,
      profile?.birth_date,
    ];

    const completedFields = fields.filter((field) => field && field !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  }, [user, profile]);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    
    if (!user?.first_name) missing.push('Prénom');
    if (!user?.last_name) missing.push('Nom');
    if (!user?.phone) missing.push('Téléphone');
    if (!user?.date_of_birth) missing.push('Date de naissance');
    if (!profile?.gender) missing.push('Genre');
    if (!profile?.current_position) missing.push('Poste actuel');

    return missing;
  }, [user, profile]);

  return {
    completionPercentage,
    missingFields,
    isComplete: completionPercentage === 100,
  };
}
