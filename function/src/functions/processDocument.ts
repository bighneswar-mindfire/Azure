import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { processDocument } from "../services/processing.service";

// Document Uploaded -> Logic App -> Azure Function -> OpenAI/Gemini -> Result -> PostgreSQL.
app.http("processDocument", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "processDocument/{documentId}",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    const documentId = request.params.documentId;

    if (!documentId) {
      return { status: 400, jsonBody: { error: "documentId is required" } };
    }

    try {
      const record = await processDocument(documentId);
      return { status: 200, jsonBody: record };
    } catch (err) {
      context.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return { status: 404, jsonBody: { error: message } };
    }
  },
});
