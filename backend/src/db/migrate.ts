import { pool } from "./pool";

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS documents (
    document_id UUID PRIMARY KEY,
    original_file_name TEXT NOT NULL,
    blob_name TEXT NOT NULL,
    blob_url TEXT NOT NULL,
    document_type TEXT,
    measure_extracted TEXT,
    measure_date TEXT,
    date_processed TIMESTAMPTZ,
    processed_by TEXT NOT NULL,
    processing_status TEXT NOT NULL CHECK (processing_status IN ('Uploaded', 'Success', 'Needs Review', 'Failed')),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL
  );
`;

export async function runMigrations(): Promise<void> {
  await pool.query(SCHEMA_SQL);
}
