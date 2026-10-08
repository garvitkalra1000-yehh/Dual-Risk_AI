import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Loader2,
  Target,
  User,
} from "lucide-react";

const API_URL = "https://dual-risk-ai.onrender.com";

interface Student {
  student_id: string;
  department: string | null;
  semester: string | null;

  academic_cgpa_current: number | null;
  academic_backlogs_current: number | null;
  attendance_subject_attendance_current: number | null;
  lms_assignment_completion_pct_current: number | null;

  placement_coding_score_current: number | null;
  placement_mock_interview_score_current: number | null;
  placement_aptitude_score_current: number | null;

  skills_tech_skills_score_current: number | null;
  skills_soft_skills_score_current: number | null;

  success_score: number | null;
  success_score_confidence: number | null;
  success_tier: string | null;
  success_score_status: string | null;

  academic_risk_probability: number | null;
  academic_risk_tier: string | null;

  placement_risk_probability: number | null;
  placement_risk_tier: string | null;

  academic_priority_score: number | null;
  placement_priority_score: number | null;
  overall_priority_score: number | null;

  priority_domain: string | null;
  priority_tier: string | null;

  intervention_required: string | boolean | null;
  recommended_action: string | null;
  action_owner: string | null;
  action_timeline: string | null;
}

interface Explanation {
  feature: string;
  shap_value: number;
  direction: string;
}

interface ExplanationsResponse {
  academic: Explanation[];
  placement: Explanation[];
}

function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] =
    useState<Student | null>(null);

  const [explanations, setExplanations] =
    useState<ExplanationsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;

    const loadStudent = async () => {
      try {
        setLoading(true);

        const [studentResponse, explanationResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/students/${studentId}`,
            ),
            fetch(
              `${API_URL}/api/students/${studentId}/explanations`,
            ),
          ]);

        if (!studentResponse.ok) {
          throw new Error("Student not found");
        }

        if (!explanationResponse.ok) {
          throw new Error(
            "Unable to load explanations",
          );
        }

        const studentData =
          await studentResponse.json();

        const explanationData =
          await explanationResponse.json();

        setStudent(studentData);
        setExplanations(explanationData);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load this student's profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading student intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 lg:p-8">
        <button
          type="button"
          onClick={() => navigate("/students")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Back to students
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle
            size={32}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-xl font-bold text-red-900">
            Student unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/students")}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
      >
        <ArrowLeft size={16} />
        Back to student worklist
      </button>

      {/* Student Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <User size={25} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {student.student_id}
                </h1>

                <TierBadge
                  tier={student.success_tier}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                <span>
                  Department:{" "}
                  <strong className="text-slate-700">
                    {student.department ?? "—"}
                  </strong>
                </span>

                <span>
                  Semester:{" "}
                  <strong className="text-slate-700">
                    {student.semester ?? "Unavailable"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Success Score
              </p>

              <p className="text-4xl font-bold tracking-tight">
                {student.success_score?.toFixed(1) ??
                  "—"}
              </p>

              <p className="text-xs text-slate-400">
                Confidence{" "}
                {student.success_score_confidence?.toFixed(
                  0,
                ) ?? "—"}
                %
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk cards */}
      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <RiskPanel
          title="Academic Risk"
          probability={
            student.academic_risk_probability
          }
          tier={student.academic_risk_tier}
          icon={<GraduationCap size={20} />}
        />

        <RiskPanel
          title="Placement Risk"
          probability={
            student.placement_risk_probability
          }
          tier={student.placement_risk_tier}
          icon={<Target size={20} />}
        />
      </section>

      {/* Intervention */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Lightbulb size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  Recommended Intervention
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  AI-generated priority based on risk,
                  severity and trend.
                </p>
              </div>

              <PriorityBadge
                score={student.overall_priority_score}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InfoBox
                label="Priority Domain"
                value={
                  student.priority_domain ?? "—"
                }
              />

              <InfoBox
                label="Owner"
                value={
                  student.action_owner ?? "—"
                }
              />

              <InfoBox
                label="Timeline"
                value={
                  student.action_timeline ?? "—"
                }
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">
                {student.recommended_action ??
                  "No intervention recommended."}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Intervention required:{" "}
                {String(
                  student.intervention_required ??
                    "No",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academic metrics */}
      <section className="mt-6">
        <SectionHeading
          title="Academic & Engagement Signals"
          icon={<GraduationCap size={19} />}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Current CGPA"
            value={student.academic_cgpa_current}
            suffix="/ 10"
          />

          <MetricCard
            label="Backlogs"
            value={
              student.academic_backlogs_current
            }
          />

          <MetricCard
            label="Attendance"
            value={
              student.attendance_subject_attendance_current
            }
            suffix="%"
          />

          <MetricCard
            label="LMS Completion"
            value={
              student.lms_assignment_completion_pct_current
            }
            suffix="%"
          />
        </div>
      </section>

      {/* Placement metrics */}
      <section className="mt-6">
        <SectionHeading
          title="Placement Readiness"
          icon={<Target size={19} />}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Coding"
            value={
              student.placement_coding_score_current
            }
          />

          <MetricCard
            label="Mock Interview"
            value={
              student.placement_mock_interview_score_current
            }
          />

          <MetricCard
            label="Aptitude"
            value={
              student.placement_aptitude_score_current
            }
          />

          <MetricCard
            label="Technical Skills"
            value={
              student.skills_tech_skills_score_current
            }
          />
        </div>
      </section>

      {/* SHAP */}
      <section className="mt-6">
        <SectionHeading
          title="AI Risk Explanation"
          icon={<BrainCircuit size={19} />}
        />

        <p className="mt-2 text-sm text-slate-500">
          These factors show model contribution to the
          predicted risk. They are associations, not
          causal explanations.
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <ExplanationPanel
            title="Academic Risk Drivers"
            explanations={
              explanations?.academic ?? []
            }
          />

          <ExplanationPanel
            title="Placement Risk Drivers"
            explanations={
              explanations?.placement ?? []
            }
          />
        </div>
      </section>

      {/* Footer info */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={18}
            className="mt-0.5 text-emerald-600"
          />

          <div>
            <p className="text-sm font-semibold">
              Prediction status
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Success score status:{" "}
              {student.success_score_status ??
                "Unavailable"}
              . Risk predictions are generated from
              the trained DualRisk AI models.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function RiskPanel({
  title,
  probability,
  tier,
  icon,
}: {
  title: string;
  probability: number | null;
  tier: string | null;
  icon: React.ReactNode;
}) {
  const percentage =
    probability === null
      ? null
      : probability * 100;

  const tierStyle =
    tier === "High"
      ? "bg-red-50 border-red-200 text-red-700"
      : tier === "Medium"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-emerald-50 border-emerald-200 text-emerald-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-500">
            {icon}
            <span className="text-sm font-medium">
              {title}
            </span>
          </div>

          <p className="mt-3 text-4xl font-bold">
            {percentage === null
              ? "—"
              : `${percentage.toFixed(1)}%`}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Predicted risk probability
          </p>
        </div>

        <span
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${tierStyle}`}
        >
          {tier ?? "Unknown"}
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            tier === "High"
              ? "bg-red-500"
              : tier === "Medium"
                ? "bg-amber-400"
                : "bg-emerald-500"
          }`}
          style={{
            width: `${Math.min(
              percentage ?? 0,
              100,
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function ExplanationPanel({
  title,
  explanations,
}: {
  title: string;
  explanations: Explanation[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold">
        {title}
      </h3>

      <div className="mt-5 space-y-4">
        {explanations.length === 0 ? (
          <p className="text-sm text-slate-400">
            No explanation data available.
          </p>
        ) : (
          explanations.map(
            (explanation, index) => {
              const positive =
                explanation.shap_value >= 0;

              const magnitude = Math.min(
                Math.abs(
                  explanation.shap_value,
                ) * 20,
                100,
              );

              return (
                <div key={`${explanation.feature}-${index}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {formatFeatureName(
                        explanation.feature,
                      )}
                    </span>

                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        positive
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {explanation.shap_value.toFixed(
                        3,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        positive
                          ? "bg-red-400"
                          : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${Math.max(
                          magnitude,
                          4,
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {explanation.direction ||
                      (positive
                        ? "Associated with higher predicted risk"
                        : "Associated with lower predicted risk")}
                  </p>
                </div>
              );
            },
          )
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value === null || value === undefined
          ? "—"
          : typeof value === "number"
            ? value.toFixed(1)
            : value}
        {value !== null && suffix && (
          <span className="ml-1 text-sm font-normal text-slate-400">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-500">
        {icon}
      </div>

      <h2 className="text-lg font-semibold">
        {title}
      </h2>
    </div>
  );
}

function TierBadge({
  tier,
}: {
  tier: string | null;
}) {
  const styles =
    tier === "Green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tier === "Amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {tier ?? "Unknown"}
    </span>
  );
}

function PriorityBadge({
  score,
}: {
  score: number | null;
}) {
  const value = score ?? 0;

  return (
    <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
      Priority {value.toFixed(0)}
    </span>
  );
}

function formatFeatureName(feature: string) {
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export default StudentProfile;
