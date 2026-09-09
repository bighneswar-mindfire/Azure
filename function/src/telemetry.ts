import * as appInsights from "applicationinsights";

// Azure sets APPLICATIONINSIGHTS_CONNECTION_STRING automatically once
// Application Insights is linked to the Function App; locally (no App
// Insights configured) this stays disabled and the tracking calls no-op.
const isEnabled = Boolean(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);

if (isEnabled) {
  appInsights.setup().start();
}

// "Failed document-processing jobs" is domain logic Azure's own monitoring
// can't see on its own, so this emits a custom event an alert rule can
// query on (customEvents | where name == "DocumentProcessingFailed").
export function trackDocumentProcessingFailed(documentId: string, errorMessage: string): void {
  if (!isEnabled) return;
  appInsights.defaultClient.trackEvent({
    name: "DocumentProcessingFailed",
    properties: { documentId, errorMessage },
  });
}
