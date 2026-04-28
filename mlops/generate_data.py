"""
HealthTrack AI — Synthetic Clinical Data Generator
Generates realistic blood/urine data for training disease classifiers.
"""
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)
N = 5000  # samples per condition

def clip(arr, lo, hi):
    return np.clip(arr, lo, hi)

def generate():
    records = []

    # ── HEALTHY ────────────────────────────────────────────────────────────────
    n = N
    records.append(pd.DataFrame({
        "hemoglobin":         clip(np.random.normal(14.5, 1.0, n), 12, 18),
        "wbc":                clip(np.random.normal(7.0,  1.0, n), 4, 11),
        "rbc":                clip(np.random.normal(5.0,  0.4, n), 4, 6.5),
        "platelets":          clip(np.random.normal(260,  40,  n), 150, 400),
        "glucose":            clip(np.random.normal(88,   8,   n), 70, 99),
        "hba1c":              clip(np.random.normal(5.2,  0.3, n), 4.5, 5.6),
        "cholesterol":        clip(np.random.normal(180,  20,  n), 130, 199),
        "ldl":                clip(np.random.normal(90,   15,  n), 60, 99),
        "hdl":                clip(np.random.normal(55,   8,   n), 45, 80),
        "triglycerides":      clip(np.random.normal(120,  20,  n), 70, 149),
        "creatinine":         clip(np.random.normal(0.9,  0.1, n), 0.6, 1.2),
        "urea":               clip(np.random.normal(13,   3,   n), 7, 20),
        "alt":                clip(np.random.normal(25,   8,   n), 7, 40),
        "ast":                clip(np.random.normal(22,   6,   n), 10, 35),
        "tsh":                clip(np.random.normal(2.0,  0.8, n), 0.4, 4.0),
        "vitamin_d":          clip(np.random.normal(45,   10,  n), 30, 80),
        "vitamin_b12":        clip(np.random.normal(550,  100, n), 300, 900),
        "iron":               clip(np.random.normal(100,  20,  n), 60, 160),
        "urine_protein":      np.zeros(n),
        "urine_glucose":      np.zeros(n),
        "urine_ketones":      np.zeros(n),
        "urine_blood":        np.zeros(n),
        "urine_nitrite":      np.zeros(n),
        "urine_leukocytes":   np.zeros(n),
        "label":              np.zeros(n, dtype=int),  # 0 = healthy
    }))

    # ── TYPE 2 DIABETES ───────────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "hemoglobin":         clip(np.random.normal(13.5, 1.5, n), 11, 17),
        "wbc":                clip(np.random.normal(8.0,  1.5, n), 5, 13),
        "rbc":                clip(np.random.normal(4.8,  0.5, n), 4, 6),
        "platelets":          clip(np.random.normal(240,  50,  n), 150, 400),
        "glucose":            clip(np.random.normal(195,  40,  n), 126, 350),
        "hba1c":              clip(np.random.normal(8.2,  1.2, n), 6.5, 13),
        "cholesterol":        clip(np.random.normal(230,  35,  n), 180, 320),
        "ldl":                clip(np.random.normal(145,  30,  n), 100, 220),
        "hdl":                clip(np.random.normal(38,   6,   n), 25, 48),
        "triglycerides":      clip(np.random.normal(220,  60,  n), 150, 500),
        "creatinine":         clip(np.random.normal(1.1,  0.3, n), 0.7, 2.5),
        "urea":               clip(np.random.normal(18,   5,   n), 10, 35),
        "alt":                clip(np.random.normal(45,   15,  n), 20, 100),
        "ast":                clip(np.random.normal(38,   12,  n), 18, 80),
        "tsh":                clip(np.random.normal(2.5,  1.0, n), 0.5, 6),
        "vitamin_d":          clip(np.random.normal(22,   6,   n), 10, 35),
        "vitamin_b12":        clip(np.random.normal(400,  120, n), 200, 700),
        "iron":               clip(np.random.normal(85,   25,  n), 40, 140),
        "urine_protein":      np.random.binomial(1, 0.4, n).astype(float),
        "urine_glucose":      np.random.binomial(1, 0.8, n).astype(float),
        "urine_ketones":      np.random.binomial(1, 0.3, n).astype(float),
        "urine_blood":        np.random.binomial(1, 0.1, n).astype(float),
        "urine_nitrite":      np.random.binomial(1, 0.1, n).astype(float),
        "urine_leukocytes":   np.random.binomial(1, 0.15, n).astype(float),
        "label":              np.ones(n, dtype=int),  # 1 = diabetes
    }))

    # ── ANAEMIA ───────────────────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "hemoglobin":         clip(np.random.normal(9.5, 1.5, n), 6, 11.9),
        "wbc":                clip(np.random.normal(6.5, 1.5, n), 4, 11),
        "rbc":                clip(np.random.normal(3.5, 0.5, n), 2.5, 4.1),
        "platelets":          clip(np.random.normal(200, 50,  n), 100, 350),
        "glucose":            clip(np.random.normal(90,  10,  n), 70, 110),
        "hba1c":              clip(np.random.normal(5.4, 0.4, n), 4.8, 6.4),
        "cholesterol":        clip(np.random.normal(175, 25,  n), 130, 220),
        "ldl":                clip(np.random.normal(95,  20,  n), 60, 130),
        "hdl":                clip(np.random.normal(52,  8,   n), 38, 70),
        "triglycerides":      clip(np.random.normal(130, 25,  n), 80, 200),
        "creatinine":         clip(np.random.normal(0.85,0.15, n), 0.6, 1.2),
        "urea":               clip(np.random.normal(14,  4,   n), 7, 22),
        "alt":                clip(np.random.normal(22,  8,   n), 7, 45),
        "ast":                clip(np.random.normal(20,  7,   n), 10, 40),
        "tsh":                clip(np.random.normal(2.2, 1.0, n), 0.4, 5),
        "vitamin_d":          clip(np.random.normal(28,  8,   n), 12, 45),
        "vitamin_b12":        clip(np.random.normal(180, 50,  n), 80, 250),
        "iron":               clip(np.random.normal(38,  12,  n), 15, 59),
        "urine_protein":      np.zeros(n),
        "urine_glucose":      np.zeros(n),
        "urine_ketones":      np.zeros(n),
        "urine_blood":        np.zeros(n),
        "urine_nitrite":      np.zeros(n),
        "urine_leukocytes":   np.zeros(n),
        "label":              np.full(n, 2, dtype=int),  # 2 = anaemia
    }))

    # ── CHRONIC KIDNEY DISEASE ────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "hemoglobin":         clip(np.random.normal(10.5, 2.0, n), 7, 13),
        "wbc":                clip(np.random.normal(8.0,  2.0, n), 4, 14),
        "rbc":                clip(np.random.normal(3.8,  0.6, n), 2.5, 5),
        "platelets":          clip(np.random.normal(210,  60,  n), 100, 380),
        "glucose":            clip(np.random.normal(110,  20,  n), 80, 160),
        "hba1c":              clip(np.random.normal(5.8,  0.5, n), 5.0, 7.0),
        "cholesterol":        clip(np.random.normal(215,  40,  n), 160, 310),
        "ldl":                clip(np.random.normal(125,  30,  n), 80, 200),
        "hdl":                clip(np.random.normal(42,   8,   n), 28, 58),
        "triglycerides":      clip(np.random.normal(185,  50,  n), 120, 350),
        "creatinine":         clip(np.random.normal(3.2,  1.5, n), 1.4, 8.0),
        "urea":               clip(np.random.normal(58,   20,  n), 25, 120),
        "alt":                clip(np.random.normal(30,   10,  n), 12, 60),
        "ast":                clip(np.random.normal(28,   10,  n), 12, 55),
        "tsh":                clip(np.random.normal(3.0,  1.2, n), 0.5, 7),
        "vitamin_d":          clip(np.random.normal(16,   6,   n), 5, 28),
        "vitamin_b12":        clip(np.random.normal(420,  130, n), 180, 700),
        "iron":               clip(np.random.normal(60,   20,  n), 25, 100),
        "urine_protein":      np.random.binomial(1, 0.85, n).astype(float),
        "urine_glucose":      np.random.binomial(1, 0.15, n).astype(float),
        "urine_ketones":      np.zeros(n),
        "urine_blood":        np.random.binomial(1, 0.6, n).astype(float),
        "urine_nitrite":      np.random.binomial(1, 0.2, n).astype(float),
        "urine_leukocytes":   np.random.binomial(1, 0.3, n).astype(float),
        "label":              np.full(n, 3, dtype=int),  # 3 = CKD
    }))

    # ── LIVER DISEASE ─────────────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "hemoglobin":         clip(np.random.normal(12.0, 2.0, n), 8, 15),
        "wbc":                clip(np.random.normal(9.5,  2.5, n), 4, 16),
        "rbc":                clip(np.random.normal(4.2,  0.6, n), 3, 5.5),
        "platelets":          clip(np.random.normal(165,  60,  n), 80, 300),
        "glucose":            clip(np.random.normal(95,   15,  n), 70, 130),
        "hba1c":              clip(np.random.normal(5.5,  0.5, n), 4.8, 6.5),
        "cholesterol":        clip(np.random.normal(195,  35,  n), 140, 280),
        "ldl":                clip(np.random.normal(110,  25,  n), 70, 170),
        "hdl":                clip(np.random.normal(45,   8,   n), 30, 60),
        "triglycerides":      clip(np.random.normal(160,  45,  n), 100, 300),
        "creatinine":         clip(np.random.normal(1.0,  0.3, n), 0.6, 2.0),
        "urea":               clip(np.random.normal(15,   5,   n), 7, 28),
        "alt":                clip(np.random.normal(145,  80,  n), 57, 400),
        "ast":                clip(np.random.normal(120,  70,  n), 41, 350),
        "tsh":                clip(np.random.normal(2.5,  1.0, n), 0.5, 5),
        "vitamin_d":          clip(np.random.normal(25,   8,   n), 10, 40),
        "vitamin_b12":        clip(np.random.normal(800,  200, n), 400, 1500),
        "iron":               clip(np.random.normal(130,  40,  n), 60, 220),
        "urine_protein":      np.random.binomial(1, 0.2, n).astype(float),
        "urine_glucose":      np.zeros(n),
        "urine_ketones":      np.zeros(n),
        "urine_blood":        np.zeros(n),
        "urine_nitrite":      np.zeros(n),
        "urine_leukocytes":   np.zeros(n),
        "label":              np.full(n, 4, dtype=int),  # 4 = liver disease
    }))

    # ── HYPOTHYROIDISM ────────────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "hemoglobin":         clip(np.random.normal(12.5, 1.5, n), 9, 15),
        "wbc":                clip(np.random.normal(6.5,  1.5, n), 4, 10),
        "rbc":                clip(np.random.normal(4.3,  0.5, n), 3.5, 5.5),
        "platelets":          clip(np.random.normal(240,  50,  n), 150, 380),
        "glucose":            clip(np.random.normal(95,   12,  n), 75, 120),
        "hba1c":              clip(np.random.normal(5.5,  0.4, n), 4.8, 6.4),
        "cholesterol":        clip(np.random.normal(255,  40,  n), 200, 360),
        "ldl":                clip(np.random.normal(165,  35,  n), 110, 250),
        "hdl":                clip(np.random.normal(45,   8,   n), 30, 60),
        "triglycerides":      clip(np.random.normal(190,  50,  n), 120, 350),
        "creatinine":         clip(np.random.normal(1.0,  0.2, n), 0.6, 1.5),
        "urea":               clip(np.random.normal(14,   4,   n), 7, 22),
        "alt":                clip(np.random.normal(28,   10,  n), 10, 55),
        "ast":                clip(np.random.normal(25,   8,   n), 10, 45),
        "tsh":                clip(np.random.normal(12.0, 5.0, n), 4.6, 30),
        "vitamin_d":          clip(np.random.normal(20,   7,   n), 8, 35),
        "vitamin_b12":        clip(np.random.normal(380,  120, n), 150, 700),
        "iron":               clip(np.random.normal(75,   20,  n), 40, 120),
        "urine_protein":      np.zeros(n),
        "urine_glucose":      np.zeros(n),
        "urine_ketones":      np.zeros(n),
        "urine_blood":        np.zeros(n),
        "urine_nitrite":      np.zeros(n),
        "urine_leukocytes":   np.zeros(n),
        "label":              np.full(n, 5, dtype=int),  # 5 = hypothyroidism
    }))

    df = pd.concat(records, ignore_index=True).sample(frac=1, random_state=42)

    out = Path(__file__).parent / "data" / "clinical_dataset.csv"
    out.parent.mkdir(exist_ok=True)
    df.to_csv(out, index=False)
    print(f"✅ Generated {len(df):,} synthetic samples → {out}")
    print(df["label"].value_counts().rename({0:"Healthy",1:"Diabetes",2:"Anaemia",3:"CKD",4:"Liver",5:"Thyroid"}))
    return df

LABEL_MAP = {
    0: "Healthy",
    1: "Type 2 Diabetes",
    2: "Iron / B12 Anaemia",
    3: "Chronic Kidney Disease",
    4: "Liver Disease",
    5: "Hypothyroidism",
}

if __name__ == "__main__":
    generate()
