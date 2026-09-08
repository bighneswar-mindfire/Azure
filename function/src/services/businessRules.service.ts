import type { RawA1cCandidate, RawBpCandidate, RawExtraction } from "../types/extraction";

export interface BusinessRuleResult {
  documentType: "BP" | "A1C" | null;
  measure: string | null;
  measureDate: string | null;
  needsReview: boolean;
  reviewReason: string | null;
}

function isCurrent(candidate: { qualifier: string }): boolean {
  return candidate.qualifier === "current";
}

function applyBpRules(extraction: RawExtraction): BusinessRuleResult {
  if (extraction.patientAgeYears !== null && extraction.patientAgeYears < 18) {
    return {
      documentType: "BP",
      measure: null,
      measureDate: null,
      needsReview: true,
      reviewReason: "Patient is under 18; BP results are not returned for minors.",
    };
  }

  const candidates = extraction.candidates.filter(
    (c): c is RawBpCandidate =>
      c.type === "BP" &&
      isCurrent(c) &&
      Number.isFinite(c.systolic) &&
      Number.isFinite(c.diastolic)
  );

  if (candidates.length === 0) {
    return {
      documentType: "BP",
      measure: null,
      measureDate: null,
      needsReview: true,
      reviewReason: "No current Blood Pressure reading with both systolic and diastolic values could be reliably identified.",
    };
  }

  const dated = candidates.filter((c) => c.date !== null);

  const chosen =
    dated.length > 0
      ? dated.reduce((latest, c) => (new Date(c.date as string) > new Date(latest.date as string) ? c : latest))
      : candidates.reduce((lowest, c) => (c.systolic + c.diastolic < lowest.systolic + lowest.diastolic ? c : lowest));

  return {
    documentType: "BP",
    measure: `${chosen.systolic}/${chosen.diastolic}`,
    measureDate: chosen.date,
    needsReview: false,
    reviewReason: null,
  };
}

function classifyA1c(value: number): string | null {
  if (value > 5.9) return "Diabetes";
  if (value > 5.7) return "Prediabetes";
  return null;
}

function applyA1cRules(extraction: RawExtraction): BusinessRuleResult {
  const candidates = extraction.candidates.filter(
    (c): c is RawA1cCandidate => c.type === "A1C" && isCurrent(c) && Number.isFinite(c.value)
  );

  if (candidates.length === 0) {
    return {
      documentType: "A1C",
      measure: null,
      measureDate: null,
      needsReview: true,
      reviewReason: "No current HbA1c result could be reliably identified.",
    };
  }

  const chosen = candidates.reduce((lowest, c) => (c.value < lowest.value ? c : lowest));
  const classification = classifyA1c(chosen.value);
  const measure = classification ? `${chosen.value}% (${classification})` : `${chosen.value}%`;

  return {
    documentType: "A1C",
    measure,
    measureDate: chosen.date,
    needsReview: false,
    reviewReason: null,
  };
}

export function applyBusinessRules(extraction: RawExtraction): BusinessRuleResult {
  const hasBp = extraction.candidates.some((c) => c.type === "BP");
  const hasA1c = extraction.candidates.some((c) => c.type === "A1C");

  if (!hasBp && !hasA1c) {
    return {
      documentType: null,
      measure: null,
      measureDate: null,
      needsReview: true,
      reviewReason: "Document does not appear to contain a Blood Pressure or HbA1c reading.",
    };
  }

  if (hasBp && !hasA1c) return applyBpRules(extraction);
  if (hasA1c && !hasBp) return applyA1cRules(extraction);

  const bpResult = applyBpRules(extraction);
  const a1cResult = applyA1cRules(extraction);

  if (!bpResult.needsReview && a1cResult.needsReview) return bpResult;
  if (!a1cResult.needsReview && bpResult.needsReview) return a1cResult;

  return {
    documentType: null,
    measure: null,
    measureDate: null,
    needsReview: true,
    reviewReason: "Document appears to reference both Blood Pressure and HbA1c readings; could not reliably determine a single document type.",
  };
}
