/**
 * HealthTrack AI — Hybrid Analysis Engine
 * Tries FastAPI MLOps backend first; falls back to local rule engine if unavailable.
 */

const FASTAPI_URL = "http://localhost:8000";
const TIMEOUT_MS  = 3000;

export interface MLPrediction {
  predicted_disease:  string;
  confidence:         number;
  risk_level:         string;
  all_probabilities:  Record<string, number>;
  shap_top_factors:   { feature: string; impact: number }[];
  description:        string;
  model_version:      string;
  inference_ms:       number;
  source:             "ml-model" | "rule-engine";
}

/** Check if FastAPI server is reachable */
export async function isMLServerAvailable(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(`${FASTAPI_URL}/health`, { signal: ctrl.signal });
    const data = await res.json();
    return data.model_loaded === true;
  } catch {
    return false;
  }
}

/** Map localAnalyzer parameter keys → FastAPI field names */
function buildApiPayload(params: Record<string, unknown>) {
  return {
    hemoglobin:       Number(params.hemoglobin   ?? 14.0),
    wbc:              Number(params.wbc           ?? 7.0),
    rbc:              Number(params.rbc           ?? 5.0),
    platelets:        Number(params.platelets     ?? 250),
    glucose:          Number(params.bloodGlucose  ?? params.glucose ?? 90),
    hba1c:            Number(params.hba1c         ?? 5.2),
    cholesterol:      Number(params.totalCholesterol ?? params.cholesterol ?? 180),
    ldl:              Number(params.ldlCholesterol ?? params.ldl ?? 90),
    hdl:              Number(params.hdlCholesterol ?? params.hdl ?? 55),
    triglycerides:    Number(params.triglycerides ?? 120),
    creatinine:       Number(params.creatinine    ?? 0.9),
    urea:             Number(params.urea          ?? 13),
    alt:              Number(params.alt           ?? 25),
    ast:              Number(params.ast           ?? 22),
    tsh:              Number(params.tsh           ?? 2.0),
    vitamin_d:        Number(params.vitaminD      ?? params.vitamin_d ?? 45),
    vitamin_b12:      Number(params.vitaminB12    ?? params.vitamin_b12 ?? 550),
    iron:             Number(params.iron          ?? 100),
    urine_protein:    params.urineProtein    === "positive" ? 1 : 0,
    urine_glucose:    params.urineGlucose    === "positive" ? 1 : 0,
    urine_ketones:    params.urineKetones    === "positive" || params.urineKetones === "moderate" || params.urineKetones === "large" ? 1 : 0,
    urine_blood:      params.urineBlood      === "positive" ? 1 : 0,
    urine_nitrite:    params.urineNitrite    === "positive" ? 1 : 0,
    urine_leukocytes: params.urineLeukocytes === "positive" ? 1 : 0,
  };
}

/** Call FastAPI prediction endpoint */
export async function callMLBackend(params: Record<string, unknown>): Promise<MLPrediction> {
  const payload = buildApiPayload(params);
  const res = await fetch(`${FASTAPI_URL}/predict`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`FastAPI error: ${res.status}`);
  const data = await res.json();
  return { ...data, source: "ml-model" as const };
}

/** Send user-corrected diagnosis back to backend for future retraining */
export async function submitFeedback(params: Record<string, unknown>, correctedDiagnosis: string) {
  try {
    await fetch(`${FASTAPI_URL}/feedback`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        inputs:     buildApiPayload(params),
        corrected:  correctedDiagnosis,
      }),
    });
  } catch {
    // Feedback is best-effort
  }
}

/** Get model info from backend */
export async function getModelInfo() {
  try {
    const res = await fetch(`${FASTAPI_URL}/model-info`);
    return await res.json();
  } catch {
    return null;
  }
}
