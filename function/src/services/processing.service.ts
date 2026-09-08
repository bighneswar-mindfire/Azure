import { downloadDocumentBlob } from "./blobStorage.service";
import { extractTextFromDocument } from "./documentIntelligence.service";
import { extractRawMeasures } from "./extraction.service";
import { applyBusinessRules } from "./businessRules.service";
import { computeConfidenceScore } from "./confidenceScoring.service";
import { documentsRepository } from "../repositories/documents.repository";
import type { DocumentRecord } from "../types/document";

export async function processDocument(
  documentId: string,
): Promise<DocumentRecord> {
  const existing = await documentsRepository.findById(documentId);
  if (!existing) {
    throw new Error(`Document ${documentId} not found`);
  }

  try {
    const { buffer, contentType } = await downloadDocumentBlob(
      existing.blobName,
    );
    const text = await extractTextFromDocument(buffer, contentType);
    const raw = await extractRawMeasures(text);
    const ruleResult = applyBusinessRules(raw);
    const confidence = computeConfidenceScore(raw, ruleResult);

    const processed: DocumentRecord = {
      ...existing,
      documentType: ruleResult.documentType,
      measureExtracted: ruleResult.measure,
      measureDate: ruleResult.measureDate,
      dateProcessed: new Date().toISOString(),
      processingStatus: ruleResult.needsReview ? "Needs Review" : "Success",
      errorMessage: ruleResult.needsReview ? ruleResult.reviewReason : null,
      confidenceScore: confidence.score,
      confidenceLabel: confidence.label,
    };

    await documentsRepository.save(processed);
    return processed;
  } catch (err) {
    const failed: DocumentRecord = {
      ...existing,
      dateProcessed: new Date().toISOString(),
      processingStatus: "Failed",
      errorMessage:
        err instanceof Error ? err.message : "Unknown processing error",
    };

    await documentsRepository.save(failed);
    return failed;
  }
}
