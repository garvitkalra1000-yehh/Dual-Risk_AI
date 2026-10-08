import pandas as pd
import numpy as np
import joblib
import shap
from pathlib import Path

print("=" * 70)
print("DUALRISK AI - SHAP EXPLANATIONS")
print("=" * 70)

# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------
DATA_PATH = Path(
    "data/processed/student_features_enhanced.csv"
)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ACADEMIC_MODEL_PATH = Path(
    "models/academic_risk_model.joblib"
)

PLACEMENT_MODEL_PATH = Path(
    "models/placement_risk_model.joblib"
)

# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------
print("\nLoading data...")

df = pd.read_csv(DATA_PATH)

current = df[
    df["is_historical"] == 0
].copy()

print(f"Current students: {len(current)}")

# ---------------------------------------------------------
# FEATURES
# ---------------------------------------------------------
DROP_COLUMNS = [
    "student_id",
    "is_historical",
    "academic_risk_label",
    "placement_risk_label"
]

X = current.drop(
    columns=DROP_COLUMNS,
    errors="ignore"
)

# ---------------------------------------------------------
# FUNCTION TO GENERATE SHAP
# ---------------------------------------------------------
def generate_explanations(
    model_path,
    X,
    student_ids,
    domain
):

    print("\n" + "-" * 70)
    print(f"GENERATING {domain.upper()} SHAP EXPLANATIONS")
    print("-" * 70)

    pipeline = joblib.load(model_path)

    preprocessor = pipeline.named_steps[
        "preprocessor"
    ]

    model = pipeline.named_steps[
        "model"
    ]

    # -----------------------------------------------------
    # TRANSFORM FEATURES
    # -----------------------------------------------------
    print("Transforming features...")

    X_transformed = preprocessor.transform(X)

    # Convert sparse matrix to dense if necessary
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()

    # -----------------------------------------------------
    # FEATURE NAMES
    # -----------------------------------------------------
    feature_names = (
        preprocessor
        .get_feature_names_out()
    )

    print(
        f"Transformed features: "
        f"{len(feature_names)}"
    )

    # -----------------------------------------------------
    # SHAP EXPLAINER
    # -----------------------------------------------------
    print("Creating SHAP explainer...")

    explainer = shap.LinearExplainer(
        model,
        X_transformed
    )

    print("Calculating SHAP values...")

    shap_values = explainer(
        X_transformed
    )

    values = shap_values.values

    # -----------------------------------------------------
    # HANDLE SHAP SHAPE
    # -----------------------------------------------------
    if len(values.shape) == 3:
        values = values[:, :, 1]

    # -----------------------------------------------------
    # TOP FEATURES PER STUDENT
    # -----------------------------------------------------
    results = []

    for i, student_id in enumerate(student_ids):

        student_values = values[i]

        # Largest absolute contributions
        top_indices = np.argsort(
            np.abs(student_values)
        )[::-1][:5]

        for rank, feature_index in enumerate(
            top_indices,
            start=1
        ):

            feature_name = feature_names[
                feature_index
            ]

            shap_value = student_values[
                feature_index
            ]

            results.append({
                "student_id": student_id,
                "domain": domain,
                "rank": rank,
                "feature": feature_name,
                "shap_value": round(
                    float(shap_value),
                    6
                ),
                "direction": (
                    "Increases Risk"
                    if shap_value > 0
                    else "Reduces Risk"
                )
            })

    return pd.DataFrame(results)


# ---------------------------------------------------------
# ACADEMIC SHAP
# ---------------------------------------------------------
academic_shap = generate_explanations(
    ACADEMIC_MODEL_PATH,
    X,
    current["student_id"].values,
    "Academic"
)

# ---------------------------------------------------------
# PLACEMENT SHAP
# ---------------------------------------------------------
placement_shap = generate_explanations(
    PLACEMENT_MODEL_PATH,
    X,
    current["student_id"].values,
    "Placement"
)

# ---------------------------------------------------------
# COMBINE
# ---------------------------------------------------------
all_shap = pd.concat(
    [
        academic_shap,
        placement_shap
    ],
    ignore_index=True
)

# ---------------------------------------------------------
# SAVE ALL SHAP VALUES
# ---------------------------------------------------------
all_path = (
    OUTPUT_DIR /
    "student_shap_explanations.csv"
)

all_shap.to_csv(
    all_path,
    index=False
)

# ---------------------------------------------------------
# CREATE WIDE FORMAT FOR DASHBOARD
# ---------------------------------------------------------
wide_rows = []

for student_id in current["student_id"]:

    row = {
        "student_id": student_id
    }

    for domain in [
        "Academic",
        "Placement"
    ]:

        subset = all_shap[
            (all_shap["student_id"] == student_id)
            &
            (all_shap["domain"] == domain)
        ].sort_values("rank")

        for _, item in subset.iterrows():

            rank = int(item["rank"])

            row[
                f"{domain.lower()}_factor_{rank}"
            ] = item["feature"]

            row[
                f"{domain.lower()}_shap_{rank}"
            ] = item["shap_value"]

            row[
                f"{domain.lower()}_direction_{rank}"
            ] = item["direction"]

    wide_rows.append(row)

wide = pd.DataFrame(wide_rows)

wide_path = (
    OUTPUT_DIR /
    "student_shap_summary.csv"
)

wide.to_csv(
    wide_path,
    index=False
)

# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("SHAP GENERATION COMPLETE")
print("=" * 70)

print(
    f"\nTotal SHAP records: "
    f"{len(all_shap)}"
)

print(
    f"Expected records: "
    f"{len(current) * 5 * 2}"
)

print("\nFiles saved:")

print(
    f"1. {all_path}"
)

print(
    f"2. {wide_path}"
)

# ---------------------------------------------------------
# SHOW EXAMPLE
# ---------------------------------------------------------
example_student = current[
    "student_id"
].iloc[0]

print(
    f"\nExample SHAP explanation "
    f"for {example_student}:"
)

print(
    all_shap[
        all_shap["student_id"]
        == example_student
    ].to_string(index=False)
)

print("\n" + "=" * 70)