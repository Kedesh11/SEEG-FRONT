import { api } from "@/integrations/api/client";
import { ROUTES } from "@/integrations/api/routes";

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  html_body?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

export async function sendEmail(payload: SendEmailRequest): Promise<EmailResponse> {
  const { data } = await api.post<EmailResponse>(`${ROUTES.EMAILS.BASE}/send`, payload);
  return data;
}

export interface SendInterviewEmailRequest {
  to: string;
  candidate_full_name: string;
  job_title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location?: string;
  application_id?: string | number;
  additional_notes?: string;
}

export async function sendInterviewEmail(payload: SendInterviewEmailRequest): Promise<EmailResponse> {
  const { data } = await api.post<EmailResponse>(`${ROUTES.EMAILS.BASE}/send-interview-email`, payload);
  return data;
} 