from pathlib import Path
import pandas as pd
import numpy as np

# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

RAW_DIR = ROOT / "data" / "raw"
CLEAN_DIR = ROOT / "data" / "clean"

CLEAN_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# DATASETS
# ============================================================

FILES = [
    "academic.csv",
    "attendance.csv",
    "engagement.csv",
    "feedback.csv",
    "lms.csv",
    "outcomes.csv",
    "placement.csv",
    "skills.csv",
]


# ============================================================
# CLEANING LOG
# ============================================================

cleaning_log = []


def log_result(
    dataset,
    operation,
    affected_rows,
    description
):
    cleaning_log.append({
        "dataset": dataset,
        "operation": operation,
        "affected_rows": affected_rows,
        "description": description
    })


# ============================================================
# LOAD + CLEAN
# ============================================================

cleaned_data = {}

print("=" * 70)
print("DUALRISK AI - DATA CLEANING")
print("=" * 70)


for filename in FILES:

    dataset_name = filename.replace(".csv", "")

    print(f"\nProcessing: {filename}")

    path = RAW_DIR / filename

    df = pd.read_csv(path)

    original_rows = len(df)

    # --------------------------------------------------------
    # 1. Remove exact duplicate rows
    # --------------------------------------------------------

    duplicate_count = df.duplicated().sum()

    if duplicate_count > 0:

        df = df.drop_duplicates()

        log_result(
            dataset_name,
            "duplicate_removal",
            duplicate_count,
            "Removed exact duplicate rows"
        )

    print(
        f"Duplicates removed: {duplicate_count}"
    )


    # --------------------------------------------------------
    # 2. Clean column names
    # --------------------------------------------------------

    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )


    # --------------------------------------------------------
    # 3. Clean student IDs
    # --------------------------------------------------------

    if "student_id" in df.columns:

        df["student_id"] = (
            df["student_id"]
            .astype(str)
            .str.strip()
            .str.upper()
        )


    # --------------------------------------------------------
    # 4. Clean month values
    # --------------------------------------------------------

    if "month" in df.columns:

        df["month"] = (
            pd.to_numeric(
                df["month"],
                errors="coerce"
            )
        )


    # ========================================================
    # ACADEMIC
    # ========================================================

    if dataset_name == "academic":

        # Department standardization

        if "department" in df.columns:

            df["department"] = (
                df["department"]
                .astype(str)
                .str.strip()
                .str.lower()
            )

            department_map = {
                "cse": "CSE",
                "computer sci": "CSE",
                "computer science": "CSE",

                "ece": "ECE",
                "electronics": "ECE",

                "it": "IT",
                "information technology": "IT",

                "me": "ME",
                "mechanical": "ME",
            }

            df["department"] = (
                df["department"]
                .map(department_map)
                .fillna(
                    df["department"]
                    .str.upper()
                )
            )

        # Numeric conversion

        numeric_columns = [
            "cgpa",
            "internal_marks",
            "backlogs",
            "subject_score_avg"
        ]

        for column in numeric_columns:

            if column in df.columns:

                df[column] = pd.to_numeric(
                    df[column],
                    errors="coerce"
                )

        # CGPA must be 0-10

        if "cgpa" in df.columns:

            invalid = (
                (df["cgpa"] < 0) |
                (df["cgpa"] > 10)
            )

            count = invalid.sum()

            df.loc[invalid, "cgpa"] = np.nan

            log_result(
                dataset_name,
                "invalid_cgpa",
                count,
                "Values outside 0-10 converted to missing"
            )

        # Marks must be 0-100

        for column in [
            "internal_marks",
            "subject_score_avg"
        ]:

            if column in df.columns:

                invalid = (
                    (df[column] < 0) |
                    (df[column] > 100)
                )

                count = invalid.sum()

                df.loc[
                    invalid,
                    column
                ] = np.nan

                log_result(
                    dataset_name,
                    "invalid_score",
                    count,
                    f"{column}: values outside 0-100 converted to missing"
                )

        # Backlogs cannot be negative

        if "backlogs" in df.columns:

            invalid = df["backlogs"] < 0

            count = invalid.sum()

            df.loc[
                invalid,
                "backlogs"
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_backlogs",
                count,
                "Negative backlog values converted to missing"
            )


    # ========================================================
    # ATTENDANCE
    # ========================================================

    elif dataset_name == "attendance":

        attendance_columns = [
            "overall_attendance",
            "subject_attendance",
        ]

        for column in attendance_columns:

            if column not in df.columns:
                continue

            # Convert values such as "78%" → 78

            df[column] = (
                df[column]
                .astype(str)
                .str.strip()
                .str.replace(
                    "%",
                    "",
                    regex=False
                )
            )

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            # Valid attendance range = 0-100

            invalid = (
                (df[column] < 0) |
                (df[column] > 100)
            )

            count = invalid.sum()

            df.loc[
                invalid,
                column
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_attendance",
                count,
                f"{column}: values outside 0-100 converted to missing"
            )


    # ========================================================
    # PLACEMENT
    # ========================================================

    elif dataset_name == "placement":

        score_columns = [
            "aptitude_score",
            "coding_score",
            "mock_interview_score"
        ]

        for column in score_columns:

            if column not in df.columns:
                continue

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            invalid = (
                (df[column] < 0) |
                (df[column] > 100)
            )

            count = invalid.sum()

            df.loc[
                invalid,
                column
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_score",
                count,
                f"{column}: values outside 0-100 converted to missing"
            )


    # ========================================================
    # SKILLS
    # ========================================================

    elif dataset_name == "skills":

        score_columns = [
            "tech_skills_score",
            "soft_skills_score"
        ]

        for column in score_columns:

            if column not in df.columns:
                continue

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            invalid = (
                (df[column] < 0) |
                (df[column] > 100)
            )

            count = invalid.sum()

            df.loc[
                invalid,
                column
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_score",
                count,
                f"{column}: values outside 0-100 converted to missing"
            )


    # ========================================================
    # FEEDBACK
    # ========================================================

    elif dataset_name == "feedback":

        score_columns = [
            "satisfaction_score",
            "faculty_rating"
        ]

        for column in score_columns:

            if column not in df.columns:
                continue

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            invalid = (
                (df[column] < 0) |
                (df[column] > 100)
            )

            count = invalid.sum()

            df.loc[
                invalid,
                column
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_score",
                count,
                f"{column}: values outside 0-100 converted to missing"
            )


    # ========================================================
    # LMS
    # ========================================================

    elif dataset_name == "lms":

        numeric_columns = [
            "logins_per_week",
            "assignment_completion_pct"
        ]

        for column in numeric_columns:

            if column not in df.columns:
                continue

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

        if "assignment_completion_pct" in df.columns:

            invalid = (
                (df["assignment_completion_pct"] < 0) |
                (df["assignment_completion_pct"] > 100)
            )

            count = invalid.sum()

            df.loc[
                invalid,
                "assignment_completion_pct"
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_percentage",
                count,
                "Assignment completion outside 0-100 converted to missing"
            )

        if "logins_per_week" in df.columns:

            invalid = df["logins_per_week"] < 0

            count = invalid.sum()

            df.loc[
                invalid,
                "logins_per_week"
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_login_count",
                count,
                "Negative login counts converted to missing"
            )


    # ========================================================
    # ENGAGEMENT
    # ========================================================

    elif dataset_name == "engagement":

        numeric_columns = [
            "events_attended",
            "club_participations",
            "hackathons_attended",
            "certifications_count"
        ]

        for column in numeric_columns:

            if column not in df.columns:
                continue

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            invalid = df[column] < 0

            count = invalid.sum()

            df.loc[
                invalid,
                column
            ] = np.nan

            log_result(
                dataset_name,
                "invalid_count",
                count,
                f"{column}: negative values converted to missing"
            )


    # ========================================================
    # MISSING VALUE REPORT
    # ========================================================

    missing_count = int(
        df.isna().sum().sum()
    )

    log_result(
        dataset_name,
        "missing_value_audit",
        missing_count,
        "Missing values retained for later preprocessing"
    )


    # ========================================================
    # SAVE CLEAN DATA
    # ========================================================

    output_path = (
        CLEAN_DIR /
        f"{dataset_name}_clean.csv"
    )

    df.to_csv(
        output_path,
        index=False
    )

    cleaned_data[dataset_name] = df

    print(
        f"Saved -> {output_path}"
    )


# ============================================================
# SAVE CLEANING LOG
# ============================================================

log_df = pd.DataFrame(
    cleaning_log
)

log_path = (
    CLEAN_DIR /
    "cleaning_log.csv"
)

log_df.to_csv(
    log_path,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("CLEANING COMPLETE")
print("=" * 70)

print(
    f"Cleaning operations recorded: {len(log_df)}"
)

print(
    f"Cleaning log: {log_path}"
)

print(
    f"Clean datasets saved in: {CLEAN_DIR}"
)
