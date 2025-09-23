import { api } from "@/integrations/api/client";
import { ROUTES, withQuery, type QueryParams } from "@/integrations/api/routes";

export interface JobDTO {
  id: string | number;
  title?: string;
  description?: string;
  location?: string; // backend: string
  contract_type?: string;
  requirements?: string[] | null; // backend: JSON array of strings
  benefits?: string[] | null; // backend: JSON array of strings
  responsibilities?: string[] | null; // backend: JSON array of strings
  status?: string;
  created_at?: string;
  updated_at?: string;
  recruiter_id?: string | number;
  department?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  categorie_metier?: string | null;
  application_deadline?: string | null;
  date_limite?: string | null;
  reporting_line?: string | null;
  job_grade?: string | null;
  salary_note?: string | null;
  start_date?: string | null;
  profile?: string | null;
  candidate_count?: number;
  new_candidates?: number;
}

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  location: string; // backend: string
  contract_type: string;
  requirements?: string[] | null;
  benefits?: string[] | null;
  responsibilities?: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
  recruiter_id: string;
  department?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  categorie_metier?: string | null;
  application_deadline?: string | null;
  date_limite?: string | null;
  reporting_line?: string | null;
  job_grade?: string | null;
  salary_note?: string | null;
  start_date?: string | null;
  profile?: string | null;
  candidate_count: number;
  new_candidates: number;
}

function mapJob(dto: JobDTO): JobOffer {
  return {
    id: String(dto.id),
    title: String(dto.title ?? ""),
    description: String(dto.description ?? ""),
    location: String(dto.location ?? ""),
    contract_type: String(dto.contract_type ?? ""),
    requirements: (dto.requirements ?? null) as string[] | null,
    benefits: (dto.benefits ?? null) as string[] | null,
    responsibilities: (dto.responsibilities ?? null) as string[] | null,
    status: String(dto.status ?? "active"),
    created_at: String(dto.created_at ?? new Date().toISOString()),
    updated_at: String(dto.updated_at ?? new Date().toISOString()),
    recruiter_id: String(dto.recruiter_id ?? ""),
    department: dto.department ?? null,
    salary_min: dto.salary_min ?? null,
    salary_max: dto.salary_max ?? null,
    categorie_metier: dto.categorie_metier ?? null,
    application_deadline: dto.application_deadline ?? null,
    date_limite: dto.date_limite ?? null,
    reporting_line: dto.reporting_line ?? null,
    job_grade: dto.job_grade ?? null,
    salary_note: dto.salary_note ?? null,
    start_date: dto.start_date ?? null,
    profile: dto.profile ?? null,
    candidate_count: Number(dto.candidate_count ?? 0),
    new_candidates: Number(dto.new_candidates ?? 0),
  };
}

type JobsListResponse = JobDTO[] | { items?: JobDTO[] } | null | undefined;

export async function getJobs(params?: QueryParams): Promise<JobOffer[]> {
  const url = withQuery(ROUTES.JOBS.BASE, params);
  const { data } = await api.get<JobsListResponse>(url);
  const raw: JobsListResponse = data;
  const list: JobDTO[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && 'items' in raw
      ? (raw.items ?? []) as JobDTO[]
      : [];
  return list.map(mapJob);
}

export async function getJobById(id: string | number): Promise<JobOffer | null> {
  const { data } = await api.get<JobDTO | null>(ROUTES.JOBS.DETAIL(id));
  if (!data) return null;
  return mapJob(data as JobDTO);
} 