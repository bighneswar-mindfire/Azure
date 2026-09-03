export type ProcessingStatus = "Uploaded" | "Success" | "Needs Review" | "Failed";

export interface DocumentRecord {
  documentId: string;
  originalFileName: string;
  blobName: string;
  blobUrl: string;
  documentType: string | null;
  measureExtracted: string | null;
  measureDate: string | null;
  dateProcessed: string | null;
  processedBy: string;
  processingStatus: ProcessingStatus;
  errorMessage: string | null;
  uploadedAt: string;
}
