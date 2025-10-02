import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  createProtocol1,
  getProtocol1ById,
  updateProtocol1,
  listProtocol1ByApplication,
  createProtocol2,
  getProtocol2ById,
  updateProtocol2,
  listProtocol2ByApplication,
  type Protocol1EvaluationDTO,
  type Protocol2EvaluationDTO,
} from "@/integrations/api/evaluations";

export interface Protocol1Evaluation {
  id: string;
  application_id: string;
  score?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Protocol2Evaluation {
  id: string;
  application_id: string;
  exactitude?: number | null;
  details?: unknown;
  created_at?: string;
  updated_at?: string;
}

function mapP1(dto: Protocol1EvaluationDTO): Protocol1Evaluation {
  return {
    id: String(dto.id),
    application_id: String(dto.application_id),
    score: dto.score,
    notes: dto.notes,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

function mapP2(dto: Protocol2EvaluationDTO): Protocol2Evaluation {
  return {
    id: String(dto.id),
    application_id: String(dto.application_id),
    exactitude: dto.exactitude,
    details: dto.details,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

// Protocol 1
export function useProtocol1Evaluations(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['protocol1Evaluations', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const evals = await listProtocol1ByApplication(applicationId);
      return Array.isArray(evals) ? evals.map(mapP1) : [];
    },
    enabled: !!applicationId,
  });
}

export function useProtocol1Evaluation(id: string | undefined) {
  return useQuery({
    queryKey: ['protocol1Evaluation', id],
    queryFn: async () => {
      if (!id) return null;
      const eval_ = await getProtocol1ById(id);
      return eval_ ? mapP1(eval_ as Protocol1EvaluationDTO) : null;
    },
    enabled: !!id,
  });
}

export function useCreateProtocol1Evaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Protocol1EvaluationDTO>) => {
      const created = await createProtocol1(data);
      return created ? mapP1(created as Protocol1EvaluationDTO) : null;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['protocol1Evaluations', data.application_id] });
      }
    },
  });
}

export function useUpdateProtocol1Evaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Protocol1EvaluationDTO> }) => {
      const updated = await updateProtocol1(id, data);
      return updated ? mapP1(updated as Protocol1EvaluationDTO) : null;
    },
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['protocol1Evaluation', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['protocol1Evaluations', data.application_id] });
      }
    },
  });
}

// Protocol 2
export function useProtocol2Evaluations(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['protocol2Evaluations', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const evals = await listProtocol2ByApplication(applicationId);
      return Array.isArray(evals) ? evals.map(mapP2) : [];
    },
    enabled: !!applicationId,
  });
}

export function useProtocol2Evaluation(id: string | undefined) {
  return useQuery({
    queryKey: ['protocol2Evaluation', id],
    queryFn: async () => {
      if (!id) return null;
      const eval_ = await getProtocol2ById(id);
      return eval_ ? mapP2(eval_ as Protocol2EvaluationDTO) : null;
    },
    enabled: !!id,
  });
}

export function useCreateProtocol2Evaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Protocol2EvaluationDTO>) => {
      const created = await createProtocol2(data);
      return created ? mapP2(created as Protocol2EvaluationDTO) : null;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['protocol2Evaluations', data.application_id] });
      }
    },
  });
}

export function useUpdateProtocol2Evaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Protocol2EvaluationDTO> }) => {
      const updated = await updateProtocol2(id, data);
      return updated ? mapP2(updated as Protocol2EvaluationDTO) : null;
    },
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['protocol2Evaluation', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['protocol2Evaluations', data.application_id] });
      }
    },
  });
}

