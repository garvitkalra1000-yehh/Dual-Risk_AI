from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
)

from xgboost import XGBClassifier


# ============================================================
# 1. PROJECT PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    ROOT
    / "data"
    / "processed"
    / "student_features_enhanced.csv"
)

MODEL_DIR = ROOT / "models"
OUTPUT_DIR = ROOT / "outputs"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# 2. SETTINGS
# ============================================================

RANDOM_STATE = 42
TEST_SIZE = 0.20


# ============================================================
# 3. LOAD DATA
# ============================================================

print("=" * 70)
print("DUALRISK AI - MODEL TRAINING")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)


# ============================================================
# 4. USE ONLY HISTORICAL STUDENTS
# ============================================================

historical = df[
    df["is_historical"] == 1
].copy()

print(
    "Historical students:",
    len(historical)
)


# ============================================================
# 5. COLUMNS THAT MUST NOT ENTER THE MODEL
# ============================================================

DROP_COLUMNS = [
    "student_id",
    "is_historical",
    "academic_risk_label",
    "placement_risk_label",
]


# ============================================================
# 6. PREPROCESSOR
# ============================================================

def build_preprocessor(X):

    numeric_features = X.select_dtypes(
        include=["int64", "float64"]
    ).columns.tolist()

    categorical_features = X.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()

    print(
        "\nNumerical features:",
        len(numeric_features)
    )

    print(
        "Categorical features:",
        len(categorical_features)
    )

    # --------------------------------------------------------
    # Numerical preprocessing
    # --------------------------------------------------------

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                )
            ),
            (
                "scaler",
                StandardScaler()
            )
        ]
    )

    # --------------------------------------------------------
    # Categorical preprocessing
    # --------------------------------------------------------

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                )
            ),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore"
                )
            )
        ]
    )

    # --------------------------------------------------------
    # Combine both
    # --------------------------------------------------------

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                numeric_features
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_features
            )
        ]
    )

    return preprocessor


# ============================================================
# 7. MODEL EVALUATION
# ============================================================

def evaluate_model(
    model,
    X_test,
    y_test,
    model_name
):

    # Probability of class 1
    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    # Standard threshold
    predictions = (
        probabilities >= 0.50
    ).astype(int)

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities
    )

    matrix = confusion_matrix(
        y_test,
        predictions
    )

    # --------------------------------------------------------
    # Print results
    # --------------------------------------------------------

    print("\n")
    print("-" * 70)
    print(model_name)
    print("-" * 70)

    print(
        f"Accuracy  : {accuracy:.4f}"
    )

    print(
        f"Precision : {precision:.4f}"
    )

    print(
        f"Recall    : {recall:.4f}"
    )

    print(
        f"ROC-AUC   : {roc_auc:.4f}"
    )

    print(
        f"PR-AUC    : {pr_auc:.4f}"
    )

    print("\nConfusion Matrix:")

    print(matrix)

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "confusion_matrix": matrix.tolist()
    }


# ============================================================
# 8. TRAIN ONE RISK MODEL
# ============================================================

def train_risk_model(
    target,
    risk_name
):

    print("\n")
    print("=" * 70)
    print(f"TRAINING {risk_name.upper()}")
    print("=" * 70)

    # --------------------------------------------------------
    # Features
    # --------------------------------------------------------

    X = historical.drop(
        columns=DROP_COLUMNS
    )

    # --------------------------------------------------------
    # Target
    # --------------------------------------------------------

    y = historical[target].astype(int)

    print("\nTarget distribution:")

    print(
        y.value_counts()
    )

    # --------------------------------------------------------
    # Train/Test split
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y
    )

    print(
        "\nTraining samples:",
        len(X_train)
    )

    print(
        "Testing samples:",
        len(X_test)
    )

    # ========================================================
    # LOGISTIC REGRESSION
    # ========================================================

    print("\nTraining Logistic Regression...")

    logistic_preprocessor = build_preprocessor(
        X_train
    )

    logistic_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                logistic_preprocessor
            ),
            (
                "model",
                LogisticRegression(
                    max_iter=2000,
                    random_state=RANDOM_STATE
                )
            )
        ]
    )

    logistic_pipeline.fit(
        X_train,
        y_train
    )

    logistic_metrics = evaluate_model(
        logistic_pipeline,
        X_test,
        y_test,
        f"{risk_name} - Logistic Regression"
    )

    # ========================================================
    # XGBOOST
    # ========================================================

    print("\nTraining XGBoost...")

    xgb_preprocessor = build_preprocessor(
        X_train
    )

    xgb_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                xgb_preprocessor
            ),
            (
                "model",
                XGBClassifier(
                    n_estimators=250,
                    max_depth=4,
                    learning_rate=0.05,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    random_state=RANDOM_STATE,
                    n_jobs=-1
                )
            )
        ]
    )

    xgb_pipeline.fit(
        X_train,
        y_train
    )

    xgb_metrics = evaluate_model(
        xgb_pipeline,
        X_test,
        y_test,
        f"{risk_name} - XGBoost"
    )

    # ========================================================
    # SELECT BEST MODEL
    # ========================================================

    if (
        xgb_metrics["roc_auc"]
        >=
        logistic_metrics["roc_auc"]
    ):

        best_model = xgb_pipeline
        best_name = "XGBoost"
        best_metrics = xgb_metrics

    else:

        best_model = logistic_pipeline
        best_name = "Logistic Regression"
        best_metrics = logistic_metrics

    # ========================================================
    # BEST MODEL
    # ========================================================

    print("\n")
    print("=" * 70)
    print(f"BEST MODEL FOR {risk_name.upper()}")
    print("=" * 70)

    print(
        "Model:",
        best_name
    )

    print(
        f"ROC-AUC: {best_metrics['roc_auc']:.4f}"
    )

    print(
        f"PR-AUC: {best_metrics['pr_auc']:.4f}"
    )

    print(
        f"Recall: {best_metrics['recall']:.4f}"
    )

    # ========================================================
    # SAVE MODEL
    # ========================================================

    model_filename = (
        risk_name
        .lower()
        .replace(" ", "_")
        + "_model.joblib"
    )

    model_path = (
        MODEL_DIR /
        model_filename
    )

    joblib.dump(
        best_model,
        model_path
    )

    print(
        "\nModel saved:",
        model_path
    )

    # ========================================================
    # SAVE METRICS
    # ========================================================

    results = {
        "risk_type": risk_name,
        "best_model": best_name,
        "best_metrics": best_metrics,
        "logistic_regression": logistic_metrics,
        "xgboost": xgb_metrics
    }

    metrics_filename = (
        risk_name
        .lower()
        .replace(" ", "_")
        + "_metrics.json"
    )

    metrics_path = (
        OUTPUT_DIR /
        metrics_filename
    )

    with open(
        metrics_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            results,
            file,
            indent=4
        )

    print(
        "Metrics saved:",
        metrics_path
    )

    return best_model, results


# ============================================================
# 9. TRAIN ACADEMIC RISK MODEL
# ============================================================

academic_model, academic_results = train_risk_model(
    target="academic_risk_label",
    risk_name="academic_risk"
)


# ============================================================
# 10. TRAIN PLACEMENT RISK MODEL
# ============================================================

placement_model, placement_results = train_risk_model(
    target="placement_risk_label",
    risk_name="placement_risk"
)


# ============================================================
# 11. SAVE COMBINED RESULTS
# ============================================================

all_results = {
    "academic_risk": academic_results,
    "placement_risk": placement_results
}

combined_path = (
    OUTPUT_DIR /
    "model_metrics.json"
)

with open(
    combined_path,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        all_results,
        file,
        indent=4
    )


# ============================================================
# 12. COMPLETE
# ============================================================

print("\n")
print("=" * 70)
print("MODEL TRAINING COMPLETE")
print("=" * 70)

print(
    "\nModels directory:",
    MODEL_DIR
)

print(
    "Metrics directory:",
    OUTPUT_DIR
)

print(
    "\nAcademic model:",
    MODEL_DIR / "academic_risk_model.joblib"
)

print(
    "Placement model:",
    MODEL_DIR / "placement_risk_model.joblib"
)

print(
    "\nCombined metrics:",
    combined_path
)