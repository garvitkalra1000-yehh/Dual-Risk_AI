from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import json

# =========================================================
# CONFIG
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "outputs"

DATA_PATH = OUTPUT_DIR / "dashboard_students.csv"
METRICS_PATH = OUTPUT_DIR / "model_metrics.json"

# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="DualRisk AI API",
    description="AI-powered Student Success and Early Warning Platform",
    version="1.0.0"
)

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# LOAD DATA
# =========================================================

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"Dashboard dataset not found: {DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

# Replace NaN with None-compatible values
df = df.where(pd.notna(df), None)

print(f"Loaded {len(df)} students")


# =========================================================
# HELPERS
# =========================================================

def records(dataframe):
    """Convert pandas dataframe into JSON-safe records."""
    import json

    json_string = dataframe.to_json(
        orient="records",
        date_format="iso"
    )

    return json.loads(json_string)


def student_or_404(student_id):
    student = df[
        df["student_id"].astype(str) == str(student_id)
    ]

    if student.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Student {student_id} not found"
        )

    import numpy as np

    row = student.iloc[0].to_dict()

    safe_row = {}

    for key, value in row.items():

        if pd.isna(value):
            safe_row[key] = None

        elif isinstance(value, np.integer):
            safe_row[key] = int(value)

        elif isinstance(value, np.floating):
            if np.isfinite(value):
                safe_row[key] = float(value)
            else:
                safe_row[key] = None

        elif isinstance(value, np.bool_):
            safe_row[key] = bool(value)

        else:
            safe_row[key] = value

    return safe_row


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "name": "DualRisk AI",
        "version": "1.0.0",
        "status": "running"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "students": len(df)
    }


# =========================================================
# OVERVIEW
# =========================================================

@app.get("/api/overview")
def overview():

    total_students = len(df)

    avg_success = round(
        df["success_score"].mean(),
        2
    )

    academic_risk_count = int(
        df["academic_risk_label"].sum()
    )

    placement_risk_count = int(
        df["placement_risk_label"].sum()
    )

    intervention_count = int(
        (df["intervention_required"] == "Yes").sum()
    )

    return {
        "total_students": total_students,
        "average_success_score": avg_success,

        "academic_risk_count": academic_risk_count,
        "placement_risk_count": placement_risk_count,
        "intervention_count": intervention_count,

        "success_distribution": {
            "green": int(
                (df["success_tier"] == "Green").sum()
            ),
            "amber": int(
                (df["success_tier"] == "Amber").sum()
            ),
            "red": int(
                (df["success_tier"] == "Red").sum()
            )
        },

        "priority_distribution": {
            "low": int(
                (df["priority_tier"] == "Low").sum()
            ),
            "medium": int(
                (df["priority_tier"] == "Medium").sum()
            ),
            "high": int(
                (df["priority_tier"] == "High").sum()
            )
        },

        "risk_domain_distribution": {
            "academic": int(
                (df["priority_domain"] == "Academic").sum()
            ),
            "placement": int(
                (df["priority_domain"] == "Placement").sum()
            )
        }
    }


# =========================================================
# STUDENTS
# =========================================================

@app.get("/api/students")
def students(
    search: str | None = None,
    department: str | None = None,
    risk: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100)
):
    result = df.copy()

    # Search
    if search:
        result = result[
            result["student_id"]
            .astype(str)
            .str.contains(search, case=False, na=False)
        ]

    # Department
    if department:
        result = result[
            result["department"].astype(str) == department
        ]

    # Risk
    if risk:
        risk = risk.lower()

        if risk == "academic":
            result = result[result["academic_risk_label"] == 1]

        elif risk == "placement":
            result = result[result["placement_risk_label"] == 1]

        elif risk == "intervention":
            result = result[
                result["intervention_required"] == "Yes"
            ]

    # Total AFTER filters
    total = len(result)

    # Pagination
    start = (page - 1) * limit
    end = start + limit

    paginated = result.iloc[start:end].copy()

    pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "students": records(paginated),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }


# =========================================================
# SINGLE STUDENT
# =========================================================

@app.get("/api/students/{student_id}")
def get_student(student_id: str):

    return student_or_404(student_id)


# =========================================================
# WORKLIST
# =========================================================

@app.get("/api/worklist")
def worklist(
    limit: int = Query(25, ge=1, le=100)
):

    result = df[
        df["intervention_required"] == "Yes"
    ].copy()

    result = result.sort_values(
        "priority_score",
        ascending=False
    )

    result = result.head(limit)

    return {
        "count": len(result),
        "worklist": records(result)
    }


# =========================================================
# SHAP / EXPLANATIONS
# =========================================================

@app.get("/api/students/{student_id}/explanations")
def explanations(student_id: str):

    student = student_or_404(student_id)

    academic = []

    placement = []

    for i in range(1, 6):

        factor = student.get(
            f"academic_factor_{i}"
        )

        shap_value = student.get(
            f"academic_shap_{i}"
        )

        direction = student.get(
            f"academic_direction_{i}"
        )

        if factor is not None:

            academic.append({
                "rank": i,
                "feature": factor,
                "shap_value": shap_value,
                "direction": direction
            })

        factor = student.get(
            f"placement_factor_{i}"
        )

        shap_value = student.get(
            f"placement_shap_{i}"
        )

        direction = student.get(
            f"placement_direction_{i}"
        )

        if factor is not None:

            placement.append({
                "rank": i,
                "feature": factor,
                "shap_value": shap_value,
                "direction": direction
            })

    return {
        "student_id": student_id,
        "academic": academic,
        "placement": placement
    }


# =========================================================
# MODEL METRICS
# =========================================================

@app.get("/api/model-metrics")
def model_metrics():

    if not METRICS_PATH.exists():
        return {
            "academic": {},
            "placement": {}
        }

    with open(
        METRICS_PATH,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


# =========================================================
# DEPARTMENTS
# =========================================================

@app.get("/api/departments")
def departments():

    values = (
        df["department"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    return {
        "departments": sorted(values)
    }


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )