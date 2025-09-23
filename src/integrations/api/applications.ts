import { api } from "@/integrations/api/client";
import { ROUTES, withQuery, type QueryParams } from "@/integrations/api/routes";

export interface ApplicationDTO {
  id: string | number;
  job_offer_id?: string | number;
  candidate_id?: string | number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  reference_contacts?: string | null;
  availability_start?: string | null;
  mtp_answers?: Record<string, unknown> | null;
}

export interface ApplicationCreatePayload {
  candidate_id: string; // UUID string
  job_offer_id: string; // UUID string
  reference_contacts?: string | null;
  availability_start?: string | null;
  mtp_answers?: Record<string, unknown> | null;
}

export interface ApplicationUpdatePayload {
  status?: string;
  reference_contacts?: string | null;
  availability_start?: string | null;
  mtp_answers?: Record<string, unknown> | null;
}

export interface Application {
  id: string;
  jobOfferId?: string;
  candidateId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  referenceContacts?: string | null;
  availabilityStart?: string | null;
  mtpAnswers?: Record<string, unknown> | null;
}

function mapApplication(dto: ApplicationDTO): Application {
  return {
    id: String(dto.id),
    jobOfferId: dto.job_offer_id !== undefined ? String(dto.job_offer_id) : undefined,
    candidateId: dto.candidate_id !== undefined ? String(dto.candidate_id) : undefined,
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    referenceContacts: dto.reference_contacts ?? null,
    availabilityStart: dto.availability_start ?? null,
    mtpAnswers: (dto.mtp_answers ?? null) as Record<string, unknown> | null,
  };
}

// Backend responses
interface ApplicationResponse<T = ApplicationDTO> {
  success: boolean;
  message?: string;
  data: T | null;
}

interface ApplicationListResponse<T = ApplicationDTO> {
  success: boolean;
  message?: string;
  data: T[];
  total?: number;
  page?: number;
  per_page?: number;
}

export async function getApplications(params?: QueryParams): Promise<Application[]> {
  const url = withQuery(ROUTES.APPLICATIONS.BASE, params);
  const res = await api.get<ApplicationListResponse>(url);
  const list: ApplicationDTO[] = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(mapApplication);
}

export async function getApplicationById(id: string | number): Promise<Application | null> {
  const res = await api.get<ApplicationResponse>(ROUTES.APPLICATIONS.DETAIL(id));
  const dto = res.data?.data as ApplicationDTO | null | undefined;
  if (!dto) return null;
  return mapApplication(dto);
}

export async function createApplication(payload: ApplicationCreatePayload): Promise<Application> {
  const res = await api.post<ApplicationResponse>(ROUTES.APPLICATIONS.BASE, payload);
  const dto = res.data?.data as ApplicationDTO;
  return mapApplication(dto);
}

export async function updateApplication(id: string | number, payload: ApplicationUpdatePayload): Promise<Application> {
  const res = await api.put<ApplicationResponse>(ROUTES.APPLICATIONS.DETAIL(id), payload);
  const dto = res.data?.data as ApplicationDTO;
  return mapApplication(dto);
}

// Documents API
export interface ApplicationDocumentDTO {
  id: string | number;
  application_id: string | number;
  filename: string;
  content_type?: string | null;
  size_bytes?: number | null;
  url?: string | null;
  created_at?: string;
}

export async function listApplicationDocuments(applicationId: string | number): Promise<ApplicationDocumentDTO[]> {
  const { data } = await api.get<{ data?: ApplicationDocumentDTO[] }>(`${ROUTES.APPLICATIONS.DETAIL(applicationId)}/documents`);
  return (data?.data ?? []) as ApplicationDocumentDTO[];
}

export async function uploadApplicationDocument(applicationId: string | number, file: File): Promise<ApplicationDocumentDTO> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<{ data?: ApplicationDocumentDTO }>(`${ROUTES.APPLICATIONS.DETAIL(applicationId)}/documents`, form, { headers: { /* form boundary auto */ } });
  return (data?.data as ApplicationDocumentDTO) as ApplicationDocumentDTO;
}

export async function deleteApplicationDocument(applicationId: string | number, documentId: string | number): Promise<boolean> {
  const { status } = await api.delete(`${ROUTES.APPLICATIONS.DETAIL(applicationId)}/documents/${encodeURIComponent(String(documentId))}`);
  return status === 204;
}

export async function getApplicationDocumentBlob(applicationId: string | number, documentId: string | number): Promise<Blob> {
  const url = `${ROUTES.APPLICATIONS.DETAIL(applicationId)}/documents/${encodeURIComponent(String(documentId))}/download`;
  const { data } = await api.get<Blob>(url, { responseType: 'blob' });
  return data as Blob;
}

export async function downloadApplicationDocument(applicationId: string | number, documentId: string | number, fileName?: string): Promise<void> {
  const blob = await getApplicationDocumentBlob(applicationId, documentId);
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdfBlob);
  const name = (fileName && fileName.toLowerCase().endsWith('.pdf')) ? fileName : `${fileName ?? 'document'}.pdf`;
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ApplicationDraftDTO {
  job_offer_id: string;
  form_data: Record<string, unknown>;
  ui_state?: Record<string, unknown>;
  updated_at?: string;
}

export async function getApplicationDraft(jobOfferId: string): Promise<ApplicationDraftDTO | null> {
  try {
    const url = `${ROUTES.APPLICATIONS.BASE}/drafts?job_offer_id=${encodeURIComponent(jobOfferId)}`;
    const { data } = await api.get<{ data?: ApplicationDraftDTO | null }>(url);
    return (data?.data ?? null) as ApplicationDraftDTO | null;
  } catch {
    return null;
  }
}

export async function upsertApplicationDraft(payload: ApplicationDraftDTO): Promise<boolean> {
  try {
    const url = `${ROUTES.APPLICATIONS.BASE}/drafts`;
    await api.post(url, payload);
    return true;
  } catch {
    return false;
  }
}

export async function deleteApplicationDraft(jobOfferId: string): Promise<boolean> {
  try {
    const url = `${ROUTES.APPLICATIONS.BASE}/drafts?job_offer_id=${encodeURIComponent(jobOfferId)}`;
    const { status } = await api.delete(url);
    return status === 204 || status === 200;
  } catch {
    return false;
  }
} 