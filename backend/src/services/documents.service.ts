import { randomUUID } from "crypto";
import path from "path";
import { uploadDocumentBlob } from "./blobStorage.service";
import { documentsRepository } from "../repositories/documents.repository";
import type { DocumentRecord } from "../types/document";

export async function listDocuments(): Promise<DocumentRecord[]> {
  return documentsRepository.findAll();
}

export async function uploadDocument(file: Express.Multer.File): Promise<DocumentRecord> {
  const documentId = randomUUID();
  const extension = path.extname(file.originalname);
  const blobName = `${documentId}${extension}`;

  const blob = await uploadDocumentBlob(blobName, file.buffer, file.mimetype);

  const record: DocumentRecord = {
    documentId,
    originalFileName: file.originalname,
    blobName: blob.blobName,
    blobUrl: blob.url,
    documentType: null,
    measureExtracted: null,
    measureDate: null,
    dateProcessed: null,
    processedBy: "user",
    processingStatus: "Uploaded",
    errorMessage: null,
    uploadedAt: new Date().toISOString(),
  };

  await documentsRepository.save(record);
  return record;
}
