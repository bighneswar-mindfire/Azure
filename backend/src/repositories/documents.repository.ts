import { pool } from "../db/pool";
import type { ConfidenceLabel, DocumentRecord, ProcessingStatus } from "../types/document";

export interface IDocumentsRepository {
  save(record: DocumentRecord): Promise<void>;
  findAll(): Promise<DocumentRecord[]>;
  findById(documentId: string): Promise<DocumentRecord | undefined>;
}

interface DocumentRow {
  document_id: string;
  original_file_name: string;
  blob_name: string;
  blob_url: string;
  document_type: string | null;
  measure_extracted: string | null;
  measure_date: string | null;
  date_processed: Date | null;
  processed_by: string;
  processing_status: ProcessingStatus;
  error_message: string | null;
  uploaded_at: Date;
  confidence_score: number | null;
  confidence_label: ConfidenceLabel | null;
}

function toRecord(row: DocumentRow): DocumentRecord {
  return {
    documentId: row.document_id,
    originalFileName: row.original_file_name,
    blobName: row.blob_name,
    blobUrl: row.blob_url,
    documentType: row.document_type,
    measureExtracted: row.measure_extracted,
    measureDate: row.measure_date,
    dateProcessed: row.date_processed ? row.date_processed.toISOString() : null,
    processedBy: row.processed_by,
    processingStatus: row.processing_status,
    errorMessage: row.error_message,
    uploadedAt: row.uploaded_at.toISOString(),
    confidenceScore: row.confidence_score,
    confidenceLabel: row.confidence_label,
  };
}

class PostgresDocumentsRepository implements IDocumentsRepository {
  async save(record: DocumentRecord): Promise<void> {
    await pool.query(
      `INSERT INTO documents (
         document_id, original_file_name, blob_name, blob_url,
         document_type, measure_extracted, measure_date, date_processed,
         processed_by, processing_status, error_message, uploaded_at,
         confidence_score, confidence_label
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (document_id) DO UPDATE SET
         document_type = EXCLUDED.document_type,
         measure_extracted = EXCLUDED.measure_extracted,
         measure_date = EXCLUDED.measure_date,
         date_processed = EXCLUDED.date_processed,
         processing_status = EXCLUDED.processing_status,
         error_message = EXCLUDED.error_message,
         confidence_score = EXCLUDED.confidence_score,
         confidence_label = EXCLUDED.confidence_label`,
      [
        record.documentId,
        record.originalFileName,
        record.blobName,
        record.blobUrl,
        record.documentType,
        record.measureExtracted,
        record.measureDate,
        record.dateProcessed,
        record.processedBy,
        record.processingStatus,
        record.errorMessage,
        record.uploadedAt,
        record.confidenceScore,
        record.confidenceLabel,
      ],
    );
  }

  async findAll(): Promise<DocumentRecord[]> {
    const result = await pool.query<DocumentRow>(
      "SELECT * FROM documents ORDER BY uploaded_at DESC",
    );
    return result.rows.map(toRecord);
  }

  async findById(documentId: string): Promise<DocumentRecord | undefined> {
    const result = await pool.query<DocumentRow>(
      "SELECT * FROM documents WHERE document_id = $1",
      [documentId],
    );
    return result.rows[0] ? toRecord(result.rows[0]) : undefined;
  }
}

export const documentsRepository: IDocumentsRepository =
  new PostgresDocumentsRepository();
