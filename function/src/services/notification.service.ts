// Calls a notification webhook (an Azure Logic App with an "When a HTTP
// request is received" trigger) so a human gets notified whenever a
// document needs manual review. Best-effort: a failure here should never
// break document processing itself, so errors are swallowed after logging.
export async function notifyNeedsReview(
  documentId: string,
  fileName: string,
  reviewReason: string | null,
): Promise<void> {
  const url = process.env.NEEDS_REVIEW_NOTIFICATION_URL;
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        fileName,
        reviewReason: reviewReason ?? "Unknown reason",
      }),
    });

    if (!response.ok) {
      console.error(`Needs-review notification webhook returned ${response.status}`);
    }
  } catch (err) {
    console.error("Failed to send needs-review notification:", err);
  }
}
