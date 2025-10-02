import { useMemo } from "react";
import { useApplications } from "./useApplications";
import { useJobOffers } from "./useJobOffers";

/**
 * Hook pour synthétiser les données de candidatures et d'offres
 * Calcul côté client basé sur les données Backend
 */
export function useSynthesisData() {
  const { applications, isLoading: isLoadingApps } = useApplications();
  const { data: jobs, isLoading: isLoadingJobs } = useJobOffers();

  const synthesis = useMemo(() => {
    if (!applications || !jobs) {
      return {
        totalApplications: 0,
        totalJobs: 0,
        applicationsByStatus: {},
        applicationsByJob: {},
        averageApplicationsPerJob: 0,
      };
    }

    // Applications par statut
    const applicationsByStatus: Record<string, number> = {};
    applications.forEach((app) => {
      const status = app.status || 'unknown';
      applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
    });

    // Applications par offre
    const applicationsByJob: Record<string, number> = {};
    applications.forEach((app) => {
      const jobId = app.job_offer_id || 'unknown';
      applicationsByJob[jobId] = (applicationsByJob[jobId] || 0) + 1;
    });

    // Moyenne d'applications par offre
    const averageApplicationsPerJob = jobs.length > 0 
      ? applications.length / jobs.length 
      : 0;

    return {
      totalApplications: applications.length,
      totalJobs: jobs.length,
      applicationsByStatus,
      applicationsByJob,
      averageApplicationsPerJob: Math.round(averageApplicationsPerJob * 100) / 100,
    };
  }, [applications, jobs]);

  return {
    ...synthesis,
    isLoading: isLoadingApps || isLoadingJobs,
  };
}
