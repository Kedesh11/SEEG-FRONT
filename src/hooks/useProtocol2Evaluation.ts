import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { createProtocol2, updateProtocol2, listProtocol2ByApplication, type Protocol2EvaluationDTO } from '@/integrations/api/evaluations';

interface Protocol2EvaluationData {
  status: 'pending' | 'in_progress' | 'completed';
  mise_en_situation: {
    jeu_de_role: {
      score: number;
      comments: string;
    };
    jeu_codir: {
      score: number;
      comments: string;
    };
  };
  validation_operationnelle: {
    fiche_kpis: {
      score: number;
      comments: string;
    };
  };
  analyse_competences: {
    gap_competences: {
      score: number;
      comments: string;
      gapLevel: string;
    };
    plan_formation: {
      score: number;
      comments: string;
    };
  };
}

const defaultEvaluationData: Protocol2EvaluationData = {
  status: 'pending',
  mise_en_situation: {
    jeu_de_role: { score: 0, comments: '' },
    jeu_codir: { score: 0, comments: '' }
  },
  validation_operationnelle: { fiche_kpis: { score: 0, comments: '' } },
  analyse_competences: {
    gap_competences: { score: 0, comments: '', gapLevel: '' },
    plan_formation: { score: 0, comments: '' }
  }
};

export function useProtocol2Evaluation(applicationId: string) {
  const [evaluationData, setEvaluationData] = useState<Protocol2EvaluationData>(defaultEvaluationData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger l'évaluation existante via backend
  const loadEvaluation = useCallback(async () => {
    if (!applicationId) return;

    setIsLoading(true);
    try {
      const list = await listProtocol2ByApplication(applicationId);
      const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
      if (first) {
        setEvaluationData({
          status: 'in_progress',
          mise_en_situation: {
            jeu_de_role: { score: typeof first.exactitude === 'number' ? Math.min(first.exactitude, 5) : 0, comments: '' },
            jeu_codir: { score: 0, comments: '' }
          },
          validation_operationnelle: { fiche_kpis: { score: 0, comments: '' } },
          analyse_competences: {
            gap_competences: { score: 0, comments: '', gapLevel: '' },
            plan_formation: { score: 0, comments: '' }
          }
        });
      } else {
        setEvaluationData(defaultEvaluationData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'évaluation Protocol 2:', error);
      toast({ title: 'Erreur de chargement', description: 'Impossible de charger l\'évaluation Protocol 2', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, toast]);

  // Sauvegarder l'évaluation via backend
  const saveEvaluation = useCallback(async (data: Protocol2EvaluationData) => {
    if (!applicationId || !user) return;

    setIsSaving(true);
    try {
      const overall = Math.min(
        Math.round(
          ((Math.min(data.mise_en_situation.jeu_de_role.score, 5) +
            Math.min(data.mise_en_situation.jeu_codir.score, 5) +
            Math.min(data.validation_operationnelle.fiche_kpis.score, 5) +
            Math.min(data.analyse_competences.gap_competences.score, 5) +
            Math.min(data.analyse_competences.plan_formation.score, 5)) / 5) * 20
        ),
        100
      );

      const payload: Partial<Protocol2EvaluationDTO> = {
        application_id: applicationId,
        exactitude: Math.min(data.mise_en_situation.jeu_de_role.score, 5),
        details: {
          jeu_codir: data.mise_en_situation.jeu_codir,
          fiche_kpis: data.validation_operationnelle.fiche_kpis,
          gap_competences: data.analyse_competences.gap_competences,
          plan_formation: data.analyse_competences.plan_formation,
          overall
        }
      } as unknown as Protocol2EvaluationDTO;

      const list = await listProtocol2ByApplication(applicationId);
      const first = Array.isArray(list) && list.length > 0 ? list[0] : null;
      if (first) {
        await updateProtocol2(first.id, payload);
      } else {
        await createProtocol2(payload);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({ title: 'Erreur de sauvegarde', description: 'Impossible de sauvegarder l\'évaluation Protocol 2', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, user, toast]);

  // Mettre à jour l'évaluation
  const updateEvaluation = useCallback((updater: (prev: Protocol2EvaluationData) => Protocol2EvaluationData) => {
    setEvaluationData(prev => {
      const newData = updater(prev);
      // Normaliser les scores sur 5
      newData.mise_en_situation.jeu_de_role.score = Math.min(newData.mise_en_situation.jeu_de_role.score, 5);
      newData.mise_en_situation.jeu_codir.score = Math.min(newData.mise_en_situation.jeu_codir.score, 5);
      newData.validation_operationnelle.fiche_kpis.score = Math.min(newData.validation_operationnelle.fiche_kpis.score, 5);
      newData.analyse_competences.gap_competences.score = Math.min(newData.analyse_competences.gap_competences.score, 5);
      newData.analyse_competences.plan_formation.score = Math.min(newData.analyse_competences.plan_formation.score, 5);

      // Mettre à jour le statut
      const totalScore = (
        newData.mise_en_situation.jeu_de_role.score +
        newData.mise_en_situation.jeu_codir.score +
        newData.validation_operationnelle.fiche_kpis.score +
        newData.analyse_competences.gap_competences.score +
        newData.analyse_competences.plan_formation.score
      ) / 5;
      if (totalScore > 0) newData.status = 'in_progress';
      if (totalScore >= 3) newData.status = 'completed';

      // Sauvegarde auto simple
      setTimeout(() => { saveEvaluation(newData); }, 1000);
      return newData;
    });
  }, [saveEvaluation]);

  // Calcul des scores des sections
  const calculateSectionScores = useCallback(() => {
    const jeuDeRoleScore = Math.min(evaluationData.mise_en_situation.jeu_de_role.score, 5);
    const jeuCodirScore = Math.min(evaluationData.mise_en_situation.jeu_codir.score, 5);
    const ficheKpisScore = Math.min(evaluationData.validation_operationnelle.fiche_kpis.score, 5);
    const gapCompetencesScore = Math.min(evaluationData.analyse_competences.gap_competences.score, 5);
    const planFormationScore = Math.min(evaluationData.analyse_competences.plan_formation.score, 5);

    const globalScore = Math.min(
      Math.round(
        ((jeuDeRoleScore + jeuCodirScore + ficheKpisScore + gapCompetencesScore + planFormationScore) / 5) * 20
      ),
      100
    );

    const miseEnSituationScore = Math.min(Math.round(((jeuDeRoleScore + jeuCodirScore) / 2) * 20), 100);
    const validationScore = Math.min(Math.round(ficheKpisScore * 20), 100);
    const analyseScore = Math.min(Math.round(((gapCompetencesScore + planFormationScore) / 2) * 20), 100);

    return { miseEnSituationScore, validationScore, analyseScore, globalScore };
  }, [evaluationData]);

  // Charger l'évaluation au montage du composant
  useEffect(() => { loadEvaluation(); }, [loadEvaluation]);

  return { evaluationData, updateEvaluation, calculateSectionScores, isLoading, isSaving };
}