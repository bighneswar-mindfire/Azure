import type { DocumentRecord } from "../types";

interface DocumentsTableProps {
  documents: DocumentRecord[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
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
                <td>{doc.processingStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
