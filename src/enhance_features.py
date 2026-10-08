from pathlib import Path
import pandas as pd
import numpy as np


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = (
    ROOT
    / "data"
    / "processed"
    / "student_features.csv"
)

OUTPUT_PATH = (
    ROOT
    / "data"
    / "processed"
    / "student_features_enhanced.csv"
)


# ============================================================
# LOAD
# ============================================================

df = pd.read_csv(INPUT_PATH)

print("=" * 70)
print("DUALRISK AI - DOMAIN FEATURE ENGINEERING")
print("=" * 70)

print("\nOriginal shape:", df.shape)


# ============================================================
# HELPER
# ============================================================

def get_column(name):

    if name in df.columns:
        return df[name]

    return pd.Series(
        np.nan,
        index=df.index
    )


# ============================================================
# 1. ACADEMIC HEALTH
# ============================================================

cgpa = get_column(
    "academic_cgpa_current"
)

backlogs = get_column(
    "academic_backlogs_current"
)

internal_marks = get_column(
    "academic_internal_marks_current"
)

subject_score = get_column(
    "academic_subject_score_avg_current"
)


df["academic_health_score"] = (
    0.45 * (cgpa / 10)
    +
    0.25 * (
        1 - np.minimum(backlogs, 5) / 5
    )
    +
    0.15 * (internal_marks / 100)
    +
    0.15 * (subject_score / 100)
)


# ============================================================
# 2. ATTENDANCE + LMS
# ============================================================

attendance = get_column(
    "attendance_overall_attendance_current"
)

lms_logins = get_column(
    "lms_logins_per_week_current"
)

assignment = get_column(
    "lms_assignment_completion_pct_current"
)


# Low attendance flag

df["low_attendance_flag"] = (
    attendance < 75
).astype(int)


# Very low attendance

df["critical_attendance_flag"] = (
    attendance < 65
).astype(int)


# Low LMS engagement

df["low_lms_flag"] = (
    (lms_logins < 4)
    |
    (assignment < 60)
).astype(int)


# Attendance + LMS combined risk

df["attendance_lms_risk"] = (
    df["low_attendance_flag"]
    +
    df["low_lms_flag"]
)


# ============================================================
# 3. ACADEMIC DECLINE
# ============================================================

cgpa_slope = get_column(
    "academic_cgpa_slope_3m"
)

attendance_slope = get_column(
    "attendance_overall_attendance_slope_3m"
)

lms_slope = get_column(
    "lms_logins_per_week_slope_3m"
)


df["cgpa_declining_flag"] = (
    cgpa_slope < -0.05
).astype(int)


df["attendance_declining_flag"] = (
    attendance_slope < -1
).astype(int)


df["lms_declining_flag"] = (
    lms_slope < -0.25
).astype(int)


df["multi_domain_decline"] = (
    df["cgpa_declining_flag"]
    +
    df["attendance_declining_flag"]
    +
    df["lms_declining_flag"]
)


# ============================================================
# 4. ACADEMIC WARNING SCORE
# ============================================================

df["academic_warning_score"] = (
    2.0 * df["low_attendance_flag"]
    +
    1.5 * df["critical_attendance_flag"]
    +
    1.5 * df["low_lms_flag"]
    +
    2.0 * df["cgpa_declining_flag"]
    +
    1.5 * df["attendance_declining_flag"]
    +
    1.0 * df["lms_declining_flag"]
    +
    1.5 * (
        backlogs >= 1
    ).astype(int)
    +
    1.0 * (
        cgpa < 7
    ).astype(int)
)


# ============================================================
# 5. PLACEMENT READINESS
# ============================================================

aptitude = get_column(
    "placement_aptitude_score_current"
)

coding = get_column(
    "placement_coding_score_current"
)

interview = get_column(
    "placement_mock_interview_score_current"
)

technical = get_column(
    "skills_tech_skills_score_current"
)

soft = get_column(
    "skills_soft_skills_score_current"
)


df["placement_readiness_score"] = (
    0.20 * (aptitude / 100)
    +
    0.35 * (coding / 100)
    +
    0.25 * (interview / 100)
    +
    0.15 * (technical / 100)
    +
    0.05 * (soft / 100)
) * 100


# ============================================================
# 6. PLACEMENT WARNING FLAGS
# ============================================================

df["low_coding_flag"] = (
    coding < 60
).astype(int)

df["low_interview_flag"] = (
    interview < 60
).astype(int)

df["low_aptitude_flag"] = (
    aptitude < 60
).astype(int)

df["low_technical_skill_flag"] = (
    technical < 60
).astype(int)


df["placement_warning_score"] = (
    2.5 * df["low_coding_flag"]
    +
    2.0 * df["low_interview_flag"]
    +
    1.5 * df["low_aptitude_flag"]
    +
    1.5 * df["low_technical_skill_flag"]
)


# ============================================================
# 7. ENGAGEMENT
# ============================================================

hackathons = get_column(
    "engagement_hackathons_attended_current"
)

certifications = get_column(
    "engagement_certifications_count_current"
)

events = get_column(
    "engagement_events_attended_current"
)


df["engagement_strength"] = (
    0.4 * hackathons
    +
    0.3 * certifications
    +
    0.3 * events
)


# ============================================================
# 8. SAVE
# ============================================================

df.to_csv(
    OUTPUT_PATH,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\nEnhanced shape:", df.shape)

print(
    "\nNew features:"
)

new_features = [
    "academic_health_score",
    "low_attendance_flag",
    "critical_attendance_flag",
    "low_lms_flag",
    "attendance_lms_risk",
    "cgpa_declining_flag",
    "attendance_declining_flag",
    "lms_declining_flag",
    "multi_domain_decline",
    "academic_warning_score",
    "placement_readiness_score",
    "low_coding_flag",
    "low_interview_flag",
    "low_aptitude_flag",
    "low_technical_skill_flag",
    "placement_warning_score",
    "engagement_strength",
]

for feature in new_features:

    print(
        "  ✓",
        feature
    )


print(
    "\nSaved:",
    OUTPUT_PATH
)

print("\n" + "=" * 70)
print("DOMAIN FEATURE ENGINEERING COMPLETE")
print("=" * 70)