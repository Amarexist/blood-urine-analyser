"""
HealthTrack AI — Evidently Drift Monitoring
Compares training distribution vs recent predictions to detect data drift.
"""
import json
import warnings
import pandas as pd
from pathlib import Path
from datetime import datetime

from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, DataQualityPreset
from evidently.metrics import (
    DatasetDriftMetric,
    DatasetMissingValuesMetric,
    ColumnDriftMetric,
)

warnings.filterwarnings("ignore")

FEATURES = [
    "hemoglobin","wbc","rbc","platelets","glucose","hba1c",
    "cholesterol","ldl","hdl","triglycerides","creatinine","urea",
    "alt","ast","tsh","vitamin_d","vitamin_b12","iron",
    "urine_protein","urine_glucose","urine_ketones",
    "urine_blood","urine_nitrite","urine_leukocytes",
]

CRITICAL_FEATURES = ["glucose", "hba1c", "creatinine", "alt", "tsh", "hemoglobin"]

REPORTS_DIR  = Path("mlops/reports")
LOG_PATH     = Path("mlops/data/prediction_log.jsonl")
TRAIN_PATH   = Path("mlops/data/clinical_dataset.csv")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def load_reference():
    if not TRAIN_PATH.exists():
        raise FileNotFoundError("Training data not found. Run: python mlops/generate_data.py")
    df = pd.read_csv(TRAIN_PATH)
    return df[FEATURES].sample(1000, random_state=42)


def load_production():
    if not LOG_PATH.exists():
        raise FileNotFoundError("No prediction logs found yet. Run the FastAPI server and make predictions.")
    records = []
    with open(LOG_PATH) as f:
        for line in f:
            entry = json.loads(line)
            records.append(entry["inputs"])
    if len(records) < 50:
        raise ValueError(f"Only {len(records)} predictions logged — need ≥50 for drift analysis.")
    df = pd.DataFrame(records)[FEATURES]
    print(f"📊 Production data: {len(df)} predictions loaded")
    return df


def run_drift_report(reference: pd.DataFrame, production: pd.DataFrame) -> dict:
    print("🔍 Running Evidently drift report...")
    report = Report(metrics=[
        DatasetDriftMetric(),
        DatasetMissingValuesMetric(),
        *[ColumnDriftMetric(column_name=f) for f in CRITICAL_FEATURES],
    ])
    report.run(reference_data=reference, current_data=production)

    # Save HTML report
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    html_path = REPORTS_DIR / f"drift_report_{ts}.html"
    report.save_html(str(html_path))
    print(f"📄 Drift report saved → {html_path}")

    # Parse results
    result = report.as_dict()
    drift_detected    = result["metrics"][0]["result"]["dataset_drift"]
    drift_share       = result["metrics"][0]["result"]["share_of_drifted_columns"]
    missing_share     = result["metrics"][1]["result"]["current"]["share_of_missing_values"]

    # Per-column drift
    col_drifts = {}
    for i, feat in enumerate(CRITICAL_FEATURES):
        col_result = result["metrics"][2 + i]["result"]
        col_drifts[feat] = {
            "drift_detected": col_result.get("drift_detected", False),
            "p_value":        round(col_result.get("p_value", 1.0), 4),
        }

    summary = {
        "timestamp":        datetime.now().isoformat(),
        "n_production":     len(production),
        "dataset_drift":    drift_detected,
        "drifted_columns":  round(drift_share * 100, 1),
        "missing_values":   round(missing_share * 100, 2),
        "critical_features":col_drifts,
        "report_path":      str(html_path),
        "action_needed":    drift_detected or drift_share > 0.3,
    }

    # Save JSON summary
    json_path = REPORTS_DIR / f"drift_summary_{ts}.json"
    with open(json_path, "w") as f:
        json.dump(summary, f, indent=2)

    return summary


def print_summary(summary: dict):
    status = "🔴 DRIFT DETECTED" if summary["dataset_drift"] else "✅ NO DRIFT"
    print(f"\n{'='*55}")
    print(f"  DRIFT MONITORING REPORT — {summary['timestamp'][:10]}")
    print(f"{'='*55}")
    print(f"  Status             : {status}")
    print(f"  Production samples : {summary['n_production']}")
    print(f"  Drifted columns    : {summary['drifted_columns']}%")
    print(f"  Missing values     : {summary['missing_values']}%")
    print(f"\n  Critical Features:")
    for feat, info in summary["critical_features"].items():
        flag = "⚠️" if info["drift_detected"] else "✅"
        print(f"    {flag} {feat:<20} p={info['p_value']:.4f}")
    print(f"\n  Action needed: {'YES — trigger retraining!' if summary['action_needed'] else 'No'}")
    print(f"  Report: {summary['report_path']}")
    print(f"{'='*55}\n")


def trigger_retraining_if_needed(summary: dict):
    if summary["action_needed"]:
        print("🚨 Drift threshold exceeded — triggering retraining pipeline...")
        import subprocess
        subprocess.run(["python", "mlops/train.py"], check=True)


if __name__ == "__main__":
    reference  = load_reference()
    production = load_production()
    summary    = run_drift_report(reference, production)
    print_summary(summary)
    trigger_retraining_if_needed(summary)
