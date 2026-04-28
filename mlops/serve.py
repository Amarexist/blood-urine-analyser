"""
HealthTrack AI — FastAPI Model Serving
Loads the trained XGBoost model from MLflow and serves predictions via REST API.
"""
import json
import time
import logging
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import shap
import mlflow.xgboost
from xgboost import XGBClassifier
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("healthtrack")

# ── Config ────────────────────────────────────────────────────────────────────
MODELS_DIR   = Path("mlops/models")
META_PATH    = MODELS_DIR / "model_meta.json"
MODEL_PATH   = MODELS_DIR / "healthtrack_model.json"
LOG_PATH     = Path("mlops/data/prediction_log.jsonl")

FEATURES = [
    "hemoglobin","wbc","rbc","platelets","glucose","hba1c",
    "cholesterol","ldl","hdl","triglycerides","creatinine","urea",
    "alt","ast","tsh","vitamin_d","vitamin_b12","iron",
    "urine_protein","urine_glucose","urine_ketones",
    "urine_blood","urine_nitrite","urine_leukocytes",
]

LABEL_MAP = {
    0: "Healthy",
    1: "Type 2 Diabetes",
    2: "Iron / B12 Anaemia",
    3: "Chronic Kidney Disease",
    4: "Liver Disease",
    5: "Hypothyroidism",
}

RISK_DESCRIPTIONS = {
    "Type 2 Diabetes":         "Elevated blood sugar and HbA1c suggesting diabetes.",
    "Iron / B12 Anaemia":      "Low haemoglobin with iron or B12 deficiency.",
    "Chronic Kidney Disease":  "Elevated creatinine and urea with proteinuria.",
    "Liver Disease":           "Significantly raised liver enzymes (ALT/AST).",
    "Hypothyroidism":          "High TSH with elevated cholesterol and fatigue.",
    "Healthy":                 "All parameters within normal clinical range.",
}

# ── Load Model ────────────────────────────────────────────────────────────────
model:     Optional[XGBClassifier] = None
explainer: Optional[shap.TreeExplainer] = None
meta:      dict = {}

def load_model():
    global model, explainer, meta
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run: python mlops/train.py")
    model = XGBClassifier()
    model.load_model(str(MODEL_PATH))
    explainer = shap.TreeExplainer(model)
    if META_PATH.exists():
        with open(META_PATH) as f:
            meta = json.load(f)
    log.info(f"✅ Model loaded — trained at {meta.get('trained_at', 'unknown')}")
    log.info(f"   F1 Macro={meta.get('f1_macro')}  ROC AUC={meta.get('roc_auc')}")

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="HealthTrack AI — Clinical Analysis API",
    description="XGBoost-powered disease prediction from blood and urine parameters.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    try:
        load_model()
    except FileNotFoundError as e:
        log.warning(f"⚠️  {e}")

# ── Request / Response Models ─────────────────────────────────────────────────
class BloodUrineParams(BaseModel):
    # Blood
    hemoglobin:   float = Field(14.0, ge=2,   le=25,   description="g/dL")
    wbc:          float = Field(7.0,  ge=0.5, le=50,   description="×10³/µL")
    rbc:          float = Field(5.0,  ge=1,   le=9,    description="×10⁶/µL")
    platelets:    float = Field(250,  ge=10,  le=1000, description="×10³/µL")
    glucose:      float = Field(90,   ge=40,  le=600,  description="mg/dL")
    hba1c:        float = Field(5.2,  ge=3,   le=15,   description="%")
    cholesterol:  float = Field(180,  ge=80,  le=500,  description="mg/dL")
    ldl:          float = Field(90,   ge=30,  le=400,  description="mg/dL")
    hdl:          float = Field(55,   ge=10,  le=150,  description="mg/dL")
    triglycerides:float = Field(120,  ge=20,  le=2000, description="mg/dL")
    creatinine:   float = Field(0.9,  ge=0.2, le=20,   description="mg/dL")
    urea:         float = Field(13,   ge=2,   le=200,  description="mg/dL")
    alt:          float = Field(25,   ge=2,   le=2000, description="U/L")
    ast:          float = Field(22,   ge=2,   le=2000, description="U/L")
    tsh:          float = Field(2.0,  ge=0.01,le=100,  description="mIU/L")
    vitamin_d:    float = Field(45,   ge=2,   le=200,  description="ng/mL")
    vitamin_b12:  float = Field(550,  ge=50,  le=3000, description="pg/mL")
    iron:         float = Field(100,  ge=10,  le=400,  description="µg/dL")
    # Urine (0=negative, 1=positive)
    urine_protein:    float = Field(0, ge=0, le=1)
    urine_glucose:    float = Field(0, ge=0, le=1)
    urine_ketones:    float = Field(0, ge=0, le=1)
    urine_blood:      float = Field(0, ge=0, le=1)
    urine_nitrite:    float = Field(0, ge=0, le=1)
    urine_leukocytes: float = Field(0, ge=0, le=1)

class PredictionResult(BaseModel):
    predicted_disease:   str
    confidence:          float
    risk_level:          str
    all_probabilities:   dict
    shap_top_factors:    list
    description:         str
    model_version:       str
    inference_ms:        float

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service":    "HealthTrack AI Clinical API",
        "version":    "1.0.0",
        "model_ready": model is not None,
        "model_meta": meta,
        "endpoints":  ["/predict", "/health", "/model-info"],
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/model-info")
def model_info():
    return meta if meta else {"error": "Model not loaded"}

@app.post("/predict", response_model=PredictionResult)
def predict(params: BloodUrineParams):
    if model is None:
        raise HTTPException(503, "Model not loaded. Run: python mlops/train.py first.")

    t0 = time.perf_counter()

    # Build feature vector
    row = pd.DataFrame([[getattr(params, f) for f in FEATURES]], columns=FEATURES)

    # Predict
    probs     = model.predict_proba(row)[0]
    pred_idx  = int(np.argmax(probs))
    confidence= float(probs[pred_idx])

    # SHAP explanation
    shap_vals = explainer.shap_values(row)
    # For multiclass, pick shap values for predicted class
    if isinstance(shap_vals, list):
        sv = shap_vals[pred_idx][0]
    else:
        sv = shap_vals[pred_idx]

    top_factors = sorted(
        [{"feature": FEATURES[i], "impact": round(float(sv[i]), 4)} for i in range(len(FEATURES))],
        key=lambda x: abs(x["impact"]), reverse=True
    )[:5]

    # Risk level
    risk = "High" if confidence > 0.70 else "Moderate" if confidence > 0.45 else "Low"

    inference_ms = round((time.perf_counter() - t0) * 1000, 2)

    result = PredictionResult(
        predicted_disease = LABEL_MAP[pred_idx],
        confidence        = round(confidence * 100, 1),
        risk_level        = risk,
        all_probabilities = {LABEL_MAP[i]: round(float(p) * 100, 1) for i, p in enumerate(probs)},
        shap_top_factors  = top_factors,
        description       = RISK_DESCRIPTIONS.get(LABEL_MAP[pred_idx], ""),
        model_version     = meta.get("run_id", "unknown")[:8],
        inference_ms      = inference_ms,
    )

    # Log prediction for drift monitoring
    LOG_PATH.parent.mkdir(exist_ok=True)
    with open(LOG_PATH, "a") as f:
        log_entry = {
            "timestamp":        datetime.now().isoformat(),
            "inputs":           params.dict(),
            "predicted":        result.predicted_disease,
            "confidence":       result.confidence,
        }
        f.write(json.dumps(log_entry) + "\n")

    return result

@app.post("/feedback")
def feedback(data: dict):
    """Store user-corrected diagnosis for retraining."""
    feedback_path = Path("mlops/data/feedback_log.jsonl")
    feedback_path.parent.mkdir(exist_ok=True)
    with open(feedback_path, "a") as f:
        f.write(json.dumps({**data, "timestamp": datetime.now().isoformat()}) + "\n")
    return {"status": "recorded", "message": "Thank you — your correction helps improve the model."}

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("serve:app", host="0.0.0.0", port=8000, reload=True)
