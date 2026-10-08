import pandas as pd
import numpy as np
from pathlib import Path

print("=" * 70)
print("DUALRISK AI - SUCCESS SCORE CALCULATION")
print("=" * 70)

# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "processed" / "student_features_enhanced.csv"
PREDICTION_PATH = ROOT / "outputs" / "current_student_predictions.csv"
OUTPUT_DIR = ROOT / "outputs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------
print("\nLoading data...")

df = pd.read_csv(DATA_PATH)
predictions = pd.read_csv(PREDICTION_PATH)

# Current cohort only
current = df[df["is_historical"] == 0].copy()

print(f"Current students: {len(current)}")

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def normalize(value, minimum, maximum):
    """
    Convert a value into 0-100.
    """
    if pd.isna(value):
        return np.nan

    value = max(minimum, min(maximum, value))

    return ((value - minimum) / (maximum - minimum)) * 100


def safe_mean(values):
    """
    Mean of available values.
    Returns NaN if nothing is available.
    """
    valid = [v for v in values if not pd.isna(v)]

    if not valid:
        return np.nan

    return np.mean(valid)


# ---------------------------------------------------------
# 1. ACADEMIC SCORE - 35%
# ---------------------------------------------------------
print("\nCalculating Academic Score...")

cgpa_score = current["academic_cgpa_current"].apply(
    lambda x: normalize(x, 0, 10)
)

backlog_score = current["academic_backlogs_current"].apply(
    lambda x: 100 - normalize(x, 0, 5)
)

academic_score = (
    0.70 * cgpa_score +
    0.30 * backlog_score
)

# ---------------------------------------------------------
# 2. ATTENDANCE SCORE - 20%
# ---------------------------------------------------------
print("Calculating Attendance Score...")

attendance_score = current[
    "attendance_overall_attendance_current"
].apply(
    lambda x: normalize(x, 0, 100)
)

# ---------------------------------------------------------
# 3. LMS SCORE - 15%
# ---------------------------------------------------------
print("Calculating LMS Score...")

lms_components = pd.DataFrame({
    "login": current["lms_logins_per_week_current"].apply(
        lambda x: normalize(x, 0, 20)
    ),
    "completion": current["lms_assignment_completion_pct_current"]
})

lms_score = lms_components.mean(axis=1, skipna=True)


# ---------------------------------------------------------
# 4. PLACEMENT READINESS - 15%
# ---------------------------------------------------------
print("Calculating Placement Readiness Score...")

placement_components = pd.DataFrame({
    "coding": current["placement_coding_score_current"],
    "interview": current["placement_mock_interview_score_current"],
    "aptitude": current["placement_aptitude_score_current"],
    "technical": current["skills_tech_skills_score_current"]
})

placement_score = placement_components.mean(
    axis=1,
    skipna=True
)


# ---------------------------------------------------------
# 5. ENGAGEMENT + SKILLS - 10%
# ---------------------------------------------------------
print("Calculating Engagement + Skills Score...")

# Normalize engagement strength against the observed
# 0-4.1 range in this dataset.
engagement_score = current[
    "engagement_strength"
].apply(
    lambda x: normalize(x, 0, 4.1)
)

soft_skill_score = current[
    "skills_soft_skills_score_current"
]

engagement_skills_score = pd.concat([
    engagement_score,
    soft_skill_score
], axis=1).mean(axis=1, skipna=True)


# ---------------------------------------------------------
# 6. FEEDBACK SCORE - 5%
# ---------------------------------------------------------
print("Calculating Feedback Score...")

feedback_components = pd.DataFrame({
    "satisfaction": current["feedback_satisfaction_score_current"].apply(
        lambda x: normalize(x, 0, 5)
    ),
    "faculty_rating": current["feedback_faculty_rating_current"].apply(
        lambda x: normalize(x, 0, 5)
    )
})

feedback_score = feedback_components.mean(
    axis=1,
    skipna=True
)


# ---------------------------------------------------------
# COMPONENT WEIGHTS
# ---------------------------------------------------------
WEIGHTS = {
    "academic": 35,
    "attendance": 20,
    "lms": 15,
    "placement": 15,
    "engagement_skills": 10,
    "feedback": 5
}


# ---------------------------------------------------------
# WEIGHTED SUCCESS SCORE WITH MISSING-DATA REWEIGHTING
# ---------------------------------------------------------
print("\nCalculating final Success Score...")

components = pd.DataFrame({
    "academic": academic_score,
    "attendance": attendance_score,
    "lms": lms_score,
    "placement": placement_score,
    "engagement_skills": engagement_skills_score,
    "feedback": feedback_score
})

weighted_values = pd.DataFrame(index=current.index)

for component, weight in WEIGHTS.items():
    weighted_values[component] = (
        components[component] * weight
    )

# Only count weights for components that are available
available_weights = pd.DataFrame(index=current.index)

for component, weight in WEIGHTS.items():
    available_weights[component] = (
        components[component].notna() * weight
    )

total_available_weight = available_weights.sum(axis=1)

total_score = weighted_values.sum(axis=1, skipna=True)

# Reweight available components to 100
success_score = np.where(
    total_available_weight > 0,
    total_score / total_available_weight,
    np.nan
)

current["success_score"] = success_score


# ---------------------------------------------------------
# CONFIDENCE SCORE
# ---------------------------------------------------------
current["success_score_confidence"] = (
    total_available_weight / 100
) * 100


# ---------------------------------------------------------
# SUCCESS SCORE TIER
# ---------------------------------------------------------
current["success_tier"] = pd.cut(
    current["success_score"],
    bins=[-np.inf, 50, 70, np.inf],
    labels=["Red", "Amber", "Green"],
    right=False
)


# ---------------------------------------------------------
# INSUFFICIENT DATA FLAG
# ---------------------------------------------------------
current["success_score_status"] = np.where(
    current["success_score_confidence"] < 50,
    "Insufficient Data",
    "Reliable"
)


# ---------------------------------------------------------
# MERGE RISK PREDICTIONS
# ---------------------------------------------------------
print("Merging ML risk predictions...")

result = current.merge(
    predictions,
    on="student_id",
    how="left",
    suffixes=("", "_prediction")
)

# The current cohort carries empty historical target columns. Remove those
# duplicates before selecting prediction labels from the merged result.
for column in [
    "academic_risk_label",
    "placement_risk_label",
]:
    prediction_column = f"{column}_prediction"
    if prediction_column in result.columns:
        result[column] = result[prediction_column]

result = result.drop(
    columns=[
        "academic_risk_label_prediction",
        "placement_risk_label_prediction",
    ],
    errors="ignore"
)

# ---------------------------------------------------------
# SELECT OUTPUT COLUMNS
# ---------------------------------------------------------
output_columns = [
    "student_id",

    # Success Score
    "success_score",
    "success_score_confidence",
    "success_tier",
    "success_score_status",

    # Academic risk
    "academic_risk_probability",
    "academic_risk_label",
    "academic_risk_tier",

    # Placement risk
    "placement_risk_probability",
    "placement_risk_label",
    "placement_risk_tier"
]

final_output = result[output_columns].copy()

# Round numeric values
final_output["success_score"] = final_output[
    "success_score"
].round(2)

final_output["success_score_confidence"] = final_output[
    "success_score_confidence"
].round(2)

final_output["academic_risk_probability"] = final_output[
    "academic_risk_probability"
].round(4)

final_output["placement_risk_probability"] = final_output[
    "placement_risk_probability"
].round(4)


# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------
OUTPUT_PATH = OUTPUT_DIR / "student_success_scores.csv"

final_output.to_csv(
    OUTPUT_PATH,
    index=False
)


# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("SUCCESS SCORE SUMMARY")
print("=" * 70)

print("\nSuccess Tier:")
print(
    final_output["success_tier"]
    .value_counts()
    .sort_index()
)

print("\nScore statistics:")
print(
    final_output["success_score"].describe()
)

print("\nConfidence statistics:")
print(
    final_output["success_score_confidence"].describe()
)

print("\nInsufficient data:")
print(
    (final_output["success_score_status"] == "Insufficient Data").sum()
)

print("\nSample:")
print(
    final_output.head(10).to_string(index=False)
)

print("\n" + "=" * 70)
print("SUCCESS SCORE CALCULATION COMPLETE")
print("=" * 70)

print(f"\nSaved to:")
print(OUTPUT_PATH)
