import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listApplicationDocuments, type ApplicationDocumentDTO } from "@/integrations/api/applications";

export interface Document {
  id: number | string;
  application_id: string;
  document_type?: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_at: string;
}

export function useApplicationDocuments(applicationId: string | undefined) {
  return useQuery<Document[], Error>({
    queryKey: ['documents', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const docs = await listApplicationDocuments(applicationId);
      return (docs || []).map((d: ApplicationDocumentDTO) => ({
        id: String(d.id),
        application_id: String(d.application_id),
        document_type: undefined,
        file_name: d.filename,
        file_url: d.url || '',
        file_size: d.size_bytes ?? null,
        uploaded_at: d.created_at || ''
      }));
    },
    enabled: !!applicationId,
  });
}

// Tous les documents d'un candidat (via ses candidatures)
export function useCandidateDocuments() {
  const { user } = useAuth();
  return useQuery<Document[], Error>({
    queryKey: ['candidate-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // À implémenter côté backend si nécessaire: endpoint pour documents du candidat
      return [];
    },
    enabled: !!user,
  });
}

export function getDocumentTypeLabel(type: string): string {
  switch (type) {
    case 'cv': return 'CV';
    case 'cover_letter': return 'Lettre de motivation';
    case 'diploma': return 'Diplôme';
    case 'certificate': return 'Certificat supplémentaire';
    case 'recommendation': return 'Lettre de recommandation';
    case 'integrity_letter': return 'Lettre d\'intégrité professionnelle';
    case 'project_idea': return 'Idée de projet';
    default: return type;
  }
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Taille inconnue';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
