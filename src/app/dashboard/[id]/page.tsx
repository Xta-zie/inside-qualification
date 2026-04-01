"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Trash2 } from "lucide-react";
import StepReport from "@/components/assessment/StepReport";
import type {
  AssessmentData,
  BaselineData,
  TrainingModuleData,
  QuestionData,
} from "@/types";
import { TARGET_ROLE_LABELS } from "@/types";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-32 rounded-lg bg-gray-200" />
          <div className="h-10 w-32 rounded-lg bg-gray-200" />
        </div>
      </div>
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-96 rounded bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-200" />
        <div className="h-4 w-48 rounded bg-gray-200" />
      </div>
      {/* Cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-xl bg-gray-200" />
        <div className="h-48 rounded-xl bg-gray-200" />
      </div>
      {/* Chart skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-80 rounded-xl bg-gray-200" />
        <div className="h-80 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not-found view
// ---------------------------------------------------------------------------

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-3xl tracking-wide text-inside-blue">
        Évaluation non trouvée
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Cette évaluation n&apos;existe pas ou a été supprimée.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-inside-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-inside-blue/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [trainingModules, setTrainingModules] = useState<TrainingModuleData[]>(
    [],
  );
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch all data ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchData() {
      try {
        // 1. Fetch assessment
        const assessmentRes = await fetch(`/api/assessments/${id}`);
        if (!assessmentRes.ok) {
          if (assessmentRes.status === 404 || assessmentRes.status === 400) {
            if (!cancelled) setNotFound(true);
            return;
          }
          throw new Error("Failed to fetch assessment");
        }
        const assessmentJson = await assessmentRes.json();
        const assessmentData = assessmentJson.data as AssessmentData;

        // 2. Fetch baseline, training, and questions in parallel
        const [baselineRes, trainingRes, questionsRes] = await Promise.all([
          fetch(`/api/baselines/${assessmentData.targetRole}`),
          fetch("/api/training"),
          fetch("/api/questions"),
        ]);

        if (!baselineRes.ok) throw new Error("Failed to fetch baseline");
        if (!trainingRes.ok) throw new Error("Failed to fetch training");
        if (!questionsRes.ok) throw new Error("Failed to fetch questions");

        const baselineJson = await baselineRes.json();
        const trainingJson = await trainingRes.json();
        const questionsJson = await questionsRes.json();

        if (!cancelled) {
          setAssessment(assessmentData);
          setBaseline(baselineJson.data as BaselineData);
          setTrainingModules(
            (trainingJson.data ?? trainingJson) as TrainingModuleData[],
          );
          setQuestions(
            (questionsJson.data ?? questionsJson) as QuestionData[],
          );
        }
      } catch (err) {
        console.error("Error loading assessment detail:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Delete handler ────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        router.push("/dashboard");
      } else {
        alert("Erreur lors de la suppression. Veuillez réessayer.");
      }
    } catch {
      alert("Erreur lors de la suppression. Veuillez réessayer.");
    } finally {
      setDeleting(false);
    }
  }, [id, router]);

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return <Skeleton />;
  }

  if (notFound || !assessment || !baseline) {
    return <NotFound />;
  }

  const roleLabel =
    TARGET_ROLE_LABELS[assessment.targetRole] ?? assessment.targetRole;

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* Top bar: back button + actions                                   */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-inside-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Export PDF */}
          <button
            type="button"
            onClick={() => window.open(`/api/export/pdf/${id}`, "_blank")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4" />
            Exporter PDF
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Report                                                           */}
      {/* ================================================================ */}
      <StepReport
        roleKey={assessment.targetRole}
        roleLabel={roleLabel}
        targets={baseline.targets}
        answers={assessment.answers}
        identity={{
          name: assessment.candidateName,
          email: assessment.candidateEmail,
        }}
        questions={questions.map((q) => ({ key: q.key, category: q.category }))}
        trainingModules={trainingModules.map((m) => ({
          moduleKey: m.moduleKey,
          title: m.title,
          content: m.content ?? "",
          linkedQuestionKeys: m.linkedQuestionKeys,
          providers: m.providers,
        }))}
        onReset={() => router.push("/dashboard")}
        assessmentId={id}
      />
    </div>
  );
}
