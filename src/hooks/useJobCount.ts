import { useJobOffers } from "./useJobOffers";

/**
 * Hook simple pour récupérer le nombre d'offres d'emploi
 * Utilise useJobOffers() qui charge depuis l'API Backend
 */
export function useJobCount() {
  const { data: jobs, isLoading } = useJobOffers();
  
  return {
    count: jobs?.length || 0,
    isLoading,
  };
}
