import { api } from "@/integrations/api/client";
import { API_BASE, withQuery, type QueryParams } from "@/integrations/api/routes";

// Endpoints optimisés pour les performances

const BASE = `${API_BASE}/optimized` as const;

/**
 * Récupérer les candidatures avec toutes les données liées (joins optimisés)
 */
export async function getApplicationsOptimized(params?: QueryParams) {
  const url = withQuery(`${BASE}/applications/optimized`, params);
  const { data } = await api.get(url);
  return data;
}

/**
 * Statistiques dashboard optimisées
 */
export async function getDashboardStatsOptimized() {
  const { data } = await api.get(`${BASE}/dashboard/stats/optimized`);
  return data;
}

/**
 * Candidatures d'un candidat avec données complètes (optimisé)
 */
export async function getCandidateApplicationsOptimized(candidateId: string | number) {
  const { data } = await api.get(`${BASE}/candidates/${encodeURIComponent(String(candidateId))}/applications/optimized`);
  return data;
}

/**
 * Comparaison de performance entre endpoints standards et optimisés
 */
export async function getPerformanceComparison() {
  const { data } = await api.get(`${BASE}/performance/comparison`);
  return data;
}

