/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getApplicationDraft, upsertApplicationDraft, deleteApplicationDraft } from '@/integrations/api/applications';

export interface ApplicationDraftData {
  form_data: Record<string, any>;
  ui_state: {
    currentStep?: number;
    activeTab?: string;
    completedSections?: string[];
    lastActiveField?: string;
  };
}

export interface UseApplicationDraftReturn {
  draftData: ApplicationDraftData | null;
  isDraftLoaded: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  saveDraft: (formData: Record<string, any>, uiState?: Record<string, any>) => Promise<void>;
  loadDraft: () => Promise<ApplicationDraftData | null>;
  clearDraft: () => Promise<void>;
  enableAutoSave: (formData: Record<string, any>, uiState?: Record<string, any>) => void;
  disableAutoSave: () => void;
}

const AUTO_SAVE_INTERVAL = 15000;

export function useApplicationDraft(jobOfferId: string): UseApplicationDraftReturn {
  const { user } = useAuth();
  const [draftData, setDraftData] = useState<ApplicationDraftData | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<string>('');
  const lastUiStateRef = useRef<string>('');

  const storageKey = user?.id && jobOfferId ? `draft_${user.id}_${jobOfferId}` : undefined;

  const loadDraft = useCallback(async (): Promise<ApplicationDraftData | null> => {
    if (!user || !jobOfferId) return null;
    try {
      const apiDraft = await getApplicationDraft(jobOfferId);
      if (apiDraft) {
        const draft: ApplicationDraftData = {
          form_data: (apiDraft.form_data as Record<string, any>) || {},
          ui_state: (apiDraft.ui_state as Record<string, any>) || {},
        };
        setDraftData(draft);
        setIsDraftLoaded(true);
        if (apiDraft.updated_at) setLastSaved(new Date(apiDraft.updated_at));
        return draft;
      }
      if (storageKey) {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as ApplicationDraftData;
          setDraftData(parsed);
          setIsDraftLoaded(true);
          return parsed;
        }
      }
      setDraftData(null);
      setIsDraftLoaded(true);
      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw) as ApplicationDraftData;
            setDraftData(parsed);
            setIsDraftLoaded(true);
            return parsed;
          }
        } catch { /* ignore */ }
      }
      setDraftData(null);
      setIsDraftLoaded(true);
      return null;
    }
  }, [user, jobOfferId, storageKey]);

  useEffect(() => {
    if (user && jobOfferId) {
      loadDraft();
    }
  }, [user, jobOfferId, loadDraft]);

  useEffect(() => {
    return () => { if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current); };
  }, []);

  const saveDraft = useCallback(async (formData: Record<string, any>, uiState: Record<string, any> = {}): Promise<void> => {
    if (!user || !jobOfferId) return;
    const formDataStr = JSON.stringify(formData);
    const uiStateStr = JSON.stringify(uiState);
    if (formDataStr === lastFormDataRef.current && uiStateStr === lastUiStateRef.current) return;

    setIsSaving(true);
    try {
      const ok = await upsertApplicationDraft({ job_offer_id: jobOfferId, form_data: formData, ui_state: uiState });
      if (!ok) throw new Error('API draft save failed');
      const newDraftData: ApplicationDraftData = { form_data: formData, ui_state: uiState };
      setDraftData(newDraftData);
      setLastSaved(new Date());
      lastFormDataRef.current = formDataStr;
      lastUiStateRef.current = uiStateStr;
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(newDraftData));
      console.log('💾 Brouillon sauvegardé via API');
    } catch (error) {
      console.error('Error saving draft:', error);
      try {
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify({ form_data: formData, ui_state: uiState }));
        setLastSaved(new Date());
        console.warn('Draft saved locally as fallback');
      } catch { /* ignore */ }
      toast.error('Erreur lors de la sauvegarde du brouillon');
    } finally {
      setIsSaving(false);
    }
  }, [user, jobOfferId, storageKey]);

  const clearDraft = useCallback(async (): Promise<void> => {
    if (!user || !jobOfferId) return;
    try {
      const ok = await deleteApplicationDraft(jobOfferId);
      if (!ok) throw new Error('API draft delete failed');
      setDraftData(null);
      setLastSaved(null);
      lastFormDataRef.current = '';
      lastUiStateRef.current = '';
      if (storageKey) localStorage.removeItem(storageKey);
      console.log('🗑️ Brouillon supprimé via API');
    } catch (error) {
      console.error('Error clearing draft:', error);
      if (storageKey) localStorage.removeItem(storageKey);
      setDraftData(null);
      setLastSaved(null);
    }
  }, [user, jobOfferId, storageKey]);

  const enableAutoSave = useCallback((formData: Record<string, any>, uiState: Record<string, any> = {}) => {
    if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    autoSaveIntervalRef.current = setInterval(() => { saveDraft(formData, uiState); }, AUTO_SAVE_INTERVAL);
    console.log('⏰ Auto-save activé (toutes les 15 secondes)');
  }, [saveDraft]);

  const disableAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
      console.log('⏰ Auto-save désactivé');
    }
  }, []);

  return {
    draftData,
    isDraftLoaded,
    isSaving,
    lastSaved,
    saveDraft,
    loadDraft,
    clearDraft,
    enableAutoSave,
    disableAutoSave
  };
}
