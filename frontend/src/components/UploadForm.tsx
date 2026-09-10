import { useRef, useState } from "react";
import { uploadDocument } from "../api";

interface UploadFormProps {
  onUploaded: () => void;
}

export function UploadForm({ onUploaded }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setStatus("uploading");
    setErrorMessage(null);

    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("idle");
      onUploaded();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="card">
      <h2>Upload Document</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" className="btn-primary" disabled={!selectedFile || status === "uploading"}>
          {status === "uploading" ? "Submitting…" : "Submit for Processing"}
        </button>
      </form>
      {status === "error" && <p className="error-text" style={{ marginTop: 10 }}>{errorMessage}</p>}
    </div>
  );
}
