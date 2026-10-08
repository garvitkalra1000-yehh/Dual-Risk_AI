from pathlib import Path
import pandas as pd

# Project paths
ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"

# All raw datasets
files = [
    "academic.csv",
    "attendance.csv",
    "engagement.csv",
    "feedback.csv",
    "lms.csv",
    "outcomes.csv",
    "placement.csv",
    "skills.csv",
]

print("=" * 70)
print("DUALRISK AI - RAW DATA AUDIT")
print("=" * 70)

for file in files:
    path = RAW_DIR / file

    print("\n" + "-" * 70)
    print(f"FILE: {file}")
    print("-" * 70)

    df = pd.read_csv(path)

    print(f"Rows       : {df.shape[0]}")
    print(f"Columns    : {df.shape[1]}")
    print(f"Duplicates : {df.duplicated().sum()}")

    print("\nColumns:")
    print(df.columns.tolist())

    print("\nData Types:")
    print(df.dtypes)

    print("\nMissing Values:")
    missing = df.isnull().sum()
    print(missing[missing > 0])

    print("\nUnique Students:")
    print(df["student_id"].nunique())

    if "month" in df.columns:
        print("\nMonths:")
        print(sorted(df["month"].dropna().unique()))

print("\n" + "=" * 70)
print("AUDIT COMPLETE")
print("=" * 70)