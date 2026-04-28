"""
HealthTrack AI — XGBoost Training Pipeline with MLflow Tracking
Trains a multi-class disease classifier and logs everything to MLflow.
"""
import os
import json
import warnings
import numpy as np
import pandas as pd
import mlflow
import mlflow.xgboost
import shap
import optuna
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from pathlib import Path
from datetime import datetime
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, f1_score, accuracy_score
)
from sklearn.utils.class_weight import compute_sample_weight
from imblearn.over_sampling import SMOTE

from generate_data import generate, LABEL_MAP

warnings.filterwarnings("ignore")

# ── Config ────────────────────────────────────────────────────────────────────
MLFLOW_URI      = "sqlite:///mlops/mlflow.db"
EXPERIMENT_NAME = "HealthTrack-Disease-Classifier"
MODEL_NAME      = "HealthTrack-Classifier"
MIN_F1          = 0.82          # quality gate
REPORTS_DIR     = Path("mlops/reports")
MODELS_DIR      = Path("mlops/models")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "hemoglobin","wbc","rbc","platelets","glucose","hba1c",
    "cholesterol","ldl","hdl","triglycerides","creatinine","urea",
    "alt","ast","tsh","vitamin_d","vitamin_b12","iron",
    "urine_protein","urine_glucose","urine_ketones",
    "urine_blood","urine_nitrite","urine_leukocytes",
]

# ── Data Loading ──────────────────────────────────────────────────────────────
def load_data():
    data_path = Path("mlops/data/clinical_dataset.csv")
    if not data_path.exists():
        print("📦 Generating synthetic dataset...")
        generate()
    df = pd.read_csv(data_path)
    X = df[FEATURES]
    y = df["label"]
    print(f"✅ Loaded {len(df):,} samples | {y.nunique()} classes")
    return X, y

# ── Optuna Hyperparameter Optimization ────────────────────────────────────────
def optimize_hyperparams(X_train, y_train, n_trials=30):
    print(f"🔍 Optimizing hyperparameters ({n_trials} trials)...")

    def objective(trial):
        params = {
            "n_estimators":      trial.suggest_int("n_estimators", 100, 500),
            "max_depth":         trial.suggest_int("max_depth", 3, 8),
            "learning_rate":     trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "subsample":         trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree":  trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "reg_alpha":         trial.suggest_float("reg_alpha", 0.0, 2.0),
            "reg_lambda":        trial.suggest_float("reg_lambda", 0.5, 3.0),
            "min_child_weight":  trial.suggest_int("min_child_weight", 1, 10),
            "use_label_encoder": False,
            "eval_metric":       "mlogloss",
            "random_state":      42,
            "n_jobs":            -1,
        }
        model = XGBClassifier(**params)
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1)
        return scores.mean()

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
    print(f"✅ Best F1 (macro): {study.best_value:.4f}")
    return study.best_params

# ── Plots ─────────────────────────────────────────────────────────────────────
def plot_confusion_matrix(y_true, y_pred, labels, path):
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=labels, yticklabels=labels, ax=ax)
    ax.set_title("Confusion Matrix — HealthTrack AI")
    ax.set_ylabel("True Label")
    ax.set_xlabel("Predicted Label")
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()

def plot_feature_importance(model, feature_names, path):
    importances = model.feature_importances_
    idx = np.argsort(importances)[::-1]
    fig, ax = plt.subplots(figsize=(10, 6))
    colors = plt.cm.viridis(np.linspace(0.2, 0.8, len(importances)))
    ax.bar(range(len(importances)), importances[idx], color=colors)
    ax.set_xticks(range(len(importances)))
    ax.set_xticklabels([feature_names[i] for i in idx], rotation=45, ha="right", fontsize=9)
    ax.set_title("Feature Importance — HealthTrack AI")
    ax.set_ylabel("Importance Score")
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()

def plot_shap(model, X_sample, feature_names, path):
    explainer  = shap.TreeExplainer(model)
    shap_vals  = explainer.shap_values(X_sample)
    fig, ax    = plt.subplots(figsize=(10, 6))
    shap.summary_plot(shap_vals, X_sample, feature_names=feature_names,
                      plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()

# ── Main Training ─────────────────────────────────────────────────────────────
def train():
    mlflow.set_tracking_uri(MLFLOW_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)

    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Balance classes with SMOTE
    sm            = SMOTE(random_state=42)
    X_res, y_res  = sm.fit_resample(X_train, y_train)
    print(f"📊 After SMOTE: {len(X_res):,} training samples")

    # Optimize hyperparameters
    best_params = optimize_hyperparams(X_res, y_res, n_trials=25)

    with mlflow.start_run(run_name=f"XGBoost_{datetime.now().strftime('%Y%m%d_%H%M')}") as run:
        run_id = run.info.run_id
        print(f"\n🚀 MLflow Run ID: {run_id}")

        # ── Log params ──────────────────────────────────────────────────────
        mlflow.log_params(best_params)
        mlflow.log_param("n_samples_train", len(X_res))
        mlflow.log_param("n_samples_test",  len(X_test))
        mlflow.log_param("smote_applied",   True)
        mlflow.log_param("features",        FEATURES)
        mlflow.log_param("n_classes",       y.nunique())

        # ── Train ────────────────────────────────────────────────────────────
        model = XGBClassifier(
            **best_params,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(
            X_res, y_res,
            eval_set=[(X_test, y_test)],
            verbose=False,
        )

        # ── Evaluate ─────────────────────────────────────────────────────────
        y_pred     = model.predict(X_test)
        y_prob     = model.predict_proba(X_test)
        accuracy   = accuracy_score(y_test, y_pred)
        f1_macro   = f1_score(y_test, y_pred, average="macro")
        f1_weighted= f1_score(y_test, y_pred, average="weighted")
        roc_auc    = roc_auc_score(y_test, y_prob, multi_class="ovr", average="macro")

        print(f"\n📈 Results:")
        print(f"   Accuracy   : {accuracy:.4f}")
        print(f"   F1 Macro   : {f1_macro:.4f}")
        print(f"   F1 Weighted: {f1_weighted:.4f}")
        print(f"   ROC AUC    : {roc_auc:.4f}")
        print(f"\n{classification_report(y_test, y_pred, target_names=list(LABEL_MAP.values()))}")

        # ── Log metrics ──────────────────────────────────────────────────────
        mlflow.log_metric("accuracy",    accuracy)
        mlflow.log_metric("f1_macro",    f1_macro)
        mlflow.log_metric("f1_weighted", f1_weighted)
        mlflow.log_metric("roc_auc",     roc_auc)

        # ── Quality Gate ─────────────────────────────────────────────────────
        if f1_macro < MIN_F1:
            print(f"❌ Quality gate failed: F1={f1_macro:.4f} < {MIN_F1}")
            mlflow.log_param("quality_gate", "FAILED")
            return

        mlflow.log_param("quality_gate", "PASSED")

        # ── Plots → MLflow ───────────────────────────────────────────────────
        cm_path  = REPORTS_DIR / "confusion_matrix.png"
        fi_path  = REPORTS_DIR / "feature_importance.png"
        sh_path  = REPORTS_DIR / "shap_summary.png"
        plot_confusion_matrix(y_test, y_pred, list(LABEL_MAP.values()), cm_path)
        plot_feature_importance(model, FEATURES, fi_path)
        plot_shap(model, X_test.sample(200, random_state=42), FEATURES, sh_path)
        mlflow.log_artifact(str(cm_path))
        mlflow.log_artifact(str(fi_path))
        mlflow.log_artifact(str(sh_path))

        # ── Log model ────────────────────────────────────────────────────────
        mlflow.xgboost.log_model(model, "model")
        model.save_model(str(MODELS_DIR / "healthtrack_model.json"))

        # ── Save metadata for FastAPI ─────────────────────────────────────────
        meta = {
            "run_id":       run_id,
            "features":     FEATURES,
            "label_map":    LABEL_MAP,
            "f1_macro":     round(f1_macro, 4),
            "roc_auc":      round(roc_auc, 4),
            "trained_at":   datetime.now().isoformat(),
        }
        meta_path = MODELS_DIR / "model_meta.json"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)
        mlflow.log_artifact(str(meta_path))

        # ── Register in MLflow Model Registry ────────────────────────────────
        model_uri = f"runs:/{run_id}/model"
        mv = mlflow.register_model(model_uri, MODEL_NAME)
        client = mlflow.MlflowClient(MLFLOW_URI)
        client.transition_model_version_stage(
            name=MODEL_NAME, version=mv.version, stage="Production"
        )
        print(f"\n✅ Model v{mv.version} → Production")
        print(f"   MLflow UI: mlflow ui --backend-store-uri {MLFLOW_URI}")

if __name__ == "__main__":
    train()
