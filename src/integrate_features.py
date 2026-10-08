from pathlib import Path
import pandas as pd
import numpy as np

# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

CLEAN_DIR = ROOT / "data" / "clean"
PROCESSED_DIR = ROOT / "data" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD CLEAN DATA
# ============================================================

print("=" * 70)
print("DUALRISK AI - INTEGRATION + FEATURE ENGINEERING")
print("=" * 70)

academic = pd.read_csv(
    CLEAN_DIR / "academic_clean.csv"
)

attendance = pd.read_csv(
    CLEAN_DIR / "attendance_clean.csv"
)

engagement = pd.read_csv(
    CLEAN_DIR / "engagement_clean.csv"
)

feedback = pd.read_csv(
    CLEAN_DIR / "feedback_clean.csv"
)

lms = pd.read_csv(
    CLEAN_DIR / "lms_clean.csv"
)

placement = pd.read_csv(
    CLEAN_DIR / "placement_clean.csv"
)

skills = pd.read_csv(
    CLEAN_DIR / "skills_clean.csv"
)

outcomes = pd.read_csv(
    CLEAN_DIR / "outcomes_clean.csv"
)


# ============================================================
# BASIC INFORMATION
# ============================================================

print("\nDataset sizes:")

for name, df in {
    "academic": academic,
    "attendance": attendance,
    "engagement": engagement,
    "feedback": feedback,
    "lms": lms,
    "placement": placement,
    "skills": skills,
    "outcomes": outcomes,
}.items():

    print(
        f"{name:<15} {df.shape}"
    )


# ============================================================
# MONTHLY DATASETS
# ============================================================

monthly = {
    "academic": academic,
    "attendance": attendance,
    "engagement": engagement,
    "feedback": feedback,
    "lms": lms,
    "placement": placement,
    "skills": skills,
}


# ============================================================
# FUNCTION:
# CREATE STUDENT-LEVEL FEATURES
# ============================================================

def create_features(df, prefix):

    result = []

    numeric_columns = df.select_dtypes(
        include=[np.number]
    ).columns.tolist()

    numeric_columns = [
        col
        for col in numeric_columns
        if col not in ["month"]
    ]

    for student_id, group in df.groupby(
        "student_id"
    ):

        group = group.sort_values("month")

        row = {
            "student_id": student_id
        }

        # ----------------------------------------------------
        # Latest month
        # ----------------------------------------------------

        latest = group.iloc[-1]

        # ----------------------------------------------------
        # Current values
        # ----------------------------------------------------

        for column in numeric_columns:

            value = latest[column]

            row[
                f"{prefix}_{column}_current"
            ] = value

        # ----------------------------------------------------
        # 3-month trend
        # ----------------------------------------------------

        recent = group.tail(3)

        for column in numeric_columns:

            values = recent[column].dropna()

            if len(values) >= 2:

                x = np.arange(len(values))

                slope = np.polyfit(
                    x,
                    values.values,
                    1
                )[0]

            else:

                slope = np.nan

            row[
                f"{prefix}_{column}_slope_3m"
            ] = slope

        # ----------------------------------------------------
        # 3-month average
        # ----------------------------------------------------

        for column in numeric_columns:

            row[
                f"{prefix}_{column}_avg_3m"
            ] = recent[column].mean()

        # ----------------------------------------------------
        # 3-month volatility
        # ----------------------------------------------------

        for column in numeric_columns:

            row[
                f"{prefix}_{column}_std_3m"
            ] = recent[column].std()

        # ----------------------------------------------------
        # Missingness indicators
        # ----------------------------------------------------

        for column in numeric_columns:

            row[
                f"{prefix}_{column}_missing"
            ] = int(
                pd.isna(latest[column])
            )

        result.append(row)

    return pd.DataFrame(result)


# ============================================================
# GENERATE FEATURES FOR EACH SOURCE
# ============================================================

feature_tables = []

for name, df in monthly.items():

    print(
        f"\nCreating features:",
        name
    )

    features = create_features(
        df,
        name
    )

    print(
        "Students:",
        len(features)
    )

    feature_tables.append(
        features
    )


# ============================================================
# MERGE ALL FEATURE TABLES
# ============================================================

print("\n" + "=" * 70)
print("MERGING FEATURE TABLES")
print("=" * 70)

features = feature_tables[0]

for table in feature_tables[1:]:

    features = features.merge(
        table,
        on="student_id",
        how="outer"
    )

print(
    "\nFinal feature shape:",
    features.shape
)


# ============================================================
# ADD NON-NUMERIC ACADEMIC INFORMATION
# ============================================================

class latest_academic:
    """Select and expose the most recent academic record per student."""

    def __init__(self, data):
        required_columns = {
            "student_id",
            "month",
            "department",
        }
        missing_columns = required_columns.difference(data.columns)
        if missing_columns:
            raise ValueError(
                "Academic data is missing columns: "
                + ", ".join(sorted(missing_columns))
            )
        self.data = data.copy()

    def rows(self):
        """Return one latest row for each student."""
        return (
            self.data
            .sort_values(["student_id", "month"], kind="stable")
            .groupby("student_id", sort=False)
            .tail(1)
        )

    def info(self):
        """Return the academic fields merged into the feature table."""
        return self.rows()[
            ["student_id", "department"]
        ].copy()


academic_info = latest_academic(academic).info()


features = features.merge(
    academic_info,
    on="student_id",
    how="left"
)


# ============================================================
# MERGE TARGETS
# ============================================================

print("\n" + "=" * 70)
print("ADDING HISTORICAL OUTCOMES")
print("=" * 70)

target_columns = [
    "student_id",
    "semester",
    "academic_risk_label",
    "placement_risk_label",
]

missing_target_columns = set(target_columns).difference(outcomes.columns)
if missing_target_columns:
    raise ValueError(
        "Outcomes data is missing columns: "
        + ", ".join(sorted(missing_target_columns))
    )

targets = outcomes[target_columns].copy()


features = features.merge(
    targets,
    on="student_id",
    how="left"
)


# ============================================================
# HISTORICAL FLAG
# ============================================================

features["is_historical"] = (
    features["academic_risk_label"]
    .notna()
    .astype(int)
)


# ============================================================
# REMOVE POTENTIAL LEAKAGE
# ============================================================

# Outcome information is NOT allowed to become
# a model feature.

leakage_columns = [
    "academic_risk_label",
    "placement_risk_label",
]


# These aren't in the feature table, but explicitly
# documenting them here prevents accidental use later.

print(
    "\nTarget columns:",
    leakage_columns
)


# ============================================================
# SORT COLUMNS
# ============================================================

first_columns = [
    "student_id",
    "department",
    "semester",
    "is_historical",
    "academic_risk_label",
    "placement_risk_label",
]

remaining_columns = [
    col
    for col in features.columns
    if col not in first_columns
]

features = features[
    first_columns + remaining_columns
]


# ============================================================
# SAVE
# ============================================================

output_path = (
    PROCESSED_DIR /
    "student_features.csv"
)

features.to_csv(
    output_path,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FEATURE ENGINEERING COMPLETE")
print("=" * 70)

print(
    "\nSaved:",
    output_path
)

print(
    "\nTotal students:",
    len(features)
)

print(
    "Historical students:",
    features["is_historical"].sum()
)

print(
    "Current students:",
    (features["is_historical"] == 0).sum()
)

print(
    "Total features:",
    len(features.columns)
)

print("\nTarget availability:")

print(
    "Academic labels:",
    features["academic_risk_label"]
    .notna()
    .sum()
)

print(
    "Placement labels:",
    features["placement_risk_label"]
    .notna()
    .sum()
)

print("\n" + "=" * 70)
print("DONE")
print("=" * 70)
