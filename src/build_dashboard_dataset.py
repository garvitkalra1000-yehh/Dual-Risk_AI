import pandas as pd
from pathlib import Path

print("=" * 70)
print("DUALRISK AI - BUILD DASHBOARD DATASET")
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

PRIORITY_PATH = Path(
    "outputs/student_priority_scores.csv"
)

SHAP_PATH = Path(
    "outputs/student_shap_summary.csv"
)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------
print("\nLoading datasets...")

features = pd.read_csv(FEATURE_PATH)
scores = pd.read_csv(SCORE_PATH)
priority = pd.read_csv(PRIORITY_PATH)
shap = pd.read_csv(SHAP_PATH)

# Current students only
features = features[
    features["is_historical"] == 0
].copy()

print(f"Current students: {len(features)}")

# ---------------------------------------------------------
# SELECT STUDENT PROFILE FEATURES
# ---------------------------------------------------------
profile_columns = [
    "student_id",
    "department",
    "semester",

    # Academic
    "academic_cgpa_current",
    "academic_backlogs_current",

    # Attendance
    "attendance_overall_current",
    "attendance_subject_attendance_current",

    # LMS
    "lms_assignment_completion_pct_current",
    "lms_course_completion_pct_current",
    "lms_login_frequency_current",

    # Placement
    "placement_coding_score_current",
    "placement_mock_interview_score_current",
    "placement_aptitude_score_current",

    # Skills
    "skills_tech_skills_score_current",
    "skills_soft_skills_score_current",

    # Engagement
    "engagement_events_attended_current",
    "engagement_club_participations_current",
    "engagement_hackathons_attended_current",
    "engagement_certifications_count_current",

    # Feedback
    "feedback_satisfaction_score_current",
    "feedback_faculty_rating_current"
]

# Keep only columns that actually exist
profile_columns = [
    col for col in profile_columns
    if col in features.columns
]

profile = features[profile_columns].copy()

print(
    f"Profile columns included: "
    f"{len(profile_columns)}"
)

# ---------------------------------------------------------
# SUCCESS + RISK DATA
# ---------------------------------------------------------
score_columns = [
    "student_id",
    "success_score",
    "success_score_confidence",
    "success_tier",
    "success_score_status",
    "academic_risk_probability",
    "academic_risk_label",
    "academic_risk_tier",
    "placement_risk_probability",
    "placement_risk_label",
    "placement_risk_tier"
]

scores = scores[
    [
        col for col in score_columns
        if col in scores.columns
    ]
]

# ---------------------------------------------------------
# PRIORITY DATA
# ---------------------------------------------------------
priority_columns = [
    "student_id",
    "academic_priority_score",
    "academic_trend",
    "placement_priority_score",
    "placement_trend",
    "priority_score",
    "priority_domain",
    "priority_tier",
    "intervention_required",
    "recommended_action"
]

priority = priority[
    [
        col for col in priority_columns
        if col in priority.columns
    ]
]

# ---------------------------------------------------------
# SHAP DATA
# ---------------------------------------------------------
shap_columns = [
    "student_id",

    "academic_factor_1",
    "academic_shap_1",
    "academic_direction_1",

    "academic_factor_2",
    "academic_shap_2",
    "academic_direction_2",

    "academic_factor_3",
    "academic_shap_3",
    "academic_direction_3",

    "academic_factor_4",
    "academic_shap_4",
    "academic_direction_4",

    "academic_factor_5",
    "academic_shap_5",
    "academic_direction_5",

    "placement_factor_1",
    "placement_shap_1",
    "placement_direction_1",

    "placement_factor_2",
    "placement_shap_2",
    "placement_direction_2",

    "placement_factor_3",
    "placement_shap_3",
    "placement_direction_3",

    "placement_factor_4",
    "placement_shap_4",
    "placement_direction_4",

    "placement_factor_5",
    "placement_shap_5",
    "placement_direction_5"
]

shap = shap[
    [
        col for col in shap_columns
        if col in shap.columns
    ]
]

# ---------------------------------------------------------
# MERGE EVERYTHING
# ---------------------------------------------------------
print("\nMerging datasets...")

dashboard = profile.merge(
    scores,
    on="student_id",
    how="left"
)

dashboard = dashboard.merge(
    priority,
    on="student_id",
    how="left"
)

dashboard = dashboard.merge(
    shap,
    on="student_id",
    how="left"
)

# Remove accidental duplicate rows
dashboard = dashboard.drop_duplicates(
    subset=["student_id"]
)

# ---------------------------------------------------------
# CLEAN NUMERIC VALUES
# ---------------------------------------------------------
numeric_columns = dashboard.select_dtypes(
    include="number"
).columns

dashboard[numeric_columns] = dashboard[
    numeric_columns
].round(3)

# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------
OUTPUT_PATH = (
    OUTPUT_DIR /
    "dashboard_students.csv"
)

dashboard.to_csv(
    OUTPUT_PATH,
    index=False
)

# ---------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("DASHBOARD DATASET SUMMARY")
print("=" * 70)

print(
    f"\nRows: {len(dashboard)}"
)

print(
    f"Columns: {len(dashboard.columns)}"
)

print(
    f"Unique students: "
    f"{dashboard['student_id'].nunique()}"
)

print("\nMissing values:")
print(
    dashboard.isna()
    .sum()
    .sort_values(ascending=False)
    .head(10)
)

print("\nSample:")
print(
    dashboard[
        [
            "student_id",
            "success_score",
            "academic_risk_probability",
            "placement_risk_probability",
            "priority_score",
            "priority_domain",
            "intervention_required"
        ]
    ]
    .head(10)
    .to_string(index=False)
)

print("\n" + "=" * 70)
print("DASHBOARD DATASET COMPLETE")
print("=" * 70)

print(
    f"\nSaved to:\n{OUTPUT_PATH}"
)