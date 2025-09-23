import { useQuery } from "@tanstack/react-query";
import { getJobs, getJobById, type JobOffer as BeJobOffer } from "@/integrations/api/jobs";

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  location: string | string[];
  contract_type: string;
  profile?: string | null;
  department?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  requirements?: string | string[] | null;
  benefits?: string[] | null;
  status: string;
  application_deadline?: string | null;
  created_at: string;
  updated_at: string;
  recruiter_id: string;
  categorie_metier?: string | null;
  date_limite?: string | null;
  reporting_line?: string | null;
  job_grade?: string | null;
  salary_note?: string | null;
  start_date?: string | null;
  responsibilities?: string | string[] | null;
  candidate_count: number;
  new_candidates: number;
}

const fetchJobOffers = async (): Promise<JobOffer[]> => {
  const beJobs = await getJobs();
  return (beJobs as BeJobOffer[]).map((j) => ({ ...j })) as unknown as JobOffer[];
};

export function useJobOffers() {
  return useQuery<JobOffer[], Error>({
    queryKey: ['jobOffers'],
    queryFn: fetchJobOffers,
  });
}

const fetchJobOffer = async (id: string): Promise<JobOffer | null> => {
  if (!id) return null;
  const dt = await getJobById(id);
  return (dt as unknown as JobOffer) ?? null;
};

export function useJobOffer(id: string | undefined) {
  return useQuery<JobOffer | null, Error>({
    queryKey: ['jobOffer', id],
    queryFn: () => {
      if (!id) return Promise.resolve(null);
      return fetchJobOffer(id);
    },
    enabled: !!id,
  });
}

export function useRecruiterJobOffers(recruiterId: string | undefined) {
  // API backend: si besoin plus tard, exposer /jobs?recruiter_id=xxx et l'utiliser ici
  return useQuery<JobOffer[], Error>({
    queryKey: ['recruiterJobOffers', recruiterId],
    queryFn: async () => {
      if (!recruiterId) return [];
      const beJobs = await getJobs({ recruiter_id: recruiterId });
      return (beJobs as BeJobOffer[]).map((j) => ({ ...j })) as unknown as JobOffer[];
    },
    enabled: !!recruiterId,
  });
}