from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score
)


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    ROOT
    / "data"
    / "processed"
    / "student_features_enhanced.csv"
)

MODEL_DIR = ROOT / "models"


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATA_PATH)

historical = df[
    df["is_historical"] == 1
].copy()


# ============================================================
# SAME FEATURES USED DURING TRAINING
# ============================================================

DROP_COLUMNS = [
    "student_id",
    "is_historical",
    "academic_risk_label",
    "placement_risk_label"
]

X = historical.drop(
    columns=DROP_COLUMNS
)


# ============================================================
# FUNCTION
# ============================================================

def analyze_thresholds(
    target,
    model_filename,
    risk_name
):

    print("\n")
    print("=" * 70)
    print(f"THRESHOLD ANALYSIS - {risk_name.upper()}")
    print("=" * 70)

    y = historical[target].astype(int)

    # --------------------------------------------------------
    # Same split as training
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    # --------------------------------------------------------
    # Load saved model
    # --------------------------------------------------------

    model_path = MODEL_DIR / model_filename

    model = joblib.load(model_path)

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    print(
        "\nROC-AUC:",
        round(
            roc_auc_score(
                y_test,
                probabilities
            ),
            4
        )
    )

    # --------------------------------------------------------
    # Thresholds
    # --------------------------------------------------------

    thresholds = [
        0.50,
        0.45,
        0.40,
        0.35,
        0.30,
        0.25,
        0.20
    ]

    results = []

    for threshold in thresholds:

        predictions = (
            probabilities >= threshold
        ).astype(int)

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

        f1 = f1_score(
            y_test,
            predictions,
            zero_division=0
        )

        matrix = confusion_matrix(
            y_test,
            predictions
        )

        flagged = predictions.sum()

        results.append({
            "threshold": threshold,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "flagged": flagged,
            "confusion_matrix": matrix.tolist()
        })

    # --------------------------------------------------------
    # Display
    # --------------------------------------------------------

    results_df = pd.DataFrame(results)

    print("\nThreshold comparison:\n")

    print(
        results_df[
            [
                "threshold",
                "precision",
                "recall",
                "f1",
                "flagged"
            ]
        ].to_string(
            index=False
        )
    )

    # --------------------------------------------------------
    # Best threshold for recall
    # --------------------------------------------------------

    best_recall = max(
        results,
        key=lambda x: (
            x["recall"],
            x["precision"]
        )
    )

    print("\n")
    print("-" * 70)
    print("BEST RECALL THRESHOLD")
    print("-" * 70)

    print(
        "Threshold:",
        best_recall["threshold"]
    )

    print(
        "Precision:",
        round(
            best_recall["precision"],
            4
        )
    )

    print(
        "Recall:",
        round(
            best_recall["recall"],
            4
        )
    )

    print(
        "F1:",
        round(
            best_recall["f1"],
            4
        )
    )

    print(
        "Students flagged:",
        best_recall["flagged"]
    )

    print(
        "Confusion matrix:",
        best_recall["confusion_matrix"]
    )


# ============================================================
# ACADEMIC
# ============================================================

analyze_thresholds(
    target="academic_risk_label",
    model_filename="academic_risk_model.joblib",
    risk_name="academic risk"
)


# ============================================================
# PLACEMENT
# ============================================================

analyze_thresholds(
    target="placement_risk_label",
    model_filename="placement_risk_model.joblib",
    risk_name="placement risk"
)


print("\n")
print("=" * 70)
print("THRESHOLD ANALYSIS COMPLETE")
print("=" * 70)