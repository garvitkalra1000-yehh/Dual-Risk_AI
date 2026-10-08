import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  GraduationCap,
  PieChart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = "https://dual-risk-ai.onrender.com";

interface Student {
  student_id: string;
  department: string | null;
  success_score: number | null;
  success_tier: string | null;
  academic_risk_tier: string | null;
  placement_risk_tier: string | null;
  priority_tier: string | null;
  priority_domain: string | null;
}

interface Overview {
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

function Analytics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [overview, setOverview] =
    useState<Overview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);

        const [studentsResponse, overviewResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/students?limit=100`,
            ),
            fetch(`${API_URL}/api/overview`),
          ]);

        if (!studentsResponse.ok) {
          throw new Error(
            "Unable to load student data",
          );
        }

        if (!overviewResponse.ok) {
          throw new Error(
            "Unable to load overview data",
          );
        }

        const studentsData =
          await studentsResponse.json();

        const overviewData =
          await overviewResponse.json();

        const rows = Array.isArray(studentsData)
          ? studentsData
          : studentsData.students ??
            studentsData.results ??
            [];

        setStudents(rows);
        setOverview(overviewData);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load analytics. Make sure FastAPI is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};

    students.forEach((student) => {
      const department =
        student.department ?? "Unknown";

      counts[department] =
        (counts[department] ?? 0) + 1;
    });

    return Object.entries(counts)
      .map(([department, students]) => ({
        department,
        students,
      }))
      .sort((a, b) => b.students - a.students);
  }, [students]);

  const riskComparisonData = useMemo(() => {
    if (!students.length) return [];

    const academic = {
      low: 0,
      medium: 0,
      high: 0,
    };

    const placement = {
      low: 0,
      medium: 0,
      high: 0,
    };

    students.forEach((student) => {
      const academicRisk =
        student.academic_risk_tier?.toLowerCase();

      const placementRisk =
        student.placement_risk_tier?.toLowerCase();

      if (
        academicRisk === "low" ||
        academicRisk === "medium" ||
        academicRisk === "high"
      ) {
        academic[academicRisk]++;
      }

      if (
        placementRisk === "low" ||
        placementRisk === "medium" ||
        placementRisk === "high"
      ) {
        placement[placementRisk]++;
      }
    });

    return [
      {
        level: "Low",
        Academic: academic.low,
        Placement: placement.low,
      },
      {
        level: "Medium",
        Academic: academic.medium,
        Placement: placement.medium,
      },
      {
        level: "High",
        Academic: academic.high,
        Placement: placement.high,
      },
    ];
  }, [students]);

  const successData = overview
    ? [
        {
          name: "Green",
          value:
            overview.success_distribution.green,
        },
        {
          name: "Amber",
          value:
            overview.success_distribution.amber,
        },
        {
          name: "Red",
          value:
            overview.success_distribution.red,
        },
      ]
    : [];

  const priorityData = overview
    ? [
        {
          name: "Low",
          value:
            overview.priority_distribution.low,
        },
        {
          name: "Medium",
          value:
            overview.priority_distribution.medium,
        },
        {
          name: "High",
          value:
            overview.priority_distribution.high,
        },
      ]
    : [];

  const domainData = overview
    ? [
        {
          name: "Academic",
          value:
            overview.risk_domain_distribution
              .academic,
        },
        {
          name: "Placement",
          value:
            overview.risk_domain_distribution
              .placement,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-10 w-64 rounded-lg bg-slate-200" />
          <div className="h-5 w-96 rounded bg-slate-200" />

          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-2xl bg-slate-200"
                />
              ),
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-80 rounded-2xl bg-slate-200"
                />
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <BarChart3 size={17} />
          Intelligence & Analytics
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Analytics
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Understand cohort health, risk distribution
          and intervention demand.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Users size={20} />}
          label="Current Cohort"
          value={overview?.total_students ?? 0}
          description="Active students"
        />

        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Average Success"
          value={
            overview?.average_success_score?.toFixed(
              1,
            ) ?? "—"
          }
          description="Overall success score"
        />

        <KpiCard
          icon={<GraduationCap size={20} />}
          label="Academic Risk"
          value={
            overview?.academic_risk_count ?? 0
          }
          description="Students flagged"
        />

        <KpiCard
          icon={<Target size={20} />}
          label="Placement Risk"
          value={
            overview?.placement_risk_count ?? 0
          }
          description="Students flagged"
        />
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Success distribution */}
        <ChartCard
          title="Success Score Distribution"
          description="Current cohort health classification."
          icon={<PieChart size={18} />}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <RechartsPieChart>
              <Pie
                data={successData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={105}
                innerRadius={58}
                paddingAngle={3}
              >
                {successData.map(
                  (entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        [
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                        ][index]
                      }
                    />
                  ),
                )}
              </Pie>

              <Tooltip />

              <Legend
                verticalAlign="bottom"
                height={36}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Priority distribution */}
        <ChartCard
          title="Priority Distribution"
          description="Students requiring different levels of attention."
          icon={<AlertTriangle size={18} />}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <RechartsPieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={105}
                innerRadius={58}
                paddingAngle={3}
              >
                {priorityData.map(
                  (entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        [
                          "#94a3b8",
                          "#f59e0b",
                          "#ef4444",
                        ][index]
                      }
                    />
                  ),
                )}
              </Pie>

              <Tooltip />

              <Legend
                verticalAlign="bottom"
                height={36}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Risk comparison */}
        <ChartCard
          title="Academic vs Placement Risk"
          description="Risk levels across the current cohort sample."
          icon={<Activity size={18} />}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={riskComparisonData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="level"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="Academic"
                fill="#0f172a"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="Placement"
                fill="#64748b"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department distribution */}
        <ChartCard
          title="Students by Department"
          description="Current API sample grouped by department."
          icon={<Users size={18} />}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={departmentData}
              layout="vertical"
              margin={{
                top: 5,
                right: 20,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
              />

              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                type="category"
                dataKey="department"
                width={65}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip />

              <Bar
                dataKey="students"
                fill="#334155"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Domain summary */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Risk Domain"
          description="Where intervention demand is concentrated."
          icon={<Target size={18} />}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <RechartsPieChart>
              <Pie
                data={domainData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {domainData.map(
                  (entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        index === 0
                          ? "#0f172a"
                          : "#64748b"
                      }
                    />
                  ),
                )}
              </Pie>

              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity
              size={19}
              className="text-slate-500"
            />

            <h2 className="font-semibold">
              Intervention Intelligence
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Current platform signals that help faculty
            prioritize student support.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Insight
              label="Interventions"
              value={
                overview?.intervention_count ?? 0
              }
              description="Students requiring action"
            />

            <Insight
              label="High Priority"
              value={
                overview?.priority_distribution
                  .high ?? 0
              }
              description="Immediate attention"
            />

            <Insight
              label="Red Students"
              value={
                overview?.success_distribution
                  .red ?? 0
              }
              description="Critical success score"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 h-[280px]">
        {children}
      </div>
    </div>
  );
}

function Insight({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default Analytics;
