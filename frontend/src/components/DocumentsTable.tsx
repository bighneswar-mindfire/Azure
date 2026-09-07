import { useState } from "react";
import { retryDocument } from "../api";
import type { DocumentRecord } from "../types";

interface DocumentsTableProps {
  documents: DocumentRecord[];
  onRetried: () => void;
}

export function DocumentsTable({ documents, onRetried }: DocumentsTableProps) {
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function handleRetry(documentId: string) {
    setRetryingId(documentId);
    try {
      await retryDocument(documentId);
      onRetried();
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div>
      <h2>Processed Documents</h2>
      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Document ID</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Measure</th>
              <th>Measure Date</th>
              <th>Date Processed</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.documentId}>
                <td>{doc.documentId.slice(0, 8)}</td>
                <td>{doc.originalFileName}</td>
                <td>{doc.documentType ?? "-"}</td>
                <td>{doc.measureExtracted ?? "-"}</td>
                <td>{doc.measureDate ?? "-"}</td>
                <td>{doc.dateProcessed ?? "-"}</td>
                <td title={doc.errorMessage ?? undefined}>{doc.processingStatus}</td>
                <td>{doc.confidenceLabel ? `${doc.confidenceLabel} (${doc.confidenceScore})` : "-"}</td>
                <td>
                  <button onClick={() => handleRetry(doc.documentId)} disabled={retryingId === doc.documentId}>
                    {retryingId === doc.documentId ? "Retrying..." : "Retry"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
