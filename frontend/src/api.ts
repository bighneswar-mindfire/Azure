import axios from "axios";
import { httpClient } from "./httpClient";
import type { DocumentRecord } from "./types";

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const res = await httpClient.get<DocumentRecord[]>("/documents");
  return res.data;
}

export async function uploadDocument(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("document", file);

  try {
    await httpClient.post("/documents/upload", formData);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.error ?? `Upload failed (${err.response?.status})`);
    }
    throw err;
  }
}
