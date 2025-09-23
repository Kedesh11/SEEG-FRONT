/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createProtocol1, updateProtocol1, listProtocol1ByApplication, type Protocol1EvaluationDTO } from '@/integrations/api/evaluations';

export interface EvaluationData {
  globalScore: number;
  status: string;
  protocol1: {
    score: number;
    status: 'pending' | 'in_progress' | 'completed';
    // Partie 1: Validation des Prérequis
    documentaryEvaluation: {
      cv: {
        score: number;
        comments: string;
      };
      lettreMotivation: {
        score: number;
        comments: string;
      };
      diplomesEtCertificats: {
        score: number;
        comments: string;
      };
    };
    // Evaluation MTP - Taux d'adhérence MTP
    mtpAdherence: {
      metier: {
        score: number;
        comments: string;
      };
      talent: {
        score: number;
        comments: string;
      };
      paradigme: {
        score: number;
        comments: string;
      };
    };
    // Partie 2: Entretien
    interview: {
      interviewDate?: Date;
      physicalMtpAdherence: {
        metier: {
          score: number;
          comments: string;
        };
        talent: {
          score: number;
          comments: string;
        };
        paradigme: {
          score: number;
          comments: string;
        };
      };
      gapCompetence: {
        score: number;
        comments: string;
      };
      generalSummary: string;
    };
  };
}

const defaultEvaluationData: EvaluationData = {
  globalScore: 0,
  status: "Évaluation - Protocole 1 en cours",
  protocol1: {
    score: 0,
    status: 'pending',
    documentaryEvaluation: {
      cv: { score: 0, comments: "" },
      lettreMotivation: { score: 0, comments: "" },
      diplomesEtCertificats: { score: 0, comments: "" },
    },
    mtpAdherence: {
      metier: { score: 0, comments: "" },
      talent: { score: 0, comments: "" },
      paradigme: { score: 0, comments: "" },
    },
    interview: {
      physicalMtpAdherence: {
        metier: { score: 0, comments: "" },
        talent: { score: 0, comments: "" },
        paradigme: { score: 0, comments: "" },
      },
      gapCompetence: { score: 0, comments: "" },
      generalSummary: ""
    },
  },
};

export function useProtocol1Evaluation(applicationId: string) {
  const [evaluationData, setEvaluationData] = useState<EvaluationData>(defaultEvaluationData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const existingIdRef = useRef<string | number | null>(null);

  // Fonction pour calculer les scores partiels de chaque section
  const calculateSectionScores = useCallback((protocol1: any) => {
    // Validation des Prérequis - Moyenne des 3 évaluations documentaires (convertie en %)
    const documentaryScores = [
      protocol1.documentaryEvaluation.cv.score,
      protocol1.documentaryEvaluation.lettreMotivation.score,
      protocol1.documentaryEvaluation.diplomesEtCertificats.score
    ];
    const documentaryAverage = documentaryScores.length > 0 ? documentaryScores.reduce((a, b) => a + b, 0) / documentaryScores.length : 0;
    const documentaryScore = (documentaryAverage / 5) * 100;
    
    // Evaluation MTP - Taux d'adhérence MTP (convertie en %)
    const mtpScores = [
      protocol1.mtpAdherence.metier.score,
      protocol1.mtpAdherence.talent.score,
      protocol1.mtpAdherence.paradigme.score
    ];
    const mtpAverage = mtpScores.length > 0 ? mtpScores.reduce((a, b) => a + b, 0) / mtpScores.length : 0;
    const mtpScore = (mtpAverage / 5) * 100;
    
    // Entretien - Moyenne des évaluations physiques MTP + Gap de compétence (convertie en %)
    const interviewScores = [
      protocol1.interview.physicalMtpAdherence.metier.score,
      protocol1.interview.physicalMtpAdherence.talent.score,
      protocol1.interview.physicalMtpAdherence.paradigme.score,
      protocol1.interview.gapCompetence.score
    ];
    const interviewAverage = interviewScores.length > 0 ? interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length : 0;
    const interviewScore = (interviewAverage / 5) * 100;

    // Score global = moyenne pondérée des 3 sections
    const totalScore = (documentaryScore + mtpScore + interviewScore) / 3;

    return {
      documentaryScore,
      mtpScore, 
      interviewScore,
      totalScore
    };
  }, []);

  // Charger les données existantes (via backend)
  const loadEvaluation = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    try {
      const list = await listProtocol1ByApplication(applicationId);
      const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
      if (first) {
        existingIdRef.current = first.id;
        const global = typeof first.score === 'number' ? first.score : 0;
        const notes = (first as unknown as { notes?: string }).notes || '';
        setEvaluationData(prev => ({
          ...prev,
          globalScore: global,
          protocol1: {
            ...prev.protocol1,
            score: global,
            status: global >= 60 ? 'completed' : global > 0 ? 'in_progress' : 'pending',
            interview: { ...prev.protocol1.interview, generalSummary: notes },
          },
          status: global >= 60 ? 'Évaluation terminée' : 'Évaluation - Protocole 1 en cours',
        }));
      } else {
        existingIdRef.current = null;
        setEvaluationData(defaultEvaluationData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'évaluation:', error);
      toast({ title: 'Erreur de chargement', description: 'Impossible de charger les données d\'évaluation.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, toast]);

  // Sauvegarder les données (via backend)
  const saveEvaluation = useCallback(async (data: EvaluationData) => {
    if (!applicationId || !user) return;
    setIsSaving(true);
    try {
      const sectionScores = calculateSectionScores(data.protocol1);
      const payload: Partial<Protocol1EvaluationDTO> = {
        application_id: applicationId,
        score: Math.round(sectionScores.totalScore),
        notes: data.protocol1.interview.generalSummary,
      } as unknown as Protocol1EvaluationDTO;

      if (existingIdRef.current) {
        await updateProtocol1(existingIdRef.current, payload);
      } else {
        const created = await createProtocol1(payload);
        existingIdRef.current = created?.id ?? null;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({ title: 'Erreur de sauvegarde', description: 'Impossible de sauvegarder les données d\'évaluation.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, user, calculateSectionScores, toast]);

  // Debounce timer pour les sauvegardes automatiques
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mettre à jour les données avec sauvegarde automatique optimisée
  const updateEvaluation = useCallback((updater: (prev: EvaluationData) => EvaluationData) => {
    setEvaluationData(prev => {
      const newData = updater(prev);
      const sectionScores = calculateSectionScores(newData.protocol1);
      newData.protocol1.score = Math.round(sectionScores.totalScore);
      newData.globalScore = sectionScores.totalScore;
      if (sectionScores.documentaryScore > 0 && sectionScores.mtpScore > 0) newData.protocol1.status = 'in_progress';
      if (newData.protocol1.score >= 60) newData.protocol1.status = 'completed';
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveEvaluation(newData);
        saveTimeoutRef.current = null;
      }, 5000);
      return newData;
    });
  }, [calculateSectionScores, saveEvaluation]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  return {
    evaluationData,
    updateEvaluation,
    calculateSectionScores: () => calculateSectionScores(evaluationData.protocol1),
    isLoading,
    isSaving,
    reload: loadEvaluation
  };
}
