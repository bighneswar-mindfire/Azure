export type MeasureQualifier =
  | "current"
  | "goal_or_target"
  | "past"
  | "reference_range"
  | "other_non_current";

export interface RawBpCandidate {
  type: "BP";
  systolic: number;
  diastolic: number;
  date: string | null;
  qualifier: MeasureQualifier;
}

export interface RawA1cCandidate {
  type: "A1C";
  value: number;
  date: string | null;
  qualifier: MeasureQualifier;
}

export type RawMeasureCandidate = RawBpCandidate | RawA1cCandidate;

export interface RawExtraction {
  patientAgeYears: number | null;
  candidates: RawMeasureCandidate[];
}
