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
      setLoadError(err instanceof Error ? err.message : "Failed to load documents");
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <h1>ClinicWorks Document Processing</h1>
      <UploadForm onUploaded={loadDocuments} />
      <hr />
      {loadError && <p style={{ color: "red" }}>{loadError}</p>}
      <DocumentsTable documents={documents} />
    </div>
  );
}

export default App;
