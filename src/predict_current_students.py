import pandas as pd
import joblib
from pathlib import Path

print("=" * 70)
print("DUALRISK AI - CURRENT STUDENT RISK PREDICTION")
print("=" * 70)

# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------
DATA_PATH = Path("data/processed/student_features_enhanced.csv")
MODELS_DIR = Path("models")
OUTPUT_DIR = Path("outputs")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Locked intervention thresholds
ACADEMIC_THRESHOLD = 0.30
PLACEMENT_THRESHOLD = 0.20

# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------
print("\nLoading feature dataset...")

df = pd.read_csv(DATA_PATH)

# Current cohort only
current = df[df["is_historical"] == 0].copy()

print(f"Total students: {len(df)}")
print(f"Current students: {len(current)}")

# ---------------------------------------------------------
# LOAD MODELS
# ---------------------------------------------------------
print("\nLoading trained models...")

academic_model = joblib.load(
    MODELS_DIR / "academic_risk_model.joblib"
)

placement_model = joblib.load(
    MODELS_DIR / "placement_risk_model.joblib"
)

print("[OK] Academic model loaded")
print("[OK] Placement model loaded")

# ---------------------------------------------------------
# PREPARE FEATURES
# ---------------------------------------------------------
DROP_COLUMNS = [
    "student_id",
    "is_historical",
    "academic_risk_label",
    "placement_risk_label"
]

X_current = current.drop(
    columns=DROP_COLUMNS,
    errors="ignore"
)

# ---------------------------------------------------------
# ACADEMIC RISK
# ---------------------------------------------------------
print("\nCalculating Academic Risk...")

academic_probability = academic_model.predict_proba(
    X_current
)[:, 1]

current["academic_risk_probability"] = academic_probability

current["academic_risk_label"] = (
    academic_probability >= ACADEMIC_THRESHOLD
).astype(int)

current["academic_risk_tier"] = pd.cut(
    academic_probability,
    bins=[-0.01, 0.30, 0.60, 1.0],
    labels=["Low", "Medium", "High"]
)

# ---------------------------------------------------------
# PLACEMENT RISK
# ---------------------------------------------------------
print("Calculating Placement Risk...")

placement_probability = placement_model.predict_proba(
    X_current
)[:, 1]

current["placement_risk_probability"] = placement_probability

current["placement_risk_label"] = (
    placement_probability >= PLACEMENT_THRESHOLD
).astype(int)

current["placement_risk_tier"] = pd.cut(
    placement_probability,
    bins=[-0.01, 0.20, 0.50, 1.0],
    labels=["Low", "Medium", "High"]
)

# ---------------------------------------------------------
# RISK TIER COUNTS
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("RISK SUMMARY")
print("=" * 70)

print("\nAcademic Risk:")
print(
    current["academic_risk_tier"]
    .value_counts()
    .sort_index()
)

print("\nPlacement Risk:")
print(
    current["placement_risk_tier"]
    .value_counts()
    .sort_index()
)

# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------
OUTPUT_COLUMNS = [
    "student_id",
    "academic_risk_probability",
    "academic_risk_label",
    "academic_risk_tier",
    "placement_risk_probability",
    "placement_risk_label",
    "placement_risk_tier"
]

predictions = current[OUTPUT_COLUMNS].copy()

OUTPUT_PATH = OUTPUT_DIR / "current_student_predictions.csv"

predictions.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\n" + "=" * 70)
print("PREDICTION COMPLETE")
print("=" * 70)

print(f"\nPredictions saved to:")
print(OUTPUT_PATH)

print(f"\nStudents processed: {len(predictions)}")

print(
    f"Academic flagged: "
    f"{predictions['academic_risk_label'].sum()}"
)

print(
    f"Placement flagged: "
    f"{predictions['placement_risk_label'].sum()}"
)

print("\nSample predictions:")
print(predictions.head(10).to_string(index=False))
