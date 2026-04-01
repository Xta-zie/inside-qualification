"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import SkillsHeatmap from "@/components/charts/SkillsHeatmap";
import { FORMAT_LABELS } from "@/lib/scoring";
import type { AssessmentData, TargetRole } from "@/types";

// ---------------------------------------------------------------------------
// INSIDE brand colours
// ---------------------------------------------------------------------------

const BLUE = "#00548c";
const PINK = "#e31b58";
const CYAN = "#6bebf4";
const PURPLE = "#8883f0";
const YELLOW = "#ffe289";

const ROLE_COLORS: Record<string, string> = {
  sysadmin: BLUE,
  architect: PINK,
  ops: CYAN,
};

const ROLE_LABELS: Record<string, string> = {
  sysadmin: "Sysadmin",
  architect: "Architecte",
  ops: "Ops",
};

// ---------------------------------------------------------------------------
// Data‑fetching helper — paginates until all records are loaded
// ---------------------------------------------------------------------------

async function fetchAllAssessments(): Promise<AssessmentData[]> {
  const all: AssessmentData[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetch(
      `/api/assessments?limit=100&page=${page}`,
    );
    if (!res.ok) throw new Error("Failed to fetch assessments");
    const json = await res.json();
    all.push(...json.data);
    totalPages = json.totalPages ?? 1;
    page++;
  }

  return all;
}

// ---------------------------------------------------------------------------
// Analytics page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAssessments()
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, []);

  // -------------------------------------------------------------------------
  // Derived analytics
  // -------------------------------------------------------------------------

  const stats = useMemo(() => {
    if (assessments.length === 0) return null;

    const total = assessments.length;

    // Average overall score
    const avgScore =
      assessments.reduce((s, a) => s + (a.overallScore ?? 0), 0) / total;

    // Prereq validation rate (avgPrereq >= 3.0)
    const prereqValid = assessments.filter(
      (a) => (a.avgPrereq ?? 0) >= 3.0,
    ).length;
    const prereqRate = Math.round((prereqValid / total) * 100);

    // OpenStack advanced rate (avgOpenstack >= 3.0)
    const osAdvanced = assessments.filter(
      (a) => (a.avgOpenstack ?? 0) >= 3.0,
    ).length;
    const osRate = Math.round((osAdvanced / total) * 100);

    return { total, avgScore: Math.round(avgScore), prereqRate, osRate };
  }, [assessments]);

  // Score distribution histogram
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { name: "0-25%", count: 0 },
      { name: "26-50%", count: 0 },
      { name: "51-75%", count: 0 },
      { name: "76-100%", count: 0 },
    ];
    for (const a of assessments) {
      const s = a.overallScore ?? 0;
      if (s <= 25) buckets[0].count++;
      else if (s <= 50) buckets[1].count++;
      else if (s <= 75) buckets[2].count++;
      else buckets[3].count++;
    }
    return buckets;
  }, [assessments]);

  // Assessments per month
  const perMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assessments) {
      const d = a.createdAt ? new Date(a.createdAt) : null;
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [assessments]);

  // Role distribution
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = { sysadmin: 0, architect: 0, ops: 0 };
    for (const a of assessments) {
      if (a.targetRole in counts) counts[a.targetRole]++;
    }
    const total = assessments.length || 1;
    return Object.entries(counts).map(([role, count]) => ({
      name: ROLE_LABELS[role] ?? role,
      value: count,
      pct: Math.round((count / total) * 100),
      fill: ROLE_COLORS[role] ?? BLUE,
    }));
  }, [assessments]);

  // Average level per question key (for horizontal bar chart)
  const avgPerAxis = useMemo(() => {
    const questionKeys = Object.keys(FORMAT_LABELS);
    if (assessments.length === 0) return [];

    return questionKeys
      .map((key) => {
        const total = assessments.reduce(
          (s, a) => s + ((a.answers as Record<string, number>)?.[key] ?? 0),
          0,
        );
        return {
          key,
          label: FORMAT_LABELS[key] ?? key,
          avg: Math.round((total / assessments.length) * 10) / 10,
        };
      })
      .sort((a, b) => a.avg - b.avg);
  }, [assessments]);

  // Heatmap data (last 20 assessments)
  const heatmapData = useMemo(() => {
    const questionKeys = Object.keys(FORMAT_LABELS);
    const recent = assessments.slice(0, 20);
    return {
      questionKeys,
      rows: recent.map((a) => ({
        candidateName: a.candidateName,
        scores: (a.answers ?? {}) as Record<string, number>,
      })),
    };
  }, [assessments]);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200"
            style={{ borderTopColor: BLUE }}
          />
          <p className="text-sm text-gray-500">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  if (assessments.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BLUE}15` }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke={BLUE}
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Aucune évaluation disponible
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Les analytiques apparaitront ici une fois les premieres
            evaluations completees.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* Page header                                                       */}
      {/* ================================================================= */}
      <div>
        <h1
          className="text-3xl tracking-wide"
          style={{ color: BLUE }}
        >
          Analytiques
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyse globale des compétences
        </p>
      </div>

      {/* ================================================================= */}
      {/* Overview stats row                                                */}
      {/* ================================================================= */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total evaluations"
            value={String(stats.total)}
            accent={BLUE}
          />
          <StatCard
            label="Score moyen global"
            value={`${stats.avgScore}%`}
            accent={PURPLE}
          />
          <StatCard
            label="Taux de prérequis validés"
            value={`${stats.prereqRate}%`}
            accent={CYAN}
          />
          <StatCard
            label="Taux OpenStack avance"
            value={`${stats.osRate}%`}
            accent={PINK}
          />
        </div>
      )}

      {/* ================================================================= */}
      {/* Charts grid (2 columns)                                           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* -------------------------------------------------------------- */}
        {/* Score distribution                                              */}
        {/* -------------------------------------------------------------- */}
        <ChartCard title="Distribution des scores">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* -------------------------------------------------------------- */}
        {/* Assessments per month                                           */}
        {/* -------------------------------------------------------------- */}
        <ChartCard title="Evaluations par mois">
          {perMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={perMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CYAN}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CYAN }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* -------------------------------------------------------------- */}
        {/* Role distribution (Pie)                                         */}
        {/* -------------------------------------------------------------- */}
        <ChartCard title="Repartition par role">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={roleDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, pct }) => `${name} (${pct}%)`}
              >
                {roleDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* -------------------------------------------------------------- */}
        {/* Average level per axis (horizontal bar)                         */}
        {/* -------------------------------------------------------------- */}
        <ChartCard title="Niveaux moyens par axe">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={avgPerAxis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, 4]}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={180}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="avg" fill={BLUE} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ================================================================= */}
      {/* Skills heatmap (full width)                                       */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          Heatmap des compétences (20 dernières évaluations)
        </h3>
        <SkillsHeatmap
          data={heatmapData.rows}
          questionKeys={heatmapData.questionKeys}
          labels={FORMAT_LABELS}
        />
      </div>
    </div>
  );
}

// ===========================================================================
// Sub-components
// ===========================================================================

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
      Pas assez de données pour afficher ce graphique.
    </div>
  );
}
