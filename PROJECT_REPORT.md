# HealthTrack AI — Full Project Report

**Project Title:** HealthTrack AI — Personalized Blood & Urine Health Analyzer with MLOps Pipeline  
**Repository:** [github.com/Amarexist/blood-urine-analyser](https://github.com/Amarexist/blood-urine-analyser)  
**Technology Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Python · XGBoost · FastAPI · MLflow  
**Report Date:** April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Frontend Application](#6-frontend-application)
7. [Clinical Analysis Engine](#7-clinical-analysis-engine)
8. [Wellness Chatbot — Serena](#8-wellness-chatbot--serena)
9. [Online Pharmacy Integration](#9-online-pharmacy-integration)
10. [MLOps Pipeline](#10-mlops-pipeline)
11. [REST API Reference](#11-rest-api-reference)
12. [Dataset & Clinical References](#12-dataset--clinical-references)
13. [Security & Privacy](#13-security--privacy)
14. [Expected Model Performance](#14-expected-model-performance)
15. [Limitations](#15-limitations)
16. [Future Scope](#16-future-scope)
17. [Conclusion](#17-conclusion)

---

## 1. Executive Summary

HealthTrack AI is a full-stack, privacy-first health analytics platform that enables users to manually enter blood and urine laboratory parameters, receive AI-powered disease predictions, and access mental wellness support — all without any data leaving their device.

The project combines a **rule-based clinical engine** (for instant offline analysis) with a **production-grade MLOps pipeline** (XGBoost + FastAPI for cloud-enhanced predictions) to deliver a dual-mode diagnostic system. The platform covers 25+ medical conditions across 18 blood and 12 urine parameters, and includes an empathetic wellness chatbot (Serena), integrated online pharmacy links, and a complete CI/CD automated retraining system.

---

## 2. Problem Statement

Healthcare in developing regions faces several systemic challenges:

- **Lab report interpretation barriers** — Most patients receive blood/urine reports without clinical guidance on what abnormal values mean.
- **Cost of consultation** — Specialist consultations are expensive and inaccessible for routine monitoring.
- **Privacy concerns** — Cloud-based health applications upload sensitive personal medical data to remote servers.
- **Mental health neglect** — Anxiety and stress related to health concerns are often unaddressed alongside physical diagnostics.
- **Fragmented healthcare journey** — No single platform connects diagnostics → wellness → medication procurement.

HealthTrack AI addresses all five gaps in a single, cohesive, client-side application.

---

## 3. Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Build a client-side clinical rule engine for 25+ diseases | ✅ Complete |
| 2 | Support 18 blood parameters and 12 urine parameters | ✅ Complete |
| 3 | Generate personalized diet, nutrition, and lifestyle plans | ✅ Complete |
| 4 | Implement Serena — an empathetic mental wellness chatbot | ✅ Complete |
| 5 | Integrate online pharmacy channels for medication access | ✅ Complete |
| 6 | Build a production MLOps pipeline with XGBoost | ✅ Complete |
| 7 | Implement experiment tracking with MLflow | ✅ Complete |
| 8 | Implement hyperparameter optimization with Optuna | ✅ Complete |
| 9 | Serve predictions via FastAPI with SHAP explanations | ✅ Complete |
| 10 | Detect data drift using Evidently AI | ✅ Complete |
| 11 | Automate CI/CD with GitHub Actions (5-stage pipeline) | ✅ Complete |
| 12 | Ensure 100% client-side privacy (no backend required) | ✅ Complete |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                   USER BROWSER                        │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Dashboard  │  │ Manual Entry │  │ Wellness    │ │
│  │             │  │ (30 params)  │  │ Chat(Serena)│ │
│  └──────┬──────┘  └──────┬───────┘  └─────────────┘ │
│         │                │                            │
│         │         ┌──────▼────────────┐              │
│         │         │  mlopsClient.ts   │              │
│         │         │  (hybrid engine)  │              │
│         │         └──┬────────────────┘              │
│         │            │                               │
│  ┌──────▼────────┐  ┌▼──────────────────┐           │
│  │  Pharmacy     │  │  localAnalyzer.ts  │           │
│  │  Links        │  │  (rule engine,     │           │
│  │  (1mg, etc.)  │  │   always works)    │           │
│  └───────────────┘  └────────────────────┘           │
└──────────────────────────────────────────────────────┘
                         │ (if FastAPI server running)
┌────────────────────────▼─────────────────────────────┐
│                  MLOPS BACKEND (Python)               │
│                                                       │
│  FastAPI serve.py  ──►  XGBoost Model                │
│       │                  + SHAP explanations          │
│       ▼                                               │
│  Prediction Log ──►  monitor.py (Evidently AI)        │
│                        │                              │
│                        ▼ (if drift detected)          │
│                   train.py (retrain)                  │
│                        │                              │
│                        ▼                              │
│                   MLflow Registry                     │
└──────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│              GITHUB ACTIONS CI/CD                     │
│  Data → Train → Quality Gate → Test → Deploy          │
└──────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
User enters parameters (ManualEntry.tsx)
    ↓
mlopsClient.ts checks: is FastAPI at :8000 alive?
    ├── YES → POST /predict → XGBoost + SHAP → AnalysisResult
    └── NO  → localAnalyzer.ts rule engine → AnalysisResult
                    ↓
            sessionStorage saves result
                    ↓
            AnalysisResult page renders:
            - Predicted diseases + risk levels
            - SHAP top contributing factors (ML mode)
            - Personalized diet recommendations
            - Supplement plan
            - Lifestyle modifications
            - Pharmacy links
```

---

## 5. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type-safe development |
| Vite | 6.x | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router | 7.x | Client-side routing |
| Lucide React | latest | Icon library |

### MLOps Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| XGBoost | 2.0.3 | Multi-class disease classifier |
| scikit-learn | 1.4.2 | Preprocessing, metrics |
| MLflow | 2.13.0 | Experiment tracking + model registry |
| FastAPI | 0.111.0 | REST API server |
| Optuna | 3.6.1 | Bayesian hyperparameter optimization |
| SHAP | 0.45.1 | Prediction explainability |
| Evidently AI | 0.4.30 | Data drift monitoring |
| SMOTE (imbalanced-learn) | 0.12.3 | Class balancing |
| DVC | 3.50.1 | Data versioning |
| GitHub Actions | — | CI/CD automation |

---

## 6. Frontend Application

### 6.1 Page Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` or `/dashboard` | Dashboard | Main hub — entry point to all 3 pillars |
| `/manual-entry` | ManualEntry | 30-parameter clinical data entry form |
| `/analysis/:id` | AnalysisResult | Disease predictions + recommendations |
| `/wellness-chat` | WellnessChat | Serena mental wellness chatbot |

### 6.2 Dashboard Design

The dashboard presents three core pillars as interactive cards:

1. **AI Diagnosis** — Enter lab values and get instant disease predictions
2. **Wellness Chat** — Talk to Serena for mental health support
3. **Online Pharmacy** — Access trusted pharmaceutical retailers

Design choices:
- Dark mode with teal/cyan gradient accents
- Glassmorphism card effects
- Smooth hover animations and micro-interactions
- Fully responsive (mobile + desktop)

### 6.3 Manual Entry Form

The ManualEntry page features:

**Blood Parameters (18 fields):**
Hemoglobin, WBC, RBC, Platelets, Fasting Glucose, HbA1c, Total Cholesterol, LDL, HDL, Triglycerides, Creatinine, Urea, ALT, AST, TSH, Vitamin D, Vitamin B12, Iron

**Urine Parameters (12 fields):**
Color, Appearance, pH, Specific Gravity, Protein, Glucose, Ketones, Blood, Bilirubin, Urobilinogen, Nitrite, Leukocyte Esterase

**Additional Features:**
- Default Parameters Preset — fills all fields with healthy reference values for demonstration
- Symptom Multi-select — 20+ common symptoms for enhanced diagnostic context
- Patient Demographics — Age, Gender, Weight, Height (used for gender/age-aware thresholds)

**Hybrid Submission Logic:**
```
handleSubmit() →
  await isMLServerAvailable()
    YES → callMLBackend(params) → XGBoost + SHAP result
      THEN → also run localAnalyzer for recommendations
      SAVE to sessionStorage → navigate to /analysis/:id
    NO  → localAnalyzer(params) → rule-based result
      SAVE to sessionStorage → navigate to /analysis/:id
```

### 6.4 Analysis Result Page

Displays:
- **Primary diagnosis** with confidence percentage (ML mode)
- **Risk level** — High / Moderate / Low
- **All disease probabilities** (ML mode)
- **SHAP top 5 contributing factors** (ML mode) — explains *why* the model predicted that disease
- **Out-of-range parameters** with clinical context
- **Personalized diet plan** (specific foods to eat and avoid)
- **Supplement recommendations** with dosages
- **Lifestyle modifications** (exercise, sleep, hydration)
- **Source badge** — "🤖 XGBoost ML Model" or "📋 Rule Engine"

---

## 7. Clinical Analysis Engine

### 7.1 Overview

`localAnalyzer.ts` is a fully client-side, offline-capable diagnostic engine that uses evidence-based clinical thresholds from international guidelines (ADA, WHO, KDIGO, ESC).

### 7.2 Disease Coverage (25+ conditions)

**Metabolic:**
- Type 1 / Type 2 Diabetes (ADA 2024 criteria)
- Pre-diabetes
- Metabolic Syndrome
- Hypercholesterolaemia / Dyslipidaemia

**Haematological:**
- Iron Deficiency Anaemia
- Vitamin B12 / Folate Deficiency Anaemia
- Aplastic Anaemia
- Polycythaemia Vera
- Thrombocytopenia / Thrombocytosis

**Renal:**
- Acute Kidney Injury
- Chronic Kidney Disease (Stages 1–5, KDIGO)
- Urinary Tract Infection
- Nephrotic Syndrome

**Hepatic:**
- Acute Hepatitis
- Alcoholic Liver Disease
- Non-Alcoholic Fatty Liver Disease (NAFLD)

**Endocrine:**
- Hypothyroidism / Hyperthyroidism
- Vitamin D Deficiency
- Iron Overload

**Cardiovascular:**
- High Cardiovascular Risk (Framingham-based)
- Hypertriglyceridaemia

### 7.3 Threshold System

The engine uses **gender-aware** and **age-aware** thresholds:

```typescript
// Example: Haemoglobin thresholds
const hgbLow = gender === 'male'
  ? (age > 65 ? 12.0 : 13.5)
  : (age > 65 ? 11.5 : 12.0);

// Example: Creatinine thresholds
const creatHigh = gender === 'male' ? 1.2 : 1.0;
```

### 7.4 Recommendation Engine

For each detected condition, the engine generates:

**Diet Plan** — Specific foods categorized as:
- Recommended (with rationale)
- Foods to limit or avoid

**Supplement Plan** — Targeted micronutrients with:
- Specific dosages (e.g., "Iron 65mg elemental, twice daily with Vitamin C")
- Duration guidance

**Lifestyle Modifications** — Tailored to condition:
- Exercise type, frequency, intensity
- Sleep requirements
- Stress management
- Hydration targets

---

## 8. Wellness Chatbot — Serena

### 8.1 Overview

Serena is an empathetic mental wellness chatbot built into the React frontend (`WellnessChat.tsx`). She specializes in anxiety, stress, and mood support with built-in therapeutic techniques.

### 8.2 Capabilities

| Feature | Description |
|---------|-------------|
| Empathetic conversation | Responds to emotional cues with compassion |
| Anxiety relief | Guided breathing exercises (4-7-8 technique) |
| Stress management | Cognitive reframing, grounding techniques |
| Crisis intervention | Recognizes crisis language → shares emergency resources |
| Mood check-ins | Daily mood assessment and tracking |
| Sleep guidance | Evidence-based sleep hygiene tips |
| Mindfulness | Body scan and progressive muscle relaxation scripts |

### 8.3 Guided Breathing Exercise

When a user says "breathing" or "I'm anxious", Serena initiates a guided 4-7-8 exercise:
- **Inhale** for 4 seconds
- **Hold** for 7 seconds
- **Exhale** for 8 seconds

The UI animates a breathing circle in sync with each phase.

### 8.4 Design

- Glassmorphism chat bubbles with teal/cyan gradient
- Typing indicator animation
- Crisis resources always accessible
- Calm, non-clinical, conversational language

---

## 9. Online Pharmacy Integration

The dashboard includes four curated pharmacy channels:

| Pharmacy | URL | Coverage |
|----------|-----|---------|
| 1mg | tata1mg.com | Pan-India, largest online pharmacy |
| PharmEasy | pharmeasy.in | Medicines + diagnostics + consultations |
| Netmeds | netmeds.com | Reliance-owned, trusted brand |
| Apollo Pharmacy | apollopharmacy.in | Offline + online hybrid chain |

Each card opens in a new browser tab when clicked, allowing users to:
- Purchase medications recommended in their analysis report
- Book home diagnostic tests
- Access teleconsultation services

---

## 10. MLOps Pipeline

### 10.1 Overview

The MLOps pipeline transforms the static rule engine into a continuously learning XGBoost classifier, with full experiment tracking, automated retraining, and drift monitoring.

### 10.2 Pipeline Stages

```
Stage 1: Data Engineering
  generate_data.py
  - 30,000 synthetic clinical samples
  - 6 disease classes (Healthy, Diabetes, Anaemia, CKD, Liver, Thyroid)
  - 24 features (18 blood + 6 urine flags)
  - Realistic parameter distributions per class

Stage 2: Data Versioning (DVC)
  dvc.yaml
  - Tracks dataset with Git-like versioning
  - Reproducible pipeline: dvc repro
  - Remote storage ready (GDrive / S3)

Stage 3: Model Training (MLflow + Optuna + SMOTE + SHAP)
  train.py
  - 25 Optuna trials for hyperparameter optimization
  - SMOTE oversampling for class balance
  - XGBoost multi-class classifier
  - Logs all parameters, metrics, plots to MLflow
  - Registers model in MLflow Model Registry

Stage 4: Quality Gate
  train.py (inline)
  - F1 Macro >= 0.82
  - ROC AUC >= 0.90
  - Training halts if gate fails

Stage 5: Model Serving (FastAPI)
  serve.py
  - REST API at http://localhost:8000
  - SHAP explanations per prediction
  - Logs every prediction to JSONL
  - /feedback endpoint for corrections

Stage 6: Drift Monitoring (Evidently AI)
  monitor.py
  - Weekly comparison: training vs production distributions
  - Per-column drift detection (Kolmogorov-Smirnov / chi-squared tests)
  - Auto-triggers retraining when drift detected

Stage 7: CI/CD (GitHub Actions)
  .github/workflows/ml_pipeline.yml
  - 5 jobs: data → train → validate → integration-test → deploy
  - Runs every Monday 2AM UTC + on push to mlops/
  - Comments model metrics on Pull Requests
  - Creates GitHub Release on deploy
```

### 10.3 MLflow Experiment Tracking

Every training run logs:

| Category | Items Logged |
|----------|-------------|
| Parameters | n_estimators, max_depth, learning_rate, subsample, colsample_bytree, reg_alpha, reg_lambda |
| Metrics | accuracy, f1_macro, f1_weighted, roc_auc |
| Artifacts | confusion_matrix.png, feature_importance.png, shap_summary.png, model_meta.json |
| Model | XGBoost model file (registered in Model Registry) |

### 10.4 Model Registry Lifecycle

```
Training Complete
    ↓
Register as new version (mlflow.register_model)
    ↓
Staging → (validation checks pass) → Production
    ↓
Previous Production → Archived
```

### 10.5 SHAP Explainability

For each prediction, SHAP (SHapley Additive exPlanations) computes:
- The marginal contribution of each feature to the prediction
- Returned as `shap_top_factors` in the API response
- Displayed in the React frontend as "What drove this result"

Example output for a diabetic patient:
```json
"shap_top_factors": [
  { "feature": "hba1c",    "impact": +0.842 },
  { "feature": "glucose",  "impact": +0.731 },
  { "feature": "hdl",      "impact": -0.156 }
]
```

Positive impact = pushes towards diabetes diagnosis.
Negative impact = protective factor (high HDL reduces risk).

### 10.6 Feedback Loop

```
1. User sees: "Predicted: Type 2 Diabetes"
2. User knows: "Actually I have Anaemia"
3. POST /feedback { corrected: "Iron / B12 Anaemia" }
4. Stored in: mlops/data/feedback_log.jsonl
5. When 500+ corrections → next training cycle uses them
6. Model becomes progressively more accurate
```

### 10.7 Frontend Bridge (mlopsClient.ts)

```typescript
// Transparent fallback logic
const mlAvailable = await isMLServerAvailable();  // 3s timeout

if (mlAvailable) {
  result = await callMLBackend(params);   // XGBoost + SHAP
} else {
  result = analyzeLocally(params);        // offline rule engine
}
```

The user experience is identical in both modes — the source badge in AnalysisResult indicates which engine ran.

---

## 11. REST API Reference

**Base URL:** `http://localhost:8000`

### GET /health
```json
{ "status": "ok", "model_loaded": true }
```

### GET /model-info
```json
{
  "run_id": "abc123",
  "f1_macro": 0.891,
  "roc_auc": 0.964,
  "trained_at": "2026-04-28T08:00:00"
}
```

### POST /predict

**Request Body (24 fields):**
```json
{
  "hemoglobin": 13.0, "wbc": 8.5, "rbc": 4.7, "platelets": 220,
  "glucose": 195, "hba1c": 8.2, "cholesterol": 240, "ldl": 145,
  "hdl": 38, "triglycerides": 210, "creatinine": 1.1, "urea": 18,
  "alt": 38, "ast": 32, "tsh": 2.5, "vitamin_d": 18,
  "vitamin_b12": 300, "iron": 85,
  "urine_protein": 0, "urine_glucose": 1, "urine_ketones": 0,
  "urine_blood": 0, "urine_nitrite": 0, "urine_leukocytes": 0
}
```

**Response:**
```json
{
  "predicted_disease": "Type 2 Diabetes",
  "confidence": 91.4,
  "risk_level": "High",
  "all_probabilities": { "Type 2 Diabetes": 91.4, "Healthy": 1.2 },
  "shap_top_factors": [
    { "feature": "hba1c", "impact": 0.842 }
  ],
  "description": "Elevated blood sugar and HbA1c suggesting diabetes.",
  "model_version": "1b33281a",
  "inference_ms": 12.4
}
```

### POST /feedback
```json
{ "corrected": "Iron / B12 Anaemia" }
```

---

## 12. Dataset & Clinical References

### 12.1 Synthetic Dataset

The training dataset (`generate_data.py`) generates 30,000 clinically realistic samples:

| Class | N | Key Parameter Ranges |
|-------|---|---------------------|
| Healthy (0) | 5,000 | Hgb 12-18, Glucose 70-99, HbA1c 4.5-5.6 |
| Type 2 Diabetes (1) | 5,000 | Glucose 126-350, HbA1c 6.5-13 |
| Iron/B12 Anaemia (2) | 5,000 | Hgb 6-11.9, Iron 15-59, B12 80-250 |
| CKD (3) | 5,000 | Creatinine 1.4-8.0, Urea 25-120, Protein+ |
| Liver Disease (4) | 5,000 | ALT 57-400, AST 41-350, B12 elevated |
| Hypothyroidism (5) | 5,000 | TSH 4.6-30, Cholesterol 200-360 |

### 12.2 Clinical Guidelines Used

| Guideline | Applied To |
|-----------|-----------|
| ADA Standards of Care 2024 | Diabetes thresholds (Glucose, HbA1c) |
| WHO Haemoglobin Cutoffs | Anaemia diagnosis by age/gender |
| KDIGO 2022 | CKD staging (eGFR, creatinine) |
| AASLD Guidelines | Liver enzyme interpretation |
| ATA Guidelines | Thyroid (TSH, T3, T4) |
| ESC/EAS Lipid Guidelines | Cholesterol and cardiovascular risk |
| ICMR Reference Ranges | India-specific normal ranges |

---

## 13. Security & Privacy

| Aspect | Implementation |
|--------|---------------|
| Data storage | `sessionStorage` — cleared when browser tab closes |
| Backend dependency | None required — fully offline capable |
| API keys | Zero — no external API calls in rule engine mode |
| Authentication | Removed — no login required, no user tracking |
| HTTPS | Recommended for production FastAPI deployment |
| Token security | GitHub PAT rotated after use |

**Privacy guarantee:** In offline mode, all health data is processed exclusively in the user's browser. No data is transmitted to any server.

---

## 14. Expected Model Performance

Based on the training configuration (XGBoost + Optuna + SMOTE):

| Metric | Expected Range | Quality Gate |
|--------|---------------|-------------|
| F1 Macro | 0.88 – 0.94 | >= 0.82 |
| F1 Weighted | 0.89 – 0.95 | — |
| ROC AUC (OvR) | 0.96 – 0.99 | >= 0.90 |
| Accuracy | 0.87 – 0.93 | — |
| Inference Latency | 8 – 20 ms | — |

**Note:** These are expected ranges on synthetic data. Real-world performance would depend on clinical validation with actual patient records.

---

## 15. Limitations

1. **Synthetic training data** — The XGBoost model is trained on programmatically generated data, not real patient records. Clinical validation is required before medical deployment.

2. **No imaging support** — The system does not analyze X-rays, MRIs, or ECGs — only numerical lab parameters.

3. **6 disease classes** — The ML model covers only 6 conditions. The rule engine covers 25+. Full ML parity requires more training data for all conditions.

4. **No differential diagnosis** — The model predicts a primary condition. Multiple simultaneous conditions (comorbidities) are not fully modelled.

5. **Internet required for pharmacy** — Online pharmacy links require an internet connection.

6. **Not a medical device** — This application is for educational and informational purposes only. It does not replace professional medical advice.

---

## 16. Future Scope

### Near-term (3–6 months)

| Feature | Description |
|---------|-------------|
| PDF Export | Generate printable health reports for doctor consultations |
| IndexedDB Persistence | Store multiple sessions for trend tracking |
| ONNX Browser Inference | Run XGBoost model directly in browser (no server needed) |
| Input Validation | Clinical range enforcement on all form fields |
| Multi-language Support | Hindi, Tamil, Telugu, Bengali translations |

### Medium-term (6–12 months)

| Feature | Description |
|---------|-------------|
| Real Dataset Integration | Connect UCI, PhysioNet, MIMIC datasets |
| ECG Analysis | Integrate TensorFlow.js for rhythm classification |
| Medication Tracker | Prescription management and refill reminders |
| Doctor Sharing | Secure link generation for report sharing |
| Progressive Web App | Installable offline-capable mobile app |

### Long-term (12+ months)

| Feature | Description |
|---------|-------------|
| Federated Learning | Train across devices without centralizing data |
| FHIR Integration | Import data from hospital electronic health records |
| Wearable Sync | Apple Health / Google Fit API integration |
| Telemedicine | Video consultation booking with integrated report sharing |
| Insurance Linkage | Pre-authorization support based on diagnostic results |

---

## 17. Conclusion

HealthTrack AI successfully delivers on its core mission: making clinical health intelligence accessible, private, and actionable for every user.

**Key achievements:**

- A **dual-mode diagnostic system** that works offline (rule engine) and enhances itself when connected to the ML backend — ensuring zero downtime.
- A **production-grade MLOps pipeline** covering all 12 core concepts: data versioning, experiment tracking, hyperparameter optimization, class balancing, explainability, model registry, REST serving, drift monitoring, feedback loops, and CI/CD.
- A **holistic health toolkit** combining clinical diagnostics, mental wellness support (Serena), and integrated pharmaceutical access in one cohesive interface.
- **Full auditability** — every clinical threshold is traceable to international medical guidelines, and every ML decision is explainable via SHAP values.
- **Privacy by design** — no health data ever leaves the user's browser in offline mode.

The platform represents a strong foundation for a production-ready, clinically auditable health monitoring system that could meaningfully improve healthcare access in resource-constrained environments.

---

*Report generated: April 2026 | HealthTrack AI v1.0 | github.com/Amarexist/blood-urine-analyser*
