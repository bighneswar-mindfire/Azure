import DocumentIntelligence, {
  getLongRunningPoller,
  isUnexpected,
  type AnalyzeResultOutput,
} from "@azure-rest/ai-document-intelligence";

const endpoint = process.env.AZURE_DOC_INTEL_ENDPOINT;
const key = process.env.AZURE_DOC_INTEL_KEY;

if (!endpoint || !key) {
  throw new Error(
    "AZURE_DOC_INTEL_ENDPOINT / AZURE_DOC_INTEL_KEY are not set. Copy .env.example to .env and configure them.",
  );
}

const client = DocumentIntelligence(endpoint, { key });

type SupportedContentType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/tiff";

const SUPPORTED_CONTENT_TYPES = new Set<SupportedContentType>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
]);

function isSupportedContentType(
  contentType: string,
): contentType is SupportedContentType {
  return SUPPORTED_CONTENT_TYPES.has(contentType as SupportedContentType);
}

export async function extractTextFromDocument(
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!isSupportedContentType(contentType)) {
    throw new Error(`Unsupported content type for OCR: ${contentType}`);
  }

  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-read")
    .post({
      contentType,
      body: buffer,
    });

  if (isUnexpected(initialResponse)) {
    throw new Error(
      initialResponse.body.error?.message ??
        "Document Intelligence analysis failed",
    );
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const result = await poller.pollUntilDone();
  const analyzeResult = (result.body as { analyzeResult?: AnalyzeResultOutput })
    .analyzeResult;

  if (!analyzeResult?.content) {
    throw new Error("Document Intelligence returned no extracted text");
  }

  return analyzeResult.content;
}
