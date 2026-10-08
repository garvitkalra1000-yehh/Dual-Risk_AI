import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Users,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Student {
  student_id: string;
  department: string | null;
  semester: string | null;

  success_score: number | null;
  success_tier: string | null;

  academic_risk_probability: number | null;
  academic_risk_tier: string | null;

  placement_risk_probability: number | null;
  placement_risk_tier: string | null;

  academic_priority_score: number | null;
  placement_priority_score: number | null;
  priority_score: number | null;

  intervention_required: string | boolean | null;
}

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type RiskFilter = "all" | "high" | "medium" | "low";

const API_URL = "http://127.0.0.1:8000";
const PAGE_SIZE = 25;

function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [risk, setRisk] = useState<RiskFilter>("all");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Load departments once
   */
  useEffect(() => {
    fetch(`${API_URL}/api/departments`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load departments");
        }

        return response.json();
      })
      .then((data) => {
        setDepartments(data.departments ?? data ?? []);
      })
      .catch(() => {
        // Department filter is optional, so don't break the page.
        setDepartments([]);
      });
  }, []);

  /*
   * Load students whenever search/filter/page changes.
   */
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (department !== "all") {
        params.set("department", department);
      }

      if (risk !== "all") {
        params.set("risk", risk);
      }

      fetch(`${API_URL}/api/students?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to load students");
          }

          return response.json();
        })
        .then((data: StudentsResponse) => {
          setStudents(
            data.students.map((student) => ({
                ...student,
                priority_score: Number(student.priority_score ?? 0),
            }))
        );
          setTotal(data.total ?? 0);
          setPages(data.pages ?? 1);
          setError("");
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setError(
              "Unable to load students. Make sure FastAPI is running on port 8000.",
            );
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, department, risk]);

  /*
   * Reset filters.
   */
  const resetFilters = () => {
    setSearch("");
    setDepartment("all");
    setRisk("all");
    setPage(1);
  };

  /*
   * Change page safely.
   */
  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pages) {
      return;
    }

    setPage(nextPage);
  };

  /*
   * Calculate visible page range.
   */
  const getPageNumbers = () => {
    const visiblePages: number[] = [];

    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    return visiblePages;
  };

  const startStudent = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endStudent = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Users size={16} />
            Student Management
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Student Worklist
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Search, filter and investigate student success risks.
          </p>
        </div>

        {/* Result count */}
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-xs text-slate-400">Showing students</p>

          <p className="text-xl font-bold">
            {startStudent}–{endStudent}
            <span className="ml-1 text-sm font-normal text-slate-400">
              / {total}
            </span>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search student ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Department */}
          <select
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">All departments</option>

            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Risk */}
          <select
            value={risk}
            onChange={(event) => {
              setRisk(event.target.value as RiskFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="all">All risk levels</option>
            <option value="high">High risk</option>
            <option value="medium">Medium risk</option>
            <option value="low">Low risk</option>
          </select>

          {/* Reset */}
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <SlidersHorizontal size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Success
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Academic Risk
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Placement Risk
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}
              {loading &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100"
                  >
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))}

              {/* Students */}
              {!loading &&
                students.map((student) => (
                  <tr
                    key={student.student_id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {student.student_id}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {student.semester ?? "Semester unavailable"}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {student.department ?? "—"}
                    </td>

                    {/* Success */}
                    <td className="px-5 py-4">
                      <ScoreBadge
                        score={student.success_score}
                        tier={student.success_tier}
                      />
                    </td>

                    {/* Academic Risk */}
                    <td className="px-5 py-4">
                      <RiskBadge
                        tier={student.academic_risk_tier}
                        probability={student.academic_risk_probability}
                      />
                    </td>

                    {/* Placement Risk */}
                    <td className="px-5 py-4">
                      <RiskBadge
                        tier={student.placement_risk_tier}
                        probability={student.placement_risk_probability}
                      />
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-4">
                      <PriorityBadge
                        score={student.priority_score}
                      />
                    </td>

                    {/* View */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/students/${student.student_id}`)
                        }
                        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Empty */}
        {!loading && students.length === 0 && (
          <div className="p-12 text-center">
            <Users
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium">
              No students found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Info */}
            <p className="text-sm text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">
                {page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {pages}
              </span>
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* First */}
              <button
                type="button"
                disabled={page === 1}
                onClick={() => goToPage(1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Previous */}
              <button
                type="button"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Pages */}
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => goToPage(pageNumber)}
                  className={`h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition ${
                    pageNumber === page
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              {/* Next */}
              <button
                type="button"
                disabled={page === pages}
                onClick={() => goToPage(page + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>

              {/* Last */}
              <button
                type="button"
                disabled={page === pages}
                onClick={() => goToPage(pages)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- */
/* Success Score Badge */
/* ----------------------------- */

function ScoreBadge({
  score,
  tier,
}: {
  score: number | null;
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
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {score?.toFixed(1) ?? "—"}
    </span>
  );
}

/* ----------------------------- */
/* Risk Badge */
/* ----------------------------- */

function RiskBadge({
  tier,
  probability,
}: {
  tier: string | null;
  probability: number | null;
}) {
  const styles =
    tier === "High"
      ? "bg-red-50 text-red-700 border-red-200"
      : tier === "Medium"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div>
      <span
        className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles}`}
      >
        {tier ?? "Unknown"}
      </span>

      {probability !== null && (
        <p className="mt-1 text-[11px] text-slate-400">
          {(probability * 100).toFixed(0)}% probability
        </p>
      )}
    </div>
  );
}

/* ----------------------------- */
/* Priority Badge */
/* ----------------------------- */

function PriorityBadge({
  score,
}: {
  score: number | null;
}) {
  const value = score ?? 0;

  const styles =
    value >= 80
      ? "bg-red-50 text-red-700 border-red-200"
      : value >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {value.toFixed(0)}
    </span>
  );
}

export default Students;