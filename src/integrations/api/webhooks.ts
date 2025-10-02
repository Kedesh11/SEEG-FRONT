import { api } from "@/integrations/api/client";
import { API_BASE } from "@/integrations/api/routes";

const BASE = `${API_BASE}/webhooks` as const;

/**
 * Webhook: Déclenche l'orchestrateur ETL pour une candidature soumise
 */
export interface ApplicationSubmittedPayload {
  application_id: string;
  candidate_id: string;
  job_offer_id: string;
  submitted_at?: string;
}

export async function triggerApplicationSubmittedWebhook(payload: ApplicationSubmittedPayload) {
  const { data } = await api.post(`${BASE}/application-submitted`, payload);
  return data;
}

