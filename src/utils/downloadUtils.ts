import * as JSZip from 'jszip';
import { getApplicationDocumentBlob } from "@/integrations/api/applications";

export interface Document {
  id: number | string;
  application_id: string;
  file_name: string;
  file_url: string;
  document_type?: string;
  file_size?: number;
}

/**
 * Télécharge tous les documents d'un candidat en format ZIP, via l'API backend (flux binaire)
 */
export async function downloadCandidateDocumentsAsZip(
  documents: Document[],
  candidateName: string
): Promise<void> {
  if (!documents || documents.length === 0) {
    throw new Error('Aucun document à télécharger');
  }

  const zip = new JSZip();
  const downloadPromises: Promise<void>[] = [];

  for (const doc of documents) {
    const promise = (async () => {
      try {
        const blob = await getApplicationDocumentBlob(doc.application_id, doc.id);
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const safeFileName = doc.file_name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const withPdf = safeFileName.toLowerCase().endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`;
        const documentTypePrefix = doc.document_type ? `${doc.document_type}_` : '';
        const fileName = `${documentTypePrefix}${withPdf}`;
        zip.file(fileName, pdfBlob);
      } catch (error) {
        console.error(`Erreur lors du téléchargement de ${doc.file_name}:`, error);
      }
    })();
    downloadPromises.push(promise);
  }

  await Promise.all(downloadPromises);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const safeCandidateName = candidateName.replace(/[^a-zA-Z0-9.\- _]/g, '_');
  const zipFileName = `Dossier_de_candidature_${safeCandidateName}.zip`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Taille inconnue';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
