# 🧠 HealthTrack AI — MLOps Pipeline

A complete MLOps integration: data versioning → training → serving → monitoring → CI/CD.

---

## Quick Start

```bash
cd mlops

# 1. Create virtual environment
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate synthetic clinical training data
python generate_data.py

# 4. Train XGBoost model (with MLflow tracking + Optuna optimization)
python train.py

# 5. Start FastAPI prediction server
python serve.py
# → API running at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs

# 6. Open MLflow UI to view experiments
mlflow ui --backend-store-uri sqlite:///mlops/mlflow.db
# → http://localhost:5000
```

---

## Architecture

```
generate_data.py  →  train.py  →  serve.py  →  React Frontend
      ↓                ↓              ↓
  DVC tracking    MLflow runs    FastAPI REST
                      ↓              ↓
                  Model Registry  Prediction logs
                                      ↓
                               monitor.py (Evidently)
                                      ↓
                             Auto-retrain if drift
```

---

## Files

| File | Purpose |
|------|---------|
| `generate_data.py` | Synthetic clinical data (30,000 samples, 6 disease classes) |
| `train.py` | XGBoost + Optuna + SMOTE + MLflow + SHAP + Model Registry |
| `serve.py` | FastAPI server with SHAP explainability and prediction logging |
| `monitor.py` | Evidently AI drift detection with auto-retrain trigger |
| `requirements.txt` | All Python dependencies |
| `models/` | Trained model files |
| `reports/` | Confusion matrix, feature importance, SHAP, drift reports |
| `data/` | Training data, prediction logs, feedback logs |
| `../.github/workflows/ml_pipeline.yml` | GitHub Actions CI/CD |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info and model metadata |
| GET | `/health` | Health check |
| GET | `/model-info` | Model metrics (F1, AUC, trained_at) |
| POST | `/predict` | Disease prediction with SHAP explanation |
| POST | `/feedback` | Submit corrected diagnosis for retraining |

### Example Prediction Request

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "glucose": 195, "hba1c": 8.2,
    "hemoglobin": 13.0, "creatinine": 1.1,
    "urine_glucose": 1, "urine_protein": 0
  }'
```

### Example Response

```json
{
  "predicted_disease": "Type 2 Diabetes",
  "confidence": 91.4,
  "risk_level": "High",
  "all_probabilities": {
    "Healthy": 1.2,
    "Type 2 Diabetes": 91.4,
    "Iron / B12 Anaemia": 2.1
  },
  "shap_top_factors": [
    {"feature": "hba1c",   "impact": 0.842},
    {"feature": "glucose", "impact": 0.731}
  ],
  "inference_ms": 12.4
}
```

---

## How the Frontend Uses It

The React app (`src/app/utils/mlopsClient.ts`) auto-detects the FastAPI server:

```
User clicks "Analyze" →
  → Check http://localhost:8000/health
      ✅ Server available → POST /predict → XGBoost result + SHAP
      ❌ Server down     → Local rule engine (instant, offline)
```

No code changes needed — it switches automatically.

---

## GitHub Actions CI/CD

Triggers every Monday at 2 AM UTC and on every push to `mlops/`:

1. **Data** — Generate / pull latest dataset
2. **Train** — XGBoost + Optuna (25 trials)
3. **Validate** — Quality gate: F1 ≥ 0.82, AUC ≥ 0.90
4. **Integration Test** — FastAPI smoke test with real prediction
5. **Deploy** — Commit model to repo + create GitHub Release

---

## Disease Classes

| Label | Disease |
|-------|---------|
| 0 | Healthy |
| 1 | Type 2 Diabetes |
| 2 | Iron / B12 Anaemia |
| 3 | Chronic Kidney Disease |
| 4 | Liver Disease |
| 5 | Hypothyroidism |
