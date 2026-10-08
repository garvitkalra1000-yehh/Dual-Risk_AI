import { useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  GraduationCap,
  Target,
  PieChart as PieChartIcon,
  AlertTriangle,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

// =========================================================
// TYPES
// =========================================================

interface OverviewData {
  total_students: number;
  average_success_score: number;

  academic_risk_count: number;
  placement_risk_count: number;
  intervention_count: number;

  success_distribution: {
    green: number;
    amber: number;
    red: number;
  };

  priority_distribution: {
    low: number;
    medium: number;
    high: number;
  };

  risk_domain_distribution: {
    academic: number;
    placement: number;
  };
}

// =========================================================
// API
// =========================================================

const API_URL = "https://dual-risk-ai.onrender.com";

// =========================================================
// SMALL CARD
// =========================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}

function StatCard({
  icon,
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          {icon}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </p>

        <p className="text-4xl font-bold text-slate-900 mt-2">
          {value}
        </p>

        <p className="text-sm text-slate-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
}

// =========================================================
// CUSTOM TOOLTIP
// =========================================================

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-slate-800">
        {payload[0].name}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        Students:{" "}
        <span className="font-semibold text-slate-800">
          {payload[0].value}
        </span>
      </p>
    </div>
  );
}

// =========================================================
// OVERVIEW
// =========================================================

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------------------------------------------
  // FETCH OVERVIEW
  // -------------------------------------------------------

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/overview`
        );

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status}`
          );
        }

        const result = await response.json();

        setData(result);
      } catch (err) {
        console.error("Overview API error:", err);

        setError(
          "Unable to load overview data. Make sure the FastAPI server is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 w-56 bg-slate-200 rounded-lg" />
            <div className="h-5 w-80 bg-slate-200 rounded-lg mt-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-10">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-44 bg-white rounded-2xl border border-slate-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900">
            Overview
          </h1>

          <p className="text-slate-500 mt-3">
            Student success overview.
          </p>

          <div className="mt-10 bg-white border border-red-200 rounded-2xl p-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Unable to load dashboard
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // CHART DATA
  // -------------------------------------------------------

  const successData = [
    {
      name: "Green",
      value: data.success_distribution.green,
    },
    {
      name: "Amber",
      value: data.success_distribution.amber,
    },
    {
      name: "Red",
      value: data.success_distribution.red,
    },
  ];

  const priorityData = [
    {
      name: "High",
      value: data.priority_distribution.high,
    },
    {
      name: "Medium",
      value: data.priority_distribution.medium,
    },
    {
      name: "Low",
      value: data.priority_distribution.low,
    },
  ];

  const riskDomainData = [
    {
      name: "Academic",
      value: data.risk_domain_distribution.academic,
    },
    {
      name: "Placement",
      value: data.risk_domain_distribution.placement,
    },
  ];

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Student Success Platform
          </p>

          <h1 className="text-4xl font-bold text-slate-900 mt-2">
            Overview
          </h1>

          <p className="text-slate-500 mt-2">
            Student success overview.
          </p>
        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

          <StatCard
            icon={<Users size={22} />}
            label="Current Cohort"
            value={data.total_students}
            description="Active students"
          />

          <StatCard
            icon={<TrendingUp size={22} />}
            label="Average Success"
            value={data.average_success_score.toFixed(1)}
            description="Overall success score"
          />

          <StatCard
            icon={<GraduationCap size={22} />}
            label="Academic Risk"
            value={data.academic_risk_count}
            description="Students flagged"
          />

          <StatCard
            icon={<Target size={22} />}
            label="Placement Risk"
            value={data.placement_risk_count}
            description="Students flagged"
          />

        </div>

        {/* =================================================
            CHARTS ROW 1
        ================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">

          {/* SUCCESS DISTRIBUTION */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <PieChartIcon size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Success Score Distribution
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Current cohort health classification.
                </p>
              </div>

            </div>

            <div className="h-[330px] mt-4">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={successData}
                    cx="50%"
                    cy="48%"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={2}
                    dataKey="value"
                  >

                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />

                  </Pie>

                  <Tooltip content={<ChartTooltip />} />

                  <Legend
                    verticalAlign="bottom"
                    iconType="square"
                  />

                </PieChart>
              </ResponsiveContainer>

            </div>

          </div>

          {/* PRIORITY DISTRIBUTION */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <AlertTriangle size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Priority Distribution
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Students requiring different levels of attention.
                </p>
              </div>

            </div>

            <div className="h-[330px] mt-4">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="48%"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={2}
                    dataKey="value"
                  >

                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#94a3b8" />

                  </Pie>

                  <Tooltip content={<ChartTooltip />} />

                  <Legend
                    verticalAlign="bottom"
                    iconType="square"
                  />

                </PieChart>
              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* =================================================
            CHARTS ROW 2
        ================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">

          {/* ACADEMIC VS PLACEMENT */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Target size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Academic vs Placement Risk
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Students flagged by risk domain.
                </p>
              </div>

            </div>

            <div className="h-[330px] mt-4">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={riskDomainData}
                    cx="50%"
                    cy="48%"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={2}
                    dataKey="value"
                  >

                    <Cell fill="#6366f1" />
                    <Cell fill="#f59e0b" />

                  </Pie>

                  <Tooltip content={<ChartTooltip />} />

                  <Legend
                    verticalAlign="bottom"
                    iconType="square"
                  />

                </PieChart>
              </ResponsiveContainer>

            </div>

          </div>

          {/* INTERVENTION SUMMARY */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Users size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Intervention Demand
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Students requiring proactive attention.
                </p>
              </div>

            </div>

            <div className="mt-8">

              <div className="flex items-end justify-between">

                <div>
                  <p className="text-5xl font-bold text-slate-900">
                    {data.intervention_count}
                  </p>

                  <p className="text-sm text-slate-400 mt-2">
                    Students requiring intervention
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-700">
                    {(
                      (data.intervention_count /
                        data.total_students) *
                      100
                    ).toFixed(1)}
                    %
                  </p>

                  <p className="text-sm text-slate-400">
                    of current cohort
                  </p>
                </div>

              </div>

              {/* Progress */}

              <div className="mt-8">

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (data.intervention_count /
                          data.total_students) *
                          100
                      )}%`,
                    }}
                  />

                </div>

              </div>

              {/* Breakdown */}

              <div className="grid grid-cols-3 gap-4 mt-8">

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase">
                    High
                  </p>

                  <p className="text-2xl font-bold text-red-500 mt-1">
                    {data.priority_distribution.high}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase">
                    Medium
                  </p>

                  <p className="text-2xl font-bold text-orange-500 mt-1">
                    {data.priority_distribution.medium}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase">
                    Low
                  </p>

                  <p className="text-2xl font-bold text-slate-500 mt-1">
                    {data.priority_distribution.low}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER INFO
        ================================================= */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm font-semibold text-slate-800">
                DualRisk AI Cohort Intelligence
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Academic and placement risk signals combined with
                student success scoring.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />

              <span className="text-sm text-slate-500">
                API connected
              </span>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
