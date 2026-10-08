import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Search,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://dual-risk-ai.onrender.com";

interface Intervention {
  student_id: string;
  department: string | null;

  success_score: number | null;
  success_tier: string | null;

  academic_risk_probability: number | null;
  academic_risk_tier: string | null;

  placement_risk_probability: number | null;
  placement_risk_tier: string | null;

  academic_priority_score: number | null;
  placement_priority_score: number | null;
  priority_score: number | null;

  priority_domain: string | null;
  priority_tier: string | null;

  intervention_required: string | boolean | null;

  recommended_action: string | null;
  action_owner: string | null;
  action_timeline: string | null;
}

type PriorityFilter = "all" | "high" | "medium" | "low";
type DomainFilter = "all" | "academic" | "placement";

function Interventions() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Intervention[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [priority, setPriority] =
    useState<PriorityFilter>("all");
  const [domain, setDomain] =
    useState<DomainFilter>("all");

  const [sortDescending, setSortDescending] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/worklist?limit=100`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load intervention worklist",
          );
        }

        return response.json();
      })
      .then((data) => {
        const rows = Array.isArray(data)
            ? data
            : data.worklist ?? [];

        setStudents(rows);
        setError("");
    })
      .catch(() => {
        setError(
          "Unable to load intervention data. Make sure FastAPI is running on port 8000.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.department)
          .filter(Boolean),
      ),
    ).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = students.filter((student) => {
      const matchesSearch =
        !query ||
        student.student_id
          .toLowerCase()
          .includes(query);

      const matchesDepartment =
        department === "all" ||
        student.department === department;

      const matchesPriority =
        priority === "all" ||
        student.priority_tier?.toLowerCase() ===
          priority;

      const matchesDomain =
        domain === "all" ||
        student.priority_domain?.toLowerCase() ===
          domain;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesPriority &&
        matchesDomain
      );
    });

    return [...filtered].sort(
      (a, b) => {
        const aScore =
          a.priority_score ?? 0;

        const bScore =
          b.priority_score ?? 0;

        return sortDescending
          ? bScore - aScore
          : aScore - bScore;
      },
    );
  }, [
    students,
    search,
    department,
    priority,
    domain,
    sortDescending,
  ]);

  const highPriority = students.filter(
    (student) =>
      student.priority_tier === "High",
  ).length;

  const mediumPriority = students.filter(
    (student) =>
      student.priority_tier === "Medium",
  ).length;

  const academicCount = students.filter(
    (student) =>
      student.priority_domain === "Academic",
  ).length;

  const placementCount = students.filter(
    (student) =>
      student.priority_domain === "Placement",
  ).length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <ClipboardList size={16} />
            Intervention Management
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Intervention Worklist
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Prioritized student actions generated from
            academic and placement risk signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SummaryCard
            label="High"
            value={highPriority}
            className="text-red-600"
          />

          <SummaryCard
            label="Medium"
            value={mediumPriority}
            className="text-amber-600"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={19} />}
          label="Total Worklist"
          value={students.length}
        />

        <StatCard
          icon={<AlertTriangle size={19} />}
          label="High Priority"
          value={highPriority}
        />

        <StatCard
          icon={<UserRound size={19} />}
          label="Academic"
          value={academicCount}
        />

        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Placement"
          value={placementCount}
        />
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Department */}
          <select
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">
              All departments
            </option>

            {departments.map((dept) => (
              <option key={dept} value={dept ?? ""}>
                {dept}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value as PriorityFilter,
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">
              All priorities
            </option>
            <option value="high">
              High priority
            </option>
            <option value="medium">
              Medium priority
            </option>
            <option value="low">
              Low priority
            </option>
          </select>

          {/* Domain */}
          <select
            value={domain}
            onChange={(event) =>
              setDomain(
                event.target.value as DomainFilter,
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">
              All domains
            </option>
            <option value="academic">
              Academic
            </option>
            <option value="placement">
              Placement
            </option>
          </select>

          {/* Sort */}
          <button
            type="button"
            onClick={() =>
              setSortDescending(
                (current) => !current,
              )
            }
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ArrowUpDown size={16} />

            Priority{" "}
            {sortDescending
              ? "High → Low"
              : "Low → High"}
          </button>
        </div>
      </div>

      {/* Worklist */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold">
              Recommended Actions
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredStudents.length} students
              match the current filters
            </p>
          </div>

          <CalendarClock
            size={19}
            className="text-slate-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <TableHeader>
                  Student
                </TableHeader>

                <TableHeader>
                  Success
                </TableHeader>

                <TableHeader>
                  Risk
                </TableHeader>

                <TableHeader>
                  Priority
                </TableHeader>

                <TableHeader>
                  Recommended Action
                </TableHeader>

                <TableHeader>
                  Owner
                </TableHeader>

                <TableHeader>
                  Timeline
                </TableHeader>

                <TableHeader>
                  Open
                </TableHeader>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 8 }).map(
                  (_, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100"
                    >
                      <td
                        colSpan={8}
                        className="px-5 py-4"
                      >
                        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ),
                )}

              {!loading &&
                filteredStudents.map(
                  (student) => (
                    <tr
                      key={student.student_id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/students/${student.student_id}`,
                            )
                          }
                          className="text-left"
                        >
                          <p className="font-semibold text-slate-900">
                            {student.student_id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {student.department ??
                              "Unknown department"}
                          </p>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold">
                          {student.success_score?.toFixed(
                            1,
                          ) ?? "—"}
                        </span>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.success_tier ??
                            "Unknown"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <RiskLine
                            label="Academic"
                            tier={
                              student.academic_risk_tier
                            }
                            probability={
                              student.academic_risk_probability
                            }
                          />

                          <RiskLine
                            label="Placement"
                            tier={
                              student.placement_risk_tier
                            }
                            probability={
                              student.placement_risk_probability
                            }
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <PriorityCell
                            score={student.priority_score}
                            tier={student.priority_tier}
                            domain={student.priority_domain}
                        />
                      </td>

                      <td className="max-w-[300px] px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {student.recommended_action ??
                            "Review student"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.action_owner ??
                          "Advisor"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <CalendarClock size={13} />
                          {student.action_timeline ??
                            "Review"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/students/${student.student_id}`,
                            )
                          }
                          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View
                          <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        </div>

        {!loading &&
          filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <ClipboardList
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-medium">
                No interventions found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing the filters.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className={`text-xl font-bold ${className}`}>
        {value}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function RiskLine({
  label,
  tier,
  probability,
}: {
  label: string;
  tier: string | null;
  probability: number | null;
}) {
  const style =
    tier === "High"
      ? "text-red-600"
      : tier === "Medium"
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-slate-400">
        {label}
      </span>

      <span className={`font-semibold ${style}`}>
        {tier ?? "—"}
      </span>

      {probability !== null && (
        <span className="text-slate-400">
          {(probability * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}

function PriorityCell({
  score,
  tier,
  domain,
}: {
  score: number | null;
  tier: string | null;
  domain: string | null;
}) {
  const value = score ?? 0;

  const style =
    value >= 80
      ? "bg-red-50 text-red-700 border-red-200"
      : value >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div>
      <span
        className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${style}`}
      >
        {value.toFixed(0)}
      </span>

      <p className="mt-1 text-[11px] text-slate-400">
        {tier ?? "Low"} · {domain ?? "—"}
      </p>
    </div>
  );
}

export default Interventions;
