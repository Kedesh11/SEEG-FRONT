/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getJobs, getMyJobs, getRecruiterStatistics, type RecruiterStatsDTO, type JobOffer } from "@/integrations/api/jobs";
import { getApplications, getApplicationStats, getApplicationAdvancedStats, type Application, type ApplicationAdvancedStatsDTO } from "@/integrations/api/applications";
import { getDashboardStatsOptimized } from "@/integrations/api/optimized";

export interface RecruiterStats {
  totalJobs: number;
  totalCandidates: number;
  newCandidates: number;
  interviewsScheduled: number;
  malePercent?: number;
  femalePercent?: number;
  multiPostCandidates?: number;
}

export interface DepartmentStats {
  department: string;
  jobCount: number;
  applicationCount: number;
  coverageRate: number;
}

export interface RecruiterJobOffer {
  id: string;
  title: string;
  location: string;
  contract_type: string;
  candidate_count: number;
  new_candidates: number;
  created_at: string;
}

export interface JobCoverageData {
  id: string;
  title: string;
  current_applications: number;
  coverage_rate: number;
  coverage_status: 'excellent' | 'good' | 'moderate' | 'low';
}

export interface StatusEvolutionData {
  date: string;
  candidature: number;
  incubation: number;
  embauche: number;
  refuse: number;
}

export interface ApplicationsPerJobData {
  id: string;
  title: string;
  applications_count: number;
  new_applications_24h: number;
}

/**
 * Construit les données du dashboard à partir des stats du recruteur (endpoints spécifiques)
 * Utilise PRIORITAIREMENT la route: GET /api/v1/jobs/recruiter/statistics
 */
function buildDashboardFromRecruiterStats(
  recruiterStats: RecruiterStatsDTO,
  advancedStats: ApplicationAdvancedStatsDTO | null,
  myJobs: JobOffer[],
  applications: Application[]
) {
  console.log('✅ Utilisation de la route spécifique recruteur: /api/v1/jobs/recruiter/statistics');
  
  // Stats de base depuis l'API backend (route spécifique recruteur)
  const stats: RecruiterStats = {
    totalJobs: recruiterStats.total_jobs || recruiterStats.active_jobs || 0,
    totalCandidates: recruiterStats.total_applications || 0,
    newCandidates: recruiterStats.new_applications || 0,
    interviewsScheduled: Object.entries(recruiterStats.applications_by_status)
      .filter(([status]) => status === 'incubation' || status === 'entretien_programme')
      .reduce((sum, [, count]) => sum + (count as number), 0),
  };

  // Traiter les jobs avec les stats du backend
  const processedJobs: RecruiterJobOffer[] = myJobs.map(job => {
    // Utiliser les données de l'API backend (applications_by_job)
    const jobAppsCount = recruiterStats.applications_by_job[job.id] || 0;
    
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    // Calculer les nouvelles candidatures des 24h
    const newApplications = applications.filter(app => {
      const appDate = new Date(app.created_at || '');
      return app.job_offer_id === job.id && appDate > oneDayAgo;
    }).length;

    return {
      id: job.id,
      title: job.title,
      location: Array.isArray(job.location) ? job.location[0] : job.location,
      contract_type: job.contract_type,
      created_at: job.created_at,
      candidate_count: jobAppsCount, // ✅ Depuis API backend
      new_candidates: newApplications,
    };
  });

  // Job Coverage (utilise les données de recruiterStats.applications_by_job)
  const jobCoverage: JobCoverageData[] = processedJobs.map(job => {
    const current = job.candidate_count; // ✅ Depuis API backend
    const rate = Math.min(100, (current / 10) * 100);
    
    let status: 'excellent' | 'good' | 'moderate' | 'low' = 'low';
    if (rate >= 80) status = 'excellent';
    else if (rate >= 60) status = 'good';
    else if (rate >= 40) status = 'moderate';

    return {
      id: job.id,
      title: job.title,
      current_applications: current,
      coverage_rate: rate,
      coverage_status: status,
    };
  });

  // Applications Per Job (utilise les données de recruiterStats.applications_by_job)
  const applicationsPerJob: ApplicationsPerJobData[] = processedJobs.map(job => ({
    id: job.id,
    title: job.title,
    applications_count: job.candidate_count, // ✅ Depuis API backend
    new_applications_24h: job.new_candidates,
  }));

  // Status Evolution (utiliser advancedStats si disponible)
  const statusEvolution: StatusEvolutionData[] = [];
  if (advancedStats?.by_period) {
    // Utiliser les données de l'API
    Object.entries(advancedStats.by_period).forEach(([date, count]) => {
      const dayApps = applications.filter(app => {
        const appDate = new Date(app.created_at || '');
        return appDate.toISOString().split('T')[0] === date;
      });

      statusEvolution.push({
        date,
        candidature: dayApps.filter(a => a.status === 'candidature').length,
        incubation: dayApps.filter(a => a.status === 'incubation').length,
        embauche: dayApps.filter(a => a.status === 'embauche').length,
        refuse: dayApps.filter(a => a.status === 'refuse').length,
      });
    });
  } else {
    // Calculer pour les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayApps = applications.filter(app => {
        const appDate = new Date(app.created_at || '');
        return appDate.toISOString().split('T')[0] === dateStr;
      });

      statusEvolution.push({
        date: dateStr,
        candidature: dayApps.filter(a => a.status === 'candidature').length,
        incubation: dayApps.filter(a => a.status === 'incubation').length,
        embauche: dayApps.filter(a => a.status === 'embauche').length,
        refuse: dayApps.filter(a => a.status === 'refuse').length,
      });
    }
  }

  return {
    stats,
    activeJobs: processedJobs,
    jobCoverage,
    statusEvolution,
    applicationsPerJob,
  };
}

export function useRecruiterDashboard() {
  const { user, isRecruiter, isAdmin, isObserver } = useAuth();

  const fetchDashboardData = async () => {
    if (!user) {
      return { 
        stats: null, 
        activeJobs: [], 
        jobCoverage: [],
        statusEvolution: [],
        applicationsPerJob: []
      };
    }

    // 1. Utiliser l'endpoint optimisé si disponible (PRIORITÉ 1)
    try {
      const optimizedData = await getDashboardStatsOptimized();
      if (optimizedData) {
        console.log('✅ Dashboard: Utilisation de l\'endpoint optimisé');
        return optimizedData;
      }
    } catch (error) {
      console.warn('⚠️ Optimized dashboard not available, falling back to specific endpoints');
    }

    // 2. PRIORITÉ: Utiliser la route spécifique recruteur /api/v1/jobs/recruiter/statistics
    try {
      const [recruiterStats, advancedStats, myJobs, applications] = await Promise.all([
        getRecruiterStatistics(), // ✅ Route spécifique recruteur
        getApplicationAdvancedStats(), // Stats avancées
        getMyJobs({ status: 'active' }), // Mes jobs uniquement
        getApplications(), // Toutes les candidatures (pour calculs complémentaires)
      ]);

      // Si on a les stats du recruteur, les utiliser (c'est la route recommandée!)
      if (recruiterStats) {
        return buildDashboardFromRecruiterStats(recruiterStats, advancedStats, myJobs, applications);
      }
    } catch (error) {
      console.warn('⚠️ Recruiter-specific endpoints failed, falling back to manual calculation', error);
    }

    // 3. Fallback final: Calculer manuellement avec les endpoints génériques (PRIORITÉ 3)
    console.warn('⚠️ Dashboard: Utilisation du fallback manuel (endpoints génériques)');
    const jobs = await getJobs({ status: 'active' });
    const applications = await getApplications();
    const appStats = await getApplicationStats();

    // Calculer les stats
    const processedJobs: RecruiterJobOffer[] = jobs.map(job => {
      const jobApplications = applications.filter(app => app.job_offer_id === job.id);
      
      const totalApplications = jobApplications.length;
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const newApplications = jobApplications.filter(app => {
        const appDate = new Date(app.created_at || '');
        return appDate > oneDayAgo;
      }).length;

      return {
        id: job.id,
        title: job.title,
        location: Array.isArray(job.location) ? job.location[0] : job.location,
        contract_type: job.contract_type,
        created_at: job.created_at,
        candidate_count: totalApplications,
        new_candidates: newApplications,
      };
    });

    // Candidats uniques
    const candidateIds = new Set(applications.map(a => a.candidate_id).filter(Boolean));
    const totalCandidates = candidateIds.size;

    // Nouvelles candidatures (24h)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const newCandidates = applications.filter(app => {
      const appDate = new Date(app.created_at || '');
      return appDate > oneDayAgo;
    }).length;

    // Entretiens programmés
    const interviewsScheduled = applications.filter(app => 
      app.status === 'incubation' || app.status === 'entretien_programme'
    ).length;

    // Stats multi-candidatures
    const applicationsByCandidate = new Map<string, Set<string>>();
    applications.forEach(app => {
      if (!app.candidate_id || !app.job_offer_id) return;
      if (!applicationsByCandidate.has(app.candidate_id)) {
        applicationsByCandidate.set(app.candidate_id, new Set());
      }
      applicationsByCandidate.get(app.candidate_id)!.add(app.job_offer_id);
    });
    
    const multiPostCandidates = Array.from(applicationsByCandidate.values())
      .filter(jobs => jobs.size > 1).length;

    const stats: RecruiterStats = {
      totalJobs: processedJobs.length,
      totalCandidates,
      newCandidates,
      interviewsScheduled,
      multiPostCandidates,
    };

    // Job Coverage
    const jobCoverage: JobCoverageData[] = processedJobs.map(job => {
      const current = job.candidate_count;
      const rate = Math.min(100, (current / 10) * 100); // Assuming 10 is the target
      
      let status: 'excellent' | 'good' | 'moderate' | 'low' = 'low';
      if (rate >= 80) status = 'excellent';
      else if (rate >= 60) status = 'good';
      else if (rate >= 40) status = 'moderate';

      return {
        id: job.id,
        title: job.title,
        current_applications: current,
        coverage_rate: rate,
        coverage_status: status,
      };
    });

    // Applications Per Job
    const applicationsPerJob: ApplicationsPerJobData[] = processedJobs.map(job => ({
      id: job.id,
      title: job.title,
      applications_count: job.candidate_count,
      new_applications_24h: job.new_candidates,
    }));

    // Status Evolution (derniers 7 jours)
    const statusEvolution: StatusEvolutionData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayApps = applications.filter(app => {
        const appDate = new Date(app.created_at || '');
        return appDate.toISOString().split('T')[0] === dateStr;
      });

      statusEvolution.push({
        date: dateStr,
        candidature: dayApps.filter(a => a.status === 'candidature').length,
        incubation: dayApps.filter(a => a.status === 'incubation').length,
        embauche: dayApps.filter(a => a.status === 'embauche').length,
        refuse: dayApps.filter(a => a.status === 'refuse').length,
      });
    }

    return {
      stats,
      activeJobs: processedJobs,
      jobCoverage,
      statusEvolution,
      applicationsPerJob,
    };
  };

  return useQuery({
    queryKey: ['recruiterDashboard', user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user && (isRecruiter || isAdmin || isObserver),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateJobOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobData: any) => {
      // Utiliser l'API backend pour créer une offre
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://seeg-backend-api.azurewebsites.net'}/api/v1/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hcm_access_token')}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Failed to create job offer');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['jobOffers'] });
    },
  });
}

export function useUpdateJobOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, jobData }: { id: string; jobData: any }) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://seeg-backend-api.azurewebsites.net'}/api/v1/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hcm_access_token')}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Failed to update job offer');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['jobOffers'] });
    },
  });
}

export function useDeleteJobOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://seeg-backend-api.azurewebsites.net'}/api/v1/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hcm_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete job offer');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['jobOffers'] });
    },
  });
}
