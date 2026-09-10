import type { ConfidenceLabel, ProcessingStatus } from "./types";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnlyFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateTimeFormatter.format(date);
}

// For date-only values (e.g. measureDate, "2026-08-12") - avoids showing a
// misleading "12:00 AM" for a timestamp that was never actually recorded.
export function formatDateOnly(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return dateOnlyFormatter.format(date);
}

export function statusBadgeClass(status: ProcessingStatus): string {
  switch (status) {
    case "Success":
      return "badge badge-success";
    case "Needs Review":
      return "badge badge-warning";
    case "Failed":
      return "badge badge-danger";
    case "Uploaded":
      return "badge badge-neutral";
  }
}

export function confidenceBadgeClass(label: ConfidenceLabel): string {
  switch (label) {
    case "High":
      return "badge badge-success";
    case "Medium":
      return "badge badge-warning";
    case "Low":
      return "badge badge-danger";
  }
}
