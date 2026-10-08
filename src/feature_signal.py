from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.metrics import roc_auc_score


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    ROOT
    / "data"
    / "processed"
    / "student_features.csv"
)


# ============================================================
# LOAD
# ============================================================

df = pd.read_csv(DATA_PATH)

# Only historical students
df = df[
    df["is_historical"] == 1
].copy()


# ============================================================
# TARGETS
# ============================================================

TARGETS = [
    "academic_risk_label",
    "placement_risk_label"
]


# ============================================================
# FEATURES
# ============================================================

DROP_COLUMNS = [
    "student_id",
    "is_historical",
    "academic_risk_label",
    "placement_risk_label",
    "department",
    "semester"
]

features = [
    col
    for col in df.columns
    if col not in DROP_COLUMNS
]


# ============================================================
# FUNCTION
# ============================================================

def analyze_target(target):

    print("\n")
    print("=" * 70)
    print(f"FEATURE SIGNAL: {target}")
    print("=" * 70)

    y = df[target].astype(int)

    results = []

    for feature in features:

        x = pd.to_numeric(
            df[feature],
            errors="coerce"
        )

        valid = (
            x.notna()
            &
            y.notna()
        )

        if valid.sum() < 50:
            continue

        x_valid = x[valid]
        y_valid = y[valid]

        # Need variation
        if x_valid.nunique() < 2:
            continue

        try:

            auc = roc_auc_score(
                y_valid,
                x_valid
            )

            # AUC below 0.5 can be inverted
            strength = max(
                auc,
                1 - auc
            )

            results.append({
                "feature": feature,
                "auc": auc,
                "signal_strength": strength,
                "risk_mean": x_valid[
                    y_valid == 1
                ].mean(),
                "safe_mean": x_valid[
                    y_valid == 0
                ].mean()
            })

        except Exception:
            pass


    results_df = pd.DataFrame(
        results
    )

    if results_df.empty:
        print("No usable numerical features found.")
        return

    results_df = results_df.sort_values(
        "signal_strength",
        ascending=False
    )

    print("\nTOP 20 FEATURES:")
    print(
        results_df.head(20).to_string(
            index=False
        )
    )


    # --------------------------------------------------------
    # Correlation
    # --------------------------------------------------------

    print("\nTOP FEATURES BY ABSOLUTE CORRELATION:")

    numeric = df[
        features + [target]
    ].select_dtypes(
        include=np.number
    )

    correlations = (
        numeric.corr()[target]
        .drop(target)
        .abs()
        .sort_values(
            ascending=False
        )
    )

    print(
        correlations.head(20)
    )


# ============================================================
# RUN ANALYSIS
# ============================================================

analyze_target(
    "academic_risk_label"
)

analyze_target(
    "placement_risk_label"
)

print("\n")
print("=" * 70)
print("FEATURE SIGNAL ANALYSIS COMPLETE")
print("=" * 70)