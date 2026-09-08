import { randomUUID } from "crypto";
import path from "path";
import { uploadDocumentBlob } from "./blobStorage.service";
import { triggerProcessing } from "./processingFunction.client";
import { documentsRepository } from "../repositories/documents.repository";
import type { DocumentRecord } from "../types/document";

export async function listDocuments(): Promise<DocumentRecord[]> {
  return documentsRepository.findAll();
}

async function triggerProcessingOrMarkFailed(record: DocumentRecord): Promise<DocumentRecord> {
  try {
    return await triggerProcessing(record.documentId);
  } catch (err) {
    const failed: DocumentRecord = {
      ...record,
      dateProcessed: new Date().toISOString(),
      processingStatus: "Failed",
      errorMessage: err instanceof Error ? err.message : "Could not reach the processing function",
    };
    await documentsRepository.save(failed);
    return failed;
  }
}

export async function retryDocument(documentId: string): Promise<DocumentRecord> {
  const record = await documentsRepository.findById(documentId);
  if (!record) {
    throw new Error(`Document ${documentId} not found`);
  }
  return triggerProcessingOrMarkFailed(record);
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
    confidenceScore: null,
    confidenceLabel: null,
  };

  await documentsRepository.save(record);
  return triggerProcessingOrMarkFailed(record);
}
