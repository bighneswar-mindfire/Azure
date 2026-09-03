import { Request, Response } from "express";
import * as documentsService from "../services/documents.service";

export async function listDocuments(_req: Request, res: Response): Promise<void> {
  const documents = await documentsService.listDocuments();
  res.json(documents);
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No file was provided. Attach a file under field name 'document'." });
    return;
  }

  try {
    const record = await documentsService.uploadDocument(req.file);
    res.status(201).json({
      documentId: record.documentId,
      fileName: record.originalFileName,
      blobUrl: record.blobUrl,
      status: record.processingStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error uploading document";
    res.status(500).json({ error: message });
  }
}
