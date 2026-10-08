import pandas as pd
import numpy as np
from pathlib import Path

print("=" * 70)
print("DUALRISK AI - PRIORITY SCORE & INTERVENTION WORKLIST")
print("=" * 70)

# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------
FEATURE_PATH = Path(
    "data/processed/student_features_enhanced.csv"
)

SCORE_PATH = Path(
    "outputs/student_success_scores.csv"
)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------
print("\nLoading data...")

features = pd.read_csv(FEATURE_PATH)
scores = pd.read_csv(SCORE_PATH)

# Current cohort only
current_features = features[
    features["is_historical"] == 0
].copy()

print(f"Current students: {len(current_features)}")

# ---------------------------------------------------------
# MERGE
# ---------------------------------------------------------
df = current_features.merge(
    scores,
    on="student_id",
    how="left",
    suffixes=("", "_score")
)

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def get_severity(row, domain):
    """
    Determine intervention severity from the student's
    current condition.
    """

    if domain == "academic":

        attendance = row.get(
            "attendance_overall_current",
            np.nan
        )

        backlogs = row.get(
            "academic_backlogs_current",
            np.nan
        )

        cgpa = row.get(
            "academic_cgpa_current",
            np.nan
        )

        # Critical condition
        if (
            (not pd.isna(attendance) and attendance < 75)
            or
            (not pd.isna(backlogs) and backlogs >= 2)
        ):
            return 1.0

        # Borderline condition
        if (
            (not pd.isna(attendance) and attendance < 80)
            or
            (not pd.isna(cgpa) and cgpa < 6.5)
        ):
            return 0.8

        return 0.6

    elif domain == "placement":

        coding = row.get(
            "placement_coding_current",
            np.nan
        )

        interview = row.get(
            "placement_mock_interview_current",
            np.nan
        )

        aptitude = row.get(
            "placement_aptitude_current",
            np.nan
        )

        technical = row.get(
            "skills_technical_current",
            np.nan
        )

        scores_available = [
            x for x in [
                coding,
                interview,
                aptitude,
                technical
            ]
            if not pd.isna(x)
        ]

        if not scores_available:
            return 0.6

        minimum_skill = min(scores_available)

        # Critical placement weakness
        if minimum_skill < 50:
            return 1.0

        # Borderline placement weakness
        if minimum_skill < 65:
            return 0.8

        return 0.6

    return 0.6


def get_trend_multiplier(row, domain):
    """
    Determine whether the student is improving,
    stable, or declining.
    """

    slopes = []

    if domain == "academic":

        for column in [
            "academic_cgpa_slope_3m",
            "attendance_overall_slope_3m",
            "lms_completion_rate_slope_3m"
        ]:
            if column in row.index:
                value = row[column]

                if not pd.isna(value):
                    slopes.append(value)

    elif domain == "placement":

        for column in [
            "placement_coding_slope_3m",
            "placement_mock_interview_slope_3m",
            "placement_aptitude_slope_3m",
            "skills_technical_slope_3m"
        ]:
            if column in row.index:
                value = row[column]

                if not pd.isna(value):
                    slopes.append(value)

    if not slopes:
        return 1.0, "Stable"

    average_slope = np.mean(slopes)

    # Declining
    if average_slope < -0.03:
        return 1.2, "Declining"

    # Improving
    if average_slope > 0.03:
        return 0.8, "Improving"

    return 1.0, "Stable"


# ---------------------------------------------------------
# ACADEMIC PRIORITY
# ---------------------------------------------------------
print("\nCalculating Academic Priority...")

df["academic_severity"] = df.apply(
    lambda row: get_severity(
        row,
        "academic"
    ),
    axis=1
)

academic_trend = df.apply(
    lambda row: get_trend_multiplier(
        row,
        "academic"
    ),
    axis=1
)

df["academic_trend_multiplier"] = academic_trend.apply(
    lambda x: x[0]
)

df["academic_trend"] = academic_trend.apply(
    lambda x: x[1]
)

df["academic_priority_score"] = (
    df["academic_risk_probability"]
    * 100
    * df["academic_severity"]
    * df["academic_trend_multiplier"]
)

df["academic_priority_score"] = (
    df["academic_priority_score"]
    .clip(upper=100)
    .round(2)
)


# ---------------------------------------------------------
# PLACEMENT PRIORITY
# ---------------------------------------------------------
print("Calculating Placement Priority...")

df["placement_severity"] = df.apply(
    lambda row: get_severity(
        row,
        "placement"
    ),
    axis=1
)

placement_trend = df.apply(
    lambda row: get_trend_multiplier(
        row,
        "placement"
    ),
    axis=1
)

df["placement_trend_multiplier"] = placement_trend.apply(
    lambda x: x[0]
)

df["placement_trend"] = placement_trend.apply(
    lambda x: x[1]
)

df["placement_priority_score"] = (
    df["placement_risk_probability"]
    * 100
    * df["placement_severity"]
    * df["placement_trend_multiplier"]
)

df["placement_priority_score"] = (
    df["placement_priority_score"]
    .clip(upper=100)
    .round(2)
)


# ---------------------------------------------------------
# OVERALL PRIORITY
# ---------------------------------------------------------
print("Calculating Overall Priority...")

df["priority_score"] = df[
    [
        "academic_priority_score",
        "placement_priority_score"
    ]
].max(axis=1)

# Determine which domain is driving priority
df["priority_domain"] = np.where(
    df["academic_priority_score"]
    >=
    df["placement_priority_score"],
    "Academic",
    "Placement"
)


# ---------------------------------------------------------
# PRIORITY TIER
# ---------------------------------------------------------
df["priority_tier"] = pd.cut(
    df["priority_score"],
    bins=[-0.01, 30, 60, 100],
    labels=[
        "Low",
        "Medium",
        "High"
    ]
)


# ---------------------------------------------------------
# INTERVENTION FLAG
# ---------------------------------------------------------
ACADEMIC_THRESHOLD = 0.30
PLACEMENT_THRESHOLD = 0.20

df["intervention_required"] = np.where(
    (
        (df["academic_risk_probability"] >= ACADEMIC_THRESHOLD)
        |
        (df["placement_risk_probability"] >= PLACEMENT_THRESHOLD)
    ),
    "Yes",
    "No"
)


# ---------------------------------------------------------
# RECOMMENDATION / PLAYBOOK
# ---------------------------------------------------------
def generate_playbook(row):

    recommendations = []

    attendance = row.get(
        "attendance_overall_current",
        np.nan
    )

    cgpa = row.get(
        "academic_cgpa_current",
        np.nan
    )

    lms = row.get(
        "lms_completion_rate_current",
        np.nan
    )

    coding = row.get(
        "placement_coding_current",
        np.nan
    )

    interview = row.get(
        "placement_mock_interview_current",
        np.nan
    )

    if not pd.isna(attendance):

        if attendance < 65:
            recommendations.append(
                "Attendance recovery plan - Faculty - 7d"
            )

        elif attendance < 75:
            recommendations.append(
                "Attendance improvement plan - Faculty - 7d"
            )

    if not pd.isna(cgpa):

        if cgpa < 6.5:
            recommendations.append(
                "Academic mentoring - Faculty - 7d"
            )

    if not pd.isna(lms):

        if lms < 50:
            recommendations.append(
                "LMS engagement plan - Mentor - 7d"
            )

    if not pd.isna(coding):

        if coding < 50:
            recommendations.append(
                "Coding improvement program - Placement Cell - 14d"
            )

    if not pd.isna(interview):

        if interview < 50:
            recommendations.append(
                "Mock interview program - Placement Cell - 14d"
            )

    if not recommendations:

        if row["priority_score"] >= 60:
            recommendations.append(
                "Advisor review recommended - 7d"
            )

        elif row["priority_score"] >= 30:
            recommendations.append(
                "Monitor student - 14d"
            )

        else:
            recommendations.append(
                "No immediate intervention"
            )

    return " | ".join(recommendations)


print("Generating intervention recommendations...")

df["recommended_action"] = df.apply(
    generate_playbook,
    axis=1
)


# ---------------------------------------------------------
# WORKLIST
# ---------------------------------------------------------
worklist_columns = [
    "student_id",

    "success_score",
    "success_tier",
    "success_score_confidence",

    "academic_risk_probability",
    "academic_risk_tier",
    "academic_priority_score",
    "academic_trend",

    "placement_risk_probability",
    "placement_risk_tier",
    "placement_priority_score",
    "placement_trend",

    "priority_score",
    "priority_domain",
    "priority_tier",
    "intervention_required",

    "recommended_action"
]

worklist = df[worklist_columns].copy()

worklist = worklist.sort_values(
    "priority_score",
    ascending=False
)

# ---------------------------------------------------------
# SAVE FULL PRIORITY DATA
# ---------------------------------------------------------
FULL_OUTPUT = OUTPUT_DIR / "student_priority_scores.csv"

worklist.to_csv(
    FULL_OUTPUT,
    index=False
)


# ---------------------------------------------------------
# SAVE TOP 25 WORKLIST
# ---------------------------------------------------------
TOP_OUTPUT = OUTPUT_DIR / "top_25_intervention_worklist.csv"

top_25 = worklist.head(25)

top_25.to_csv(
    TOP_OUTPUT,
    index=False
)


# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("PRIORITY SUMMARY")
print("=" * 70)

print("\nPriority tiers:")
print(
    worklist["priority_tier"]
    .value_counts()
    .sort_index()
)

print("\nIntervention required:")
print(
    worklist["intervention_required"]
    .value_counts()
)

print("\nPriority domain:")
print(
    worklist["priority_domain"]
    .value_counts()
)

print("\nTop 10 students:")
print(
    top_25.head(10).to_string(index=False)
)

print("\n" + "=" * 70)
print("PRIORITY CALCULATION COMPLETE")
print("=" * 70)

print(f"\nFull priority data:")
print(FULL_OUTPUT)

print(f"\nTop 25 intervention worklist:")
print(TOP_OUTPUT)