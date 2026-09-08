import type { DocumentRecord } from "../types/document";

const functionBaseUrl = process.env.PROCESSING_FUNCTION_URL ?? "http://localhost:7071/api";
const functionKey = process.env.PROCESSING_FUNCTION_KEY;

// Calls the Azure Function that owns all clinical processing logic (OCR,
// classification/extraction, business rules, confidence scoring). This is a
// stand-in for the eventual Logic App trigger - once that exists, it takes
// over calling the Function and this client goes away.
export async function triggerProcessing(documentId: string): Promise<DocumentRecord> {
  const url = new URL(`${functionBaseUrl}/processDocument/${documentId}`);
  if (functionKey) {
    url.searchParams.set("code", functionKey);
  }

  const response = await fetch(url, { method: "POST" });
  const body = (await response.json()) as DocumentRecord | { error: string };

  if (!response.ok) {
    const message = "error" in body ? body.error : `Processing function returned ${response.status}`;
    throw new Error(message);
  }

  return body as DocumentRecord;
}
