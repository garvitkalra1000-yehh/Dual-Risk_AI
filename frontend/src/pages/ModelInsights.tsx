import { useEffect, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Database,
  Info,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

const API_URL = "https://dual-risk-ai.onrender.com";

interface MetricSet {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  roc_auc?: number;
  pr_auc?: number;
  confusion_matrix?: number[][];
}

interface RiskModelMetrics {
  risk_type?: string;
  best_model?: string;
  best_metrics?: MetricSet;
  logistic_regression?: MetricSet;
  xgboost?: MetricSet;
}

interface ModelMetrics {
  academic_risk?: RiskModelMetrics;
  placement_risk?: RiskModelMetrics;
}

function ModelInsights() {
  const [metrics, setMetrics] =
    useState<ModelMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/model-metrics`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Unable to load model metrics",
          );
        }

        return response.json();
      })
      .then((data) => {
        setMetrics(data);
        setError("");
      })
      .catch((err) => {
        console.error(err);

        setError(
          "Unable to load model metrics. Make sure FastAPI is running.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-10 w-72 rounded-lg bg-slate-200" />
          <div className="h-5 w-[420px] rounded bg-slate-200" />

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-slate-200" />
            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  const academicModel =
    metrics?.academic_risk?.logistic_regression;

  const placementModel =
    metrics?.placement_risk?.logistic_regression;

  const academicXgb =
    metrics?.academic_risk?.xgboost;

  const placementXgb =
    metrics?.placement_risk?.xgboost;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <BrainCircuit size={17} />
          AI Model Intelligence
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Model Insights
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Transparent view of model performance,
          explainability and responsible AI safeguards.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Model overview */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ModelCard
          title="Academic Risk Model"
          subtitle="Predicts likelihood of academic risk."
          icon={<Target size={20} />}
          model="Logistic Regression"
          metrics={academicModel}
        />

        <ModelCard
          title="Placement Risk Model"
          subtitle="Predicts likelihood of placement risk."
          icon={<TrendingUp size={20} />}
          model="Logistic Regression"
          metrics={placementModel}
        />
      </div>

      {/* Model comparison */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
            <BrainCircuit size={19} />
          </div>

          <div>
            <h2 className="font-semibold">
              Model Comparison
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Logistic Regression vs XGBoost on the
              evaluation split.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  Domain
                </th>

                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  Model
                </th>

                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  Accuracy
                </th>

                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  Precision
                </th>

                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  Recall
                </th>

                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  ROC-AUC
                </th>

                <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  PR-AUC
                </th>
              </tr>
            </thead>

            <tbody>
              <MetricRow
                domain="Academic"
                model="Logistic Regression"
                metrics={academicModel}
              />

              <MetricRow
                domain="Academic"
                model="XGBoost"
                metrics={academicXgb}
              />

              <MetricRow
                domain="Placement"
                model="Logistic Regression"
                metrics={placementModel}
              />

              <MetricRow
                domain="Placement"
                model="XGBoost"
                metrics={placementXgb}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainability */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <InfoCard
          icon={<BrainCircuit size={20} />}
          title="Explainable AI"
        >
          <p>
            Every current student receives SHAP-based
            feature contributions for both academic and
            placement risk.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Academic"
              value="Top 5 factors"
            />

            <MiniStat
              label="Placement"
              value="Top 5 factors"
            />
          </div>
        </InfoCard>

        <InfoCard
          icon={<ShieldCheck size={20} />}
          title="Responsible AI"
        >
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              Risk scores support intervention
              decisions rather than automatically making
              decisions about students.
            </li>

            <li className="flex gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              Model explanations show contribution, not
              causation.
            </li>

            <li className="flex gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              Faculty review remains part of the
              intervention workflow.
            </li>
          </ul>
        </InfoCard>
      </div>

      {/* Data disclosure */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2 text-amber-600">
            <Database size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-amber-900">
              Data & Evaluation Note
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              The demonstration dataset is synthetic.
              Model performance is illustrative and should
              not be interpreted as production accuracy.
              Threshold selection and model evaluation
              should be validated on representative
              institutional historical data before
              deployment.
            </p>
          </div>
        </div>
      </div>

      {/* Important note */}
      <div className="mt-5 flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        <Info
          size={18}
          className="mt-0.5 shrink-0 text-slate-400"
        />

        <p>
          A risk probability indicates the model's
          estimated likelihood under its training setup.
          It should be interpreted together with student
          context, trends and human review.
        </p>
      </div>
    </div>
  );
}

function ModelCard({
  title,
  subtitle,
  icon,
  model,
  metrics,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  model: string;
  metrics?: MetricSet;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
            {icon}
          </div>

          <div>
            <h2 className="font-semibold">
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Selected model
        </p>

        <p className="mt-1 font-semibold">
          {model}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricBox
          label="ROC-AUC"
          value={formatMetric(metrics?.roc_auc)}
        />

        <MetricBox
          label="PR-AUC"
          value={formatMetric(metrics?.pr_auc)}
        />

        <MetricBox
          label="Recall"
          value={formatMetric(metrics?.recall)}
        />

        <MetricBox
          label="Precision"
          value={formatMetric(metrics?.precision)}
        />

        <MetricBox
          label="Accuracy"
          value={formatMetric(metrics?.accuracy)}
        />

        <MetricBox
          label="F1"
          value={formatMetric(metrics?.f1)}
        />
      </div>
    </div>
  );
}

function MetricRow({
  domain,
  model,
  metrics,
}: {
  domain: string;
  model: string;
  metrics?: MetricSet;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-4 font-medium">
        {domain}
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {model}
      </td>

      <td className="px-4 py-4 text-sm">
        {formatMetric(metrics?.accuracy)}
      </td>

      <td className="px-4 py-4 text-sm">
        {formatMetric(metrics?.precision)}
      </td>

      <td className="px-4 py-4 text-sm">
        {formatMetric(metrics?.recall)}
      </td>

      <td className="px-4 py-4 text-sm font-semibold">
        {formatMetric(metrics?.roc_auc)}
      </td>

      <td className="px-4 py-4 text-sm">
        {formatMetric(metrics?.pr_auc)}
      </td>
    </tr>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
          {icon}
        </div>

        <h2 className="font-semibold">
          {title}
        </h2>
      </div>

      <div className="mt-4 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}

function formatMetric(value?: number) {
  if (value === undefined || value === null) {
    return "—";
  }

  return value.toFixed(3);
}

export default ModelInsights;
