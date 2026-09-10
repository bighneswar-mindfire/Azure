import { useCallback, useEffect, useState } from "react";
import { fetchDocuments } from "./api";
import { UploadForm } from "./components/UploadForm";
import { DocumentsTable } from "./components/DocumentsTable";
import type { DocumentRecord } from "./types";
import "./App.css";

function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load documents",
      );
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    const intervalId = setInterval(loadDocuments, 5000);
    return () => clearInterval(intervalId);
  }, [loadDocuments]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="dot" />
        <h1>ClinicWorks Document Processing</h1>
      </header>

      <UploadForm onUploaded={loadDocuments} />
      {loadError && (
        <p className="error-text" style={{ marginBottom: 16 }}>
          {loadError}
        </p>
      )}
      <DocumentsTable documents={documents} onRetried={loadDocuments} />
    </div>
  );
}

export default App;
