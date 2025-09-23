/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useState, useEffect, useCallback } from "react"; // Keep for useRecruiterApplications
import {
  getApplications,
  getApplicationById,
  createApplication as beCreateApplication,
  updateApplication as beUpdateApplication,
  type Application as BeApplication,
} from "@/integrations/api/applications";

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
}

export interface Skill {
  id: string;
  name: string;
}

export interface CandidateProfile {
  id: string;
  gender: string;
  date_of_birth: string;
  current_position: string;
  years_experience: number | string;
  address: string;
  linkedin_profile: string;
  portfolio_url: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
}

export interface Application {
  id: string;
  candidate_id?: string;
  job_offer_id?: string;
  cover_letter?: string | null;
  status: 'candidature' | 'incubation' | 'embauche' | 'refuse' | 'entretien_programme' | string;
  motivation?: string | null;
  availability_start?: string | null;
  reference_contacts?: string | null;
  mtp_answers?: {
    metier?: string[];
    talent?: string[];
    paradigme?: string[];
    [key: string]: any;
  } | null;
  created_at?: string;
  updated_at?: string;
  job_offers?: {
    date_limite: string;
    title: string;
    location: string;
    contract_type: string;
    recruiter_id?: string;
  } | null;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    candidate_profiles?: CandidateProfile;
  } | null;
}

function mapBeToUi(app: BeApplication): Application {
  return {
    id: app.id,
    job_offer_id: (app as any).job_offer_id ?? (app as any).jobOfferId,
    candidate_id: (app as any).candidate_id ?? (app as any).candidateId,
    status: (app as any).status,
    created_at: (app as any).created_at ?? (app as any).createdAt,
    updated_at: (app as any).updated_at ?? (app as any).updatedAt,
    reference_contacts: (app as any).reference_contacts ?? (app as any).referenceContacts ?? null,
    availability_start: (app as any).availability_start ?? (app as any).availabilityStart ?? null,
    mtp_answers: ((app as any).mtp_answers ?? (app as any).mtpAnswers ?? null) as any,
  };
}

// Hook pour vérifier si un candidat a déjà postulé pour un poste
export function useApplicationStatus(jobOfferId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['applicationStatus', user?.id, jobOfferId],
    queryFn: async () => {
      if (!user || !jobOfferId) return null;
      const list = await getApplications({ candidate_id: user.id, job_offer_id: jobOfferId, limit: 1 });
      const found = (list || [])[0];
      if (!found) return null;
      return { id: found.id, status: found.status } as { id: string; status?: string };
    },
    enabled: !!user && !!jobOfferId,
  });
}

export function useApplications() {
  const { user, isRecruiter, isAdmin } = useAuth();
  const isObserver = (useAuth() as any)?.isObserver as boolean | undefined;
  const queryClient = useQueryClient();

  const fetchApplications = async () => {
    if (!user) return [] as Application[];

    // Candidat: seulement ses propres candidatures
    if (!isRecruiter && !isAdmin && !isObserver) {
      const beApps = await getApplications({ candidate_id: user.id });
      return beApps.map(mapBeToUi);
    }

    // Recruteur/Admin/Observateur: liste globale (éventuellement paginée plus tard)
    const beApps = await getApplications();
    return beApps.map(mapBeToUi);
  };

  const query = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: fetchApplications,
    enabled: !!user, // Only run the query if the user is authenticated
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (applicationData: {
      job_offer_id: string;
      ref_contacts?: string;
      mtp_answers: {
        metier: string[];
        talent: string[];
        paradigme: string[];
        [key: string]: any;
      };
    }) => {
      if (!user) throw new Error("User not authenticated");

      const payload = {
        candidate_id: user.id,
        job_offer_id: applicationData.job_offer_id,
        reference_contacts: applicationData.ref_contacts ?? null,
        mtp_answers: applicationData.mtp_answers ?? null,
      };

      const created = await beCreateApplication(payload);
      return mapBeToUi(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] });
    },
  });

  return {
    applications: (query.data ?? []) as Application[],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    submitApplication: submitApplicationMutation.mutateAsync,
    refetch: query.refetch,
  };
}

export function useApplication(id: string | undefined) {
  const { user, isRecruiter, isAdmin } = useAuth();
  const isObserver = (useAuth() as any)?.isObserver as boolean | undefined;

  return useQuery({
    queryKey: ['application', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;

      // Fetch unique application from backend
      const be = await getApplicationById(id);
      if (!be) return null;
      const ui = mapBeToUi(be);

      // Si candidat et non propriétaire, masquer
      if (!isRecruiter && !isAdmin && !isObserver) {
        if (ui.candidate_id !== user.id) return null;
      }

      return ui as Application;
    },
    enabled: !!id && !!user,
    retry: 1,
  });
}

export function useCandidateExperiences(profileId: string | undefined) {
  return useQuery({
    queryKey: ['experiences', profileId],
    queryFn: async () => {
      // Migration backend à venir
      return [] as Experience[];
    },
    enabled: !!profileId,
  });
}

export function useCandidateEducations(profileId: string | undefined) {
  return useQuery({
    queryKey: ['educations', profileId],
    queryFn: async () => {
      // Migration backend à venir
      return [] as Education[];
    },
    enabled: !!profileId,
  });
}

export function useCandidateSkills(profileId: string | undefined) {
  return useQuery({
    queryKey: ['skills', profileId],
    queryFn: async () => {
      // Migration backend à venir
      return [] as Skill[];
    },
    enabled: !!profileId,
  });
}

export function useRecruiterApplications(jobOfferId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['recruiterApplications', user?.id, jobOfferId];

  const fetchRecruiterApplications = async () => {
    if (!user) return [] as Application[];
    const be = await getApplications(jobOfferId ? { job_offer_id: jobOfferId } : undefined);
    return be.map(mapBeToUi) as Application[];
  };

  const query = useQuery({
    queryKey,
    queryFn: fetchRecruiterApplications,
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: Application['status'] }) => {
      const updated = await beUpdateApplication(applicationId, { status: String(status) });
      return mapBeToUi(updated);
    },
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ 
        queryKey: ['application', applicationId],
        exact: false 
      });
    },
  });

  return {
    applications: (query.data ?? []) as Application[],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    updateApplicationStatus: updateStatusMutation.mutateAsync,
    refetch: query.refetch,
  };
}