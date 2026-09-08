import { GoogleGenAI } from "@google/genai";
import type { RawExtraction } from "../types/extraction";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and configure it.");
}

const ai = new GoogleGenAI({ apiKey });

// Deliberately asks the model only to extract candidates and describe them,
// not to apply thresholds or pick a winner - that logic is deterministic and
// lives in businessRules.service.ts so it stays centralized and testable.
const EXTRACTION_PROMPT = `You are a clinical document analysis assistant. Read the clinical document text below and extract every Blood Pressure (BP) and Hemoglobin A1c (HbA1c) reading mentioned in it, along with enough context for a downstream rules engine to decide which one is the valid current result.

For EACH BP or HbA1c mention found, output one candidate object:
- For BP: {"type": "BP", "systolic": number, "diastolic": number, "date": "YYYY-MM-DD" or null, "qualifier": ...}
- For HbA1c: {"type": "A1C", "value": number, "date": "YYYY-MM-DD" or null, "qualifier": ...}

"qualifier" must be exactly one of:
- "current": a reading presented as an actual current measured result for this patient.
- "goal_or_target": explicitly described as a goal, target, or aim rather than a measured result.
- "past": explicitly described with language like "previous", "prior", "past", or "history of" (not merely having an older date - only use this when the text itself frames it as historical).
- "reference_range": a normal/reference range or example value, not this specific patient's own result.
- "other_non_current": any other language indicating it is not a current measured reading for this patient.

Do not invent values that are not in the text. Only extract a BP candidate if BOTH systolic and diastolic are present together. Extract every candidate you find, even non-current ones - the qualifier field is what lets the rules engine exclude them, don't just leave them out silently.

Also determine the patient's age in years if it is explicitly stated, or clearly computable from a stated date of birth and a stated document/visit date. If not determinable, use null.

Respond with ONLY a JSON object, no markdown formatting, matching exactly this shape:
{"patientAgeYears": number | null, "candidates": [ ...candidate objects as described above... ]}

If no BP or HbA1c readings are present at all, respond with {"patientAgeYears": <age or null>, "candidates": []}`;

export async function extractRawMeasures(documentText: string): Promise<RawExtraction> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `${EXTRACTION_PROMPT}\n\nDocument text:\n"""\n${documentText}\n"""` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no response text");
  }

  const parsed = JSON.parse(text) as Partial<RawExtraction>;

  return {
    patientAgeYears: parsed.patientAgeYears ?? null,
    candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
  };
}
