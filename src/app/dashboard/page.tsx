"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { AssessmentData, TargetRole } from "@/types";
import { TARGET_ROLE_LABELS } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tous les roles" },
  { value: "sysadmin", label: "Administrateur Systeme" },
  { value: "architect", label: "Architecte Cloud" },
  { value: "ops", label: "Operateur Cloud" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateFR(date: string | Date | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function scoreColor(score: number | null): string {
  if (score === null) return "bg-gray-100 text-gray-600";
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-[#fce4ec] text-[#e31b58]";
}

function levelColor(level: number | null): string {
  if (level === null) return "text-gray-400";
  if (level >= 3) return "text-emerald-600";
  if (level >= 2) return "text-amber-600";
  return "text-[#e31b58]";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();

  // State
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(true);

  // Stats (computed from a broader fetch)
  const [stats, setStats] = useState({
    totalCount: 0,
    avgScore: 0,
    topRole: "-",
    thisMonth: 0,
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  // -------------------------------------------------------------------------
  // Fetch assessments
  // -------------------------------------------------------------------------

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (filters.role) params.set("role", filters.role);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const res = await fetch(`/api/assessments?${params.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();

      setAssessments(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 0);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      setAssessments([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, filters.role, filters.dateFrom, filters.dateTo, debouncedSearch]);

  // -------------------------------------------------------------------------
  // Fetch stats (all assessments, single large fetch)
  // -------------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/assessments?limit=1000&page=1");
      if (!res.ok) return;
      const json = await res.json();
      const all: AssessmentData[] = json.data ?? [];

      const totalCount = json.total ?? all.length;

      // Average score
      const scored = all.filter((a) => a.overallScore !== null);
      const avgScore =
        scored.length > 0
          ? Math.round(
              scored.reduce((s, a) => s + (a.overallScore ?? 0), 0) /
                scored.length,
            )
          : 0;

      // Most evaluated role
      const roleCounts: Record<string, number> = {};
      all.forEach((a) => {
        roleCounts[a.targetRole] = (roleCounts[a.targetRole] || 0) + 1;
      });
      const topRoleKey = Object.entries(roleCounts).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] as TargetRole | undefined;
      const topRole = topRoleKey
        ? TARGET_ROLE_LABELS[topRoleKey] ?? topRoleKey
        : "-";

      // This month
      const now = new Date();
      const thisMonth = all.filter((a) => {
        if (!a.createdAt) return false;
        const d = new Date(a.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length;

      setStats({ totalCount, avgScore, topRole, thisMonth });
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page when filters change
  const prevFiltersRef = useRef({
    role: filters.role,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: debouncedSearch,
  });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.role !== filters.role ||
      prev.dateFrom !== filters.dateFrom ||
      prev.dateTo !== filters.dateTo ||
      prev.search !== debouncedSearch
    ) {
      setPage(1);
      prevFiltersRef.current = {
        role: filters.role,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: debouncedSearch,
      };
    }
  }, [filters.role, filters.dateFrom, filters.dateTo, debouncedSearch]);

  // -------------------------------------------------------------------------
  // Export CSV
  // -------------------------------------------------------------------------

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filters.role) params.set("role", filters.role);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    window.open(`/api/export/csv?${params.toString()}`, "_blank");
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d&apos;ensemble des evaluations
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Evaluations"
          value={stats.totalCount}
          icon={ClipboardList}
          color="#00548c"
        />
        <StatCard
          label="Score Moyen"
          value={`${stats.avgScore}%`}
          icon={TrendingUp}
          color="#8883f0"
        />
        <StatCard
          label="Rôle le plus évalué"
          value={stats.topRole}
          icon={Users}
          color="#e31b58"
        />
        <StatCard
          label="Ce mois-ci"
          value={stats.thisMonth}
          icon={Calendar}
          color="#6bebf4"
        />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un candidat..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00548c] focus:outline-none focus:ring-1 focus:ring-[#00548c]"
          />
        </div>

        {/* Role select */}
        <select
          value={filters.role}
          onChange={(e) =>
            setFilters((f) => ({ ...f, role: e.target.value }))
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00548c] focus:outline-none focus:ring-1 focus:ring-[#00548c]"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dateFrom: e.target.value }))
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00548c] focus:outline-none focus:ring-1 focus:ring-[#00548c]"
        />

        {/* Date to */}
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dateTo: e.target.value }))
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#00548c] focus:outline-none focus:ring-1 focus:ring-[#00548c]"
        />

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00548c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003d66]"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      {/* Assessments table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-600">
                Candidat
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 font-semibold text-gray-600">
                Role Cible
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600">Score</th>
              <th className="px-4 py-3 font-semibold text-gray-600">
                Prérequis
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600">
                OpenStack
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#00548c]" />
                  <p className="mt-2 text-sm text-gray-500">Chargement...</p>
                </td>
              </tr>
            ) : assessments.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-16 text-center text-sm text-gray-500"
                >
                  Aucune évaluation trouvée
                </td>
              </tr>
            ) : (
              assessments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50/80"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDateFR(a.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {a.candidateName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.candidateEmail}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {TARGET_ROLE_LABELS[a.targetRole] ?? a.targetRole}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColor(a.overallScore)}`}
                    >
                      {a.overallScore !== null ? `${a.overallScore}%` : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${levelColor(a.avgPrereq)}`}
                    >
                      {a.avgPrereq !== null
                        ? `${a.avgPrereq.toFixed(1)}/4`
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${levelColor(a.avgOpenstack)}`}
                    >
                      {a.avgOpenstack !== null
                        ? `${a.avgOpenstack.toFixed(1)}/4`
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${a.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#00548c]/10 hover:text-[#00548c]"
                      title="Voir le détail"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}{" "}
            <span className="text-gray-400">
              ({total} évaluation{total > 1 ? "s" : ""})
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
