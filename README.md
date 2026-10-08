# DualRisk AI

### AI-Powered Student Success & Risk Intervention Platform

DualRisk AI is an AI/ML-powered student success platform that combines academic, attendance, LMS, engagement, feedback, skills, and placement signals into a unified student view.

It helps institutions **Identify → Explain → Prioritize → Intervene**.

> **Demo Note:** The current project uses synthetic/demo data. Predictions and model metrics are illustrative and are not intended for production student decisions.

---

## 🎯 Problem Statement

Universities often have student information spread across multiple systems such as:

- Academic performance
- Attendance
- Learning Management Systems (LMS)
- Student engagement
- Feedback
- Skills
- Placement activity

Because these signals are fragmented, it can be difficult for faculty and administrators to identify students who need support early and decide which students should receive attention first.

DualRisk AI addresses this problem by integrating these signals into a unified analytics platform.

---

## 💡 Solution

DualRisk AI follows an end-to-end pipeline:

```text
Raw Student Data
       ↓
Data Audit & Cleaning
       ↓
Feature Integration & Enhancement
       ↓
ML Risk Prediction
       ↓
Academic Risk + Placement Risk
       ↓
Success Score
       ↓
Priority Score
       ↓
SHAP Explanations
       ↓
Intervention Worklist
       ↓
Faculty Action
```

The platform is built around a simple principle:

> **Identify → Explain → Prioritize → Intervene**

---

## ✨ Key Features

### 1. Unified Student View

The platform combines multiple data sources into a single student-level dataset.

Current data sources include:

- Academic
- Attendance
- Engagement
- Feedback
- LMS
- Outcomes
- Placement
- Skills

### 2. Academic Risk Prediction

The system estimates the probability that a student may be academically at risk.

### 3. Placement Risk Prediction

The system estimates placement-related risk using relevant student signals.

### 4. Success Score

Each student receives a score from **0–100** representing their overall current success profile.

Students are grouped into:

- 🟢 Green
- 🟡 Amber
- 🔴 Red

### 5. Intervention Priority

Students are prioritized using a combined priority score so that faculty can focus on students who require the most attention.

Priority levels include:

- Low
- Medium
- High

The system also identifies whether the primary intervention domain is:

- Academic
- Placement

### 6. Explainable AI

DualRisk AI uses **SHAP** to provide feature-level explanations for model predictions.

Instead of only showing:

> "Student is at risk"

the platform can show important contributing factors behind the prediction.

### 7. Intervention Worklist

Faculty can view prioritized students and their recommended intervention actions.

### 8. Analytics Dashboard

The dashboard provides an overview of:

- Student population
- Average success score
- Academic risk count
- Placement risk count
- Intervention demand
- Success distribution
- Priority distribution
- Risk domain distribution

### 9. Student Profiles

Faculty can open an individual student profile to view:

- Success score
- Success tier
- Academic risk
- Placement risk
- Priority score
- Priority domain
- Recommended intervention
- Risk explanations

### 10. Model Insights

The platform provides model performance information for the trained risk prediction models.

---

## 🧠 Machine Learning Pipeline

The ML pipeline consists of:

```text
Raw Data
   ↓
Data Audit
   ↓
Data Cleaning
   ↓
Feature Integration
   ↓
Feature Enhancement
   ↓
Model Training
   ↓
Model Evaluation
   ↓
Threshold Optimization
   ↓
Current Student Prediction
   ↓
Success Score
   ↓
Priority Score
   ↓
SHAP Explanations
```

### Models

The project evaluates:

- Logistic Regression
- XGBoost

The current demonstration pipeline selected **Logistic Regression** as the better-performing model for both risk domains based on the evaluated metrics.

---

## 📊 Demonstration Results

The current demonstration contains:

- **800 current students**
- **600 historical students with known outcomes**
- **2 prediction domains**
  - Academic Risk
  - Placement Risk

### Academic Risk Model

| Metric | Score |
|---|---:|
| Accuracy | 68.33% |
| Precision | 42.11% |
| Recall | 22.86% |
| ROC-AUC | 55.83% |
| PR-AUC | 35.35% |

### Placement Risk Model

| Metric | Score |
|---|---:|
| Accuracy | 70.83% |
| Precision | 51.61% |
| Recall | 44.44% |
| ROC-AUC | 69.51% |
| PR-AUC | 43.75% |

> These metrics are from the current synthetic/demo dataset and should be interpreted as illustrative rather than as evidence of production-level predictive performance.

---

## 📈 Current Dashboard Snapshot

The current 800-student demonstration cohort contains:

| Indicator | Value |
|---|---:|
| Students | 800 |
| Average Success Score | 76.76 |
| Academic Risk | 323 |
| Placement Risk | 497 |
| Intervention Required | 620 |

### Success Distribution

| Tier | Students |
|---|---:|
| Green | 663 |
| Amber | 135 |
| Red | 2 |

### Priority Distribution

| Priority | Students |
|---|---:|
| Low | 452 |
| Medium | 319 |
| High | 29 |

### Primary Risk Domain

| Domain | Students |
|---|---:|
| Academic | 352 |
| Placement | 448 |

---

## 🛠️ Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- React Router

### Backend

- Python
- FastAPI
- Uvicorn

### Data & Machine Learning

- Pandas
- NumPy
- Scikit-learn
- XGBoost
- SHAP
- Joblib

### Development

- Git
- GitHub
- VS Code

---

## 📁 Project Structure

```text
dualrisk-ai/
│
├── backend/
│   └── main.py
│
├── data/
│   ├── raw/
│   ├── clean/
│   └── processed/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       └── pages/
│
├── models/
│   ├── academic_risk_model.joblib
│   └── placement_risk_model.joblib
│
├── outputs/
│   ├── dashboard_students.csv
│   ├── model_metrics.json
│   ├── current_student_predictions.csv
│   ├── student_success_scores.csv
│   ├── student_priority_scores.csv
│   ├── student_shap_explanations.csv
│   └── top_25_intervention_worklist.csv
│
├── src/
│   ├── data_audit.py
│   ├── data_cleaning.py
│   ├── integrate_features.py
│   ├── enhance_features.py
│   ├── train_models.py
│   ├── optimize_thresholds.py
│   ├── predict_current_students.py
│   ├── calculate_success_score.py
│   ├── calculate_priority.py
│   ├── generate_shap.py
│   ├── feature_signal.py
│   └── build_dashboard_dataset.py
│
├── .gitignore
├── requirements.txt
└── package-lock.json
```

---

## 🚀 Running the Project Locally

### Prerequisites

Install:

- Python 3.10+
- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd dualrisk-ai
```

### 2. Create Python Environment

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Backend Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Start the FastAPI Backend

From the project root:

```powershell
uvicorn backend.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

API health check:

```text
http://127.0.0.1:8000/api/health
```

### 5. Start the Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## 🔌 API Endpoints

The FastAPI backend currently provides:

```text
GET /
GET /api/health
GET /api/overview
GET /api/students
GET /api/students/{student_id}
GET /api/students/{student_id}/explanations
GET /api/worklist
GET /api/model-metrics
GET /api/departments
```

---

## 🔍 Explainable AI

SHAP is used to identify important feature contributions for individual predictions.

The dashboard exposes the strongest factors for:

- Academic risk
- Placement risk

Important:

> SHAP explanations describe model behavior and feature contribution. They should not be interpreted as proof of causation.

---

## 🛡️ Responsible AI & Limitations

### Synthetic Data

The current dataset is synthetic/demo data. Real institutional deployment would require validated historical university data.

### Model Performance

The current metrics are illustrative. The academic model in particular has limited predictive strength and should not be used for real student decisions without further validation.

### Human Oversight

Predictions should support faculty decision-making, not replace it.

A student should never be penalized solely because an AI model assigns them a high-risk score.

### Explainability

SHAP provides model explanations, not causal explanations.

### Threshold Selection

The current project includes demonstration threshold optimization. A production system should use proper validation/cross-validation and evaluate thresholds on unseen data.

### Fairness

A production deployment should include fairness testing across appropriate student groups and continuous monitoring for unintended bias.

---

## 🎓 Intended Use

DualRisk AI is designed as a decision-support system for:

- Faculty
- Student success teams
- Academic advisors
- Placement teams
- University administrators

Possible interventions include:

- Academic mentoring
- Attendance follow-up
- Faculty counselling
- LMS engagement support
- Placement preparation
- Skill development recommendations

---

## 🔮 Future Improvements

Potential future versions could include:

- Persistent intervention tracking
- Faculty notes and intervention history
- Real-time university system integrations
- Automated notifications
- More advanced model validation
- Fairness monitoring
- Student segmentation
- Personalized intervention playbooks
- Production database integration
- Role-based authentication
- Cloud deployment
- Model monitoring and retraining pipelines

---

## 👥 Project

**DualRisk AI — Smart Campus Student Success Platform**

Built as an AI/ML and analytics prototype for student success, early risk identification, explainable predictions, and targeted intervention.

---

## ⚠️ Disclaimer

This project is an educational/hackathon prototype. It is not intended to make high-stakes decisions about students without appropriate human review, institutional validation, privacy safeguards, and fairness evaluation.
