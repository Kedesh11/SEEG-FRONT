import { useState } from "react";
import { useAuth } from "./useAuth";
import { uploadApplicationDocument, deleteApplicationDocument } from "@/integrations/api/applications";

export interface UploadedFile {
  path: string;
  name: string;
  size: number;
  type: string;
}

export function useFileUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Surcharges
  // 1) uploadFile(applicationId, file)
  // 2) uploadFile(file, bucketOrType) [compat ancien]
  const uploadFile = async (...args: [string, File] | [File, string]): Promise<UploadedFile> => {
    if (!user) throw new Error("User not authenticated");

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (typeof args[0] === 'string') {
        const applicationId = args[0] as string;
        const file = args[1] as File;
        const res = await uploadApplicationDocument(applicationId, file);
        return {
          path: String(res.id),
          name: res.filename,
          size: res.size_bytes ?? file.size,
          type: file.type
        };
      } else {
        // Ancien appel: uploadFile(file, bucket)
        const file = args[0] as File;
        // On ne peut pas téléverser sans application; lever une erreur claire
        throw new Error('Upload: applicationId requis. Appelez uploadFile(applicationId, file).');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleFiles = async (applicationId: string, files: File[]): Promise<UploadedFile[]> => {
    const uploadPromises = files.map(file => uploadFile(applicationId, file));
    return Promise.all(uploadPromises);
  };

  // Surcharges deleteFile
  // 1) deleteFile(applicationId, documentId)
  // 2) deleteFile(pathOnly) [compat ancien] -> noop si URL publique
  const deleteFile = async (...args: [string, string] | [string]): Promise<void> => {
    if (args.length === 2) {
      const [applicationId, documentId] = args as [string, string];
      const ok = await deleteApplicationDocument(applicationId, documentId);
      if (!ok) throw new Error('Suppression du document non confirmée');
      return;
    }
    const path = args[0] as string;
    if (!path) return;
    // Ancien chemin (URL publique ou chemin inconnu): ignorer silencieusement
    return;
  };

  const getFileUrl = (fileUrl: string): string => {
    return fileUrl;
  };

  const downloadFile = async (fileUrl: string): Promise<Blob> => {
    const resp = await fetch(fileUrl);
    if (!resp.ok) throw new Error('Téléchargement échoué');
    return await resp.blob();
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getFileUrl,
    downloadFile,
    isUploading,
    uploadProgress
  };
}