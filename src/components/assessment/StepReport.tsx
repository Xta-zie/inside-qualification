"use client";

import { useMemo } from "react";
import {
  Server,
  Cloud,
  Compass,
  GraduationCap,
  BookOpen,
  Mail,
  Printer,
  Check,
  RotateCcw,
} from "lucide-react";

import {
  calculateGapAnalysis,
  calculateOverallScore,
  calculateAverageLevel,
  getPrereqKeys,
  getOpenstackKeys,
  getPrereqStatus,
  getOpenstackStatus,
  getPrereqRecommendation,
  getOpenstackRecommendation,
  CATEGORY_TO_MODULE,
  FORMAT_LABELS,
} from "@/lib/scoring";
import type { GapItem } from "@/lib/scoring";

import RadarChart from "@/components/charts/RadarChart";
import GapBarChart from "@/components/charts/GapBarChart";
import ScoreGauge from "@/components/charts/ScoreGauge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepReportProps {
  roleKey: string;
  roleLabel: string;
  targets: Record<string, number>;
  answers: Record<string, number>;
  identity: { name: string; email: string };
  questions: Array<{ key: string; category: string }>;
  trainingModules: Array<{
    moduleKey: string;
    title: string;
    content: string;
    linkedQuestionKeys: string[];
    providers: Array<{ name: string; type: string; detail: string }>;
  }>;
  onReset: () => void;
  assessmentId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INSIDE_BLUE = "#00548c";
const INSIDE_PINK = "#e31b58";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single horizontal gap bar for one axis. */
function AxisGapBar({ item }: { item: GapItem }) {
  const label = FORMAT_LABELS[item.key] ?? item.key;
  const currentPct = (item.current / 4) * 100;
  const deltaPct = (item.delta / 4) * 100;
  const targetPct = (item.target / 4) * 100;
  const hasGap = item.delta > 0;

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {item.current}/{item.target}
        </span>
      </div>

      {/* Bar container */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
        {/* Current level (blue) */}
        <div
          className="absolute left-0 top-0 h-full rounded-l-full bg-inside-blue"
          style={{ width: `${currentPct}%` }}
        />
        {/* Gap (pink) */}
        {hasGap && (
          <div
            className="absolute top-0 h-full bg-inside-pink/70"
            style={{
              left: `${currentPct}%`,
              width: `${deltaPct}%`,
            }}
          />
        )}
        {/* Target marker (black line) */}
        <div
          className="absolute top-0 h-full w-[3px] bg-black"
          style={{ left: `calc(${targetPct}% - 1.5px)` }}
        />
      </div>

      {/* Status text */}
      <div className="mt-1">
        {hasGap ? (
          <span className="text-xs font-medium text-inside-pink">
            Deficit: {item.delta} niveau{item.delta > 1 ? "x" : ""}
          </span>
        ) : (
          <span className="text-xs font-medium text-inside-blue">
            <Check className="mr-1 inline-block h-3 w-3" />
            {item.current > item.target
              ? "Surpasse la cible"
              : "Cible atteinte"}
          </span>
        )}
      </div>
    </div>
  );
}

/** Status badge component. */
function StatusBadge({
  badge,
}: {
  badge: { text: string; colorClass: string; bgClass: string };
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${badge.bgClass} ${badge.colorClass}`}
    >
      {badge.text}
    </span>
  );
}

/** Provider type badge color. */
function providerBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case "elearning":
    case "e-learning":
      return "bg-inside-purple/20 text-inside-purple";
    case "presentiel":
    case "présentiel":
      return "bg-inside-blue/20 text-inside-blue";
    case "lab":
    case "labo":
      return "bg-inside-cyan/20 text-cyan-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StepReport({
  roleKey,
  roleLabel,
  targets,
  answers,
  identity,
  questions,
  trainingModules,
  onReset,
  assessmentId,
}: StepReportProps) {
  // ── Computed data ──────────────────────────────────────────────────────

  const gapAnalysis = useMemo(
    () => calculateGapAnalysis(answers, targets),
    [answers, targets],
  );

  const overallScore = useMemo(
    () => calculateOverallScore(answers, targets),
    [answers, targets],
  );

  const prereqKeys = useMemo(() => getPrereqKeys(), []);
  const openstackKeys = useMemo(() => getOpenstackKeys(), []);

  const avgPrereq = useMemo(
    () => calculateAverageLevel(answers, prereqKeys),
    [answers, prereqKeys],
  );

  const avgOpenstack = useMemo(
    () => calculateAverageLevel(answers, openstackKeys),
    [answers, openstackKeys],
  );

  const prereqStatus = useMemo(() => getPrereqStatus(avgPrereq), [avgPrereq]);
  const openstackStatus = useMemo(
    () => getOpenstackStatus(avgOpenstack),
    [avgOpenstack],
  );

  const prereqReco = useMemo(
    () => getPrereqRecommendation(avgPrereq),
    [avgPrereq],
  );
  const openstackReco = useMemo(
    () => getOpenstackRecommendation(avgOpenstack),
    [avgOpenstack],
  );

  // Split gap items
  const prereqGaps = useMemo(
    () => gapAnalysis.filter((g) => prereqKeys.includes(g.key)),
    [gapAnalysis, prereqKeys],
  );
  const openstackGaps = useMemo(
    () => gapAnalysis.filter((g) => openstackKeys.includes(g.key)),
    [gapAnalysis, openstackKeys],
  );

  const hasAnyGap = useMemo(
    () => gapAnalysis.some((g) => g.delta > 0),
    [gapAnalysis],
  );

  // Recommended modules (only those addressing gaps)
  const recommendedModules = useMemo(() => {
    const gapModuleKeys = new Set<string>();
    for (const gap of gapAnalysis) {
      if (gap.delta > 0) {
        const modKey = CATEGORY_TO_MODULE[gap.key];
        if (modKey) gapModuleKeys.add(modKey);
      }
    }
    return trainingModules.filter((m) => gapModuleKeys.has(m.moduleKey));
  }, [gapAnalysis, trainingModules]);

  // Radar data
  const radarData = useMemo(
    () =>
      gapAnalysis.map((g) => ({
        subject: FORMAT_LABELS[g.key] ?? g.key,
        current: g.current,
        target: g.target,
      })),
    [gapAnalysis],
  );

  // Gap bar chart data
  const gapBarData = useMemo(
    () =>
      gapAnalysis.map((g) => ({
        name: FORMAT_LABELS[g.key] ?? g.key,
        current: g.current,
        target: g.target,
        gap: g.delta,
      })),
    [gapAnalysis],
  );

  // Helpers: which gaps a module covers
  const gapsByModule = useMemo(() => {
    const map: Record<string, GapItem[]> = {};
    for (const mod of trainingModules) {
      map[mod.moduleKey] = gapAnalysis.filter(
        (g) => g.delta > 0 && mod.linkedQuestionKeys.includes(g.key),
      );
    }
    return map;
  }, [gapAnalysis, trainingModules]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <section className="animate-[fadeIn_0.5s_ease-out] mx-auto max-w-6xl px-4 py-8">
      {/* ================================================================ */}
      {/* 1. HEADER                                                        */}
      {/* ================================================================ */}
      <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        {/* Left */}
        <div>
          <h1 className="font-display text-3xl tracking-wide text-inside-blue md:text-4xl">
            Rapport d&apos;Audit de Competences
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Candidat:{" "}
            <span className="font-semibold text-gray-800">
              {identity.name}
            </span>{" "}
            &mdash;{" "}
            <span className="text-gray-500">{identity.email}</span>
          </p>
          <p className="text-sm text-gray-600">
            Profil cible:{" "}
            <span className="font-semibold text-inside-blue">{roleLabel}</span>
          </p>
        </div>

        {/* Right – big percentage */}
        <div className="flex-shrink-0 text-right">
          <span
            className="font-display text-6xl leading-none text-inside-pink md:text-7xl"
          >
            {overallScore}%
          </span>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            Score Global
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. COMPETENCY EVALUATION                                         */}
      {/* ================================================================ */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-dm-sans mb-6 text-lg font-bold text-gray-800">
          Evaluation des Competences
        </h2>

        {/* Two side-by-side cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Prerequis card */}
          <div className="rounded-lg border border-gray-200 border-l-4 border-l-inside-pink bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <Server className="h-5 w-5 text-inside-pink" />
              <h3 className="font-dm-sans text-base font-semibold text-gray-800">
                Partie 1: Prerequis Techniques
              </h3>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                {avgPrereq}
              </span>
              <span className="text-sm text-gray-500">/ 4</span>
            </div>
            <StatusBadge badge={prereqStatus} />
          </div>

          {/* OpenStack card */}
          <div className="rounded-lg border border-gray-200 border-l-4 border-l-inside-blue bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-inside-blue" />
              <h3 className="font-dm-sans text-base font-semibold text-gray-800">
                Partie 2: Baseline OpenStack
              </h3>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                {avgOpenstack}
              </span>
              <span className="text-sm text-gray-500">/ 4</span>
            </div>
            <StatusBadge badge={openstackStatus} />
          </div>
        </div>

        {/* Recommendation box */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Compass className="h-5 w-5 text-inside-blue" />
            <h4 className="font-dm-sans text-sm font-bold uppercase tracking-wider text-gray-700">
              Recommandation
            </h4>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{prereqReco}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {openstackReco}
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. LEGEND                                                        */}
      {/* ================================================================ */}
      <div className="mb-8 flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-full bg-inside-blue" />
          <span className="text-xs font-medium text-gray-600">
            Niveau Acquis
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-full bg-inside-pink/70" />
          <span className="text-xs font-medium text-gray-600">Deficit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-[3px] bg-black" />
          <span className="text-xs font-medium text-gray-600">
            Cible Attendue
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. TWO-COLUMN GRID                                               */}
      {/* ================================================================ */}
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        {/* ──── Left column: Detail sections ──── */}
        <div className="space-y-8">
          {/* Prerequis detail */}
          <div className="rounded-xl border border-gray-200 border-t-4 border-t-inside-pink bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Server className="h-5 w-5 text-inside-pink" />
              <h3 className="font-dm-sans text-base font-bold text-gray-800">
                Detail Prerequis
              </h3>
            </div>
            {prereqGaps.map((item) => (
              <AxisGapBar key={item.key} item={item} />
            ))}
          </div>

          {/* OpenStack detail */}
          <div className="rounded-xl border border-gray-200 border-t-4 border-t-inside-blue bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-inside-blue" />
              <h3 className="font-dm-sans text-base font-bold text-gray-800">
                Detail OpenStack
              </h3>
            </div>
            {openstackGaps.map((item) => (
              <AxisGapBar key={item.key} item={item} />
            ))}
          </div>

          {/* Radar chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-dm-sans mb-4 text-base font-bold text-gray-800">
              Vue Radar
            </h3>
            <RadarChart data={radarData} maxValue={4} />
          </div>
        </div>

        {/* ──── Right column: Training recommendations ──── */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-inside-blue" />
              <h3 className="font-dm-sans text-base font-bold text-gray-800">
                Plan de Montee en Competences
              </h3>
            </div>

            {!hasAnyGap ? (
              /* Perfect profile */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-dm-sans text-xl font-bold text-green-700">
                  Profil Parfait!
                </h4>
                <p className="mt-2 max-w-xs text-sm text-gray-500">
                  Le candidat atteint ou depasse toutes les cibles du profil{" "}
                  <span className="font-semibold">{roleLabel}</span>.
                </p>
              </div>
            ) : (
              /* Recommended modules list */
              <div className="space-y-5">
                {recommendedModules.map((mod) => {
                  const coveredGaps = gapsByModule[mod.moduleKey] ?? [];
                  return (
                    <div
                      key={mod.moduleKey}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-inside-blue" />
                        <h4 className="text-sm font-bold text-gray-800">
                          {mod.title}
                        </h4>
                      </div>

                      {mod.content && (
                        <p className="mb-3 pl-6 text-xs leading-relaxed text-gray-500">
                          {mod.content}
                        </p>
                      )}

                      {/* Gaps this module addresses */}
                      {coveredGaps.length > 0 && (
                        <div className="mb-3 pl-6">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Ecarts couverts
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {coveredGaps.map((g) => (
                              <span
                                key={g.key}
                                className="inline-flex items-center gap-1 rounded-full bg-inside-pink/10 px-2 py-0.5 text-[11px] font-medium text-inside-pink"
                              >
                                {FORMAT_LABELS[g.key] ?? g.key}
                                <span className="font-bold">
                                  -{g.delta}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Providers */}
                      {mod.providers.length > 0 && (
                        <div className="pl-6">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            Fournisseurs
                          </span>
                          <div className="mt-1 space-y-1.5">
                            {mod.providers.map((p, idx) => (
                              <div
                                key={`${mod.moduleKey}-p-${idx}`}
                                className="flex items-center gap-2"
                              >
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${providerBadgeClass(p.type)}`}
                                >
                                  {p.type}
                                </span>
                                <span className="text-xs font-medium text-gray-700">
                                  {p.name}
                                </span>
                                {p.detail && (
                                  <span className="text-xs text-gray-400">
                                    &mdash; {p.detail}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gap bar chart */}
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-dm-sans mb-4 text-base font-bold text-gray-800">
              Analyse des Ecarts
            </h3>
            <GapBarChart data={gapBarData} />
          </div>

          {/* Score gauge */}
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-dm-sans mb-4 text-center text-base font-bold text-gray-800">
              Score Global
            </h3>
            <ScoreGauge score={overallScore} label="Adequation au profil" size="lg" />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 5. ACTION BUTTONS (no-print)                                     */}
      {/* ================================================================ */}
      <div className="no-print mb-8 flex flex-wrap items-center justify-center gap-4">
        {/* Send by email */}
        <a
          href="/api/export/email"
          className="inline-flex items-center gap-2 rounded-lg bg-inside-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-inside-blue/90"
        >
          <Mail className="h-4 w-4" />
          Envoyer par Mail
        </a>

        {/* Save as PDF */}
        <a
          href={
            assessmentId
              ? `/api/export/pdf/${assessmentId}`
              : "#"
          }
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
        >
          <Printer className="h-4 w-4" />
          Sauvegarder en PDF
        </a>

        {/* New audit */}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          Nouvel Audit
        </button>
      </div>

      {/* ================================================================ */}
      {/* 6. FOOTER                                                        */}
      {/* ================================================================ */}
      <footer className="border-t border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-400">
          <img src="/images/logos/academy-picto.png" alt="" className="h-5 w-5 inline-block mr-1" />Genere par INSIDE Academy &bull; Matrice de competence V2.0
        </p>
      </footer>
    </section>
  );
}
