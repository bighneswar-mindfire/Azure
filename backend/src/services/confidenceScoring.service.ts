import type { BusinessRuleResult } from "./businessRules.service";
import type { ConfidenceLabel } from "../types/document";
import type { RawExtraction } from "../types/extraction";

export interface ConfidenceScore {
  score: number;
  label: ConfidenceLabel;
}

const BP_FORMAT = /^\d{2,3}\/\d{2,3}$/;
const A1C_FORMAT = /^\d+(\.\d+)?%/;

function scoreFormatValidity(result: BusinessRuleResult): number {
  if (!result.documentType || !result.measure) return 0;
  if (result.documentType === "BP")
    return BP_FORMAT.test(result.measure) ? 1 : 0;
  return A1C_FORMAT.test(result.measure) ? 1 : 0;
}

function scoreCompleteness(result: BusinessRuleResult): number {
  let score = 0;
  if (result.measure) score += 0.5;
  if (result.measureDate) score += 0.5;
  return score;
}

function scoreBusinessRuleValidation(result: BusinessRuleResult): number {
  return result.needsReview ? 0 : 1;
}

function scoreCandidateConsistency(
  extraction: RawExtraction,
  result: BusinessRuleResult,
): number {
  if (!result.documentType) return 0;

  const currentCandidatesOfType = extraction.candidates.filter(
    (c) => c.type === result.documentType && c.qualifier === "current",
  );

  if (currentCandidatesOfType.length === 0) return 0;
  return currentCandidatesOfType.length === 1 ? 1 : 0.7;
}

const WEIGHTS = {
  format: 0.3,
  completeness: 0.25,
  businessRule: 0.3,
  consistency: 0.15,
};

function toLabel(score: number): ConfidenceLabel {
  if (score >= 85) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}

export function computeConfidenceScore(
  extraction: RawExtraction,
  result: BusinessRuleResult,
): ConfidenceScore {
  const weighted =
    WEIGHTS.format * scoreFormatValidity(result) +
    WEIGHTS.completeness * scoreCompleteness(result) +
    WEIGHTS.businessRule * scoreBusinessRuleValidation(result) +
    WEIGHTS.consistency * scoreCandidateConsistency(extraction, result);

  const score = Math.round(weighted * 100);
  return { score, label: toLabel(score) };
}
