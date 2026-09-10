import { useState } from "react";
import { retryDocument } from "../api";
import { confidenceBadgeClass, formatDate, formatDateOnly, statusBadgeClass } from "../formatting";
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
    <div className="card">
      <h2>Processed Documents</h2>
      {documents.length === 0 ? (
        <p className="empty-state">No documents uploaded yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
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
                  <td className="mono">{doc.documentId.slice(0, 8)}</td>
                  <td className="filename-cell" title={doc.originalFileName}>
                    {doc.originalFileName}
                  </td>
                  <td>{doc.documentType ?? "—"}</td>
                  <td>{doc.measureExtracted ?? "—"}</td>
                  <td>{formatDateOnly(doc.measureDate)}</td>
                  <td>{formatDate(doc.dateProcessed)}</td>
                  <td title={doc.errorMessage ?? undefined}>
                    <span className={statusBadgeClass(doc.processingStatus)}>{doc.processingStatus}</span>
                  </td>
                  <td>
                    {doc.confidenceLabel ? (
                      <span className={confidenceBadgeClass(doc.confidenceLabel)}>
                        {doc.confidenceLabel} ({doc.confidenceScore})
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleRetry(doc.documentId)}
                      disabled={retryingId === doc.documentId}
                    >
                      {retryingId === doc.documentId ? "Retrying…" : "Retry"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
