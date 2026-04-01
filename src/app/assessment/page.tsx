"use client";

import { useState, useEffect, useCallback } from "react";
import StepRole from "@/components/assessment/StepRole";
import StepQuiz from "@/components/assessment/StepQuiz";
import StepReport from "@/components/assessment/StepReport";
import type {
  QuestionData,
  BaselineData,
  TrainingModuleData,
  AnswerMap,
} from "@/types";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Role", "Quiz", "Rapport"] as const;

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as Step;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;

        return (
          <div key={label} className="flex items-center gap-2">
            {idx > 0 && (
              <div
                className={`hidden h-px w-6 sm:block ${
                  isCompleted ? "bg-inside-blue" : "bg-gray-300"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-3 w-3 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? "bg-inside-blue ring-2 ring-inside-blue/30"
                    : isCompleted
                      ? "bg-inside-blue"
                      : "bg-gray-300"
                }`}
              />
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  isActive
                    ? "text-inside-blue"
                    : isCompleted
                      ? "text-gray-600"
                      : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AssessmentPage() {
  // ---- wizard state ----
  const [step, setStep] = useState<Step>(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [identity, setIdentity] = useState({ name: "", email: "" });
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // ---- data state ----
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [baselines, setBaselines] = useState<BaselineData[]>([]);
  const [trainingModules, setTrainingModules] = useState<TrainingModuleData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- fetch reference data on mount ----
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [questionsRes, baselinesRes, trainingRes] = await Promise.all([
          fetch("/api/questions"),
          fetch("/api/baselines"),
          fetch("/api/training"),
        ]);

        if (!questionsRes.ok || !baselinesRes.ok || !trainingRes.ok) {
          throw new Error("Erreur lors du chargement des données de référence");
        }

        const [questionsJson, baselinesJson, trainingJson] = await Promise.all([
          questionsRes.json(),
          baselinesRes.json(),
          trainingRes.json(),
        ]);

        setQuestions(questionsJson.data ?? questionsJson);
        setBaselines(baselinesJson.data ?? baselinesJson);
        setTrainingModules(trainingJson.data ?? trainingJson);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement inconnue",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ---- step handlers ----
  const handleRoleSelect = useCallback((roleKey: string) => {
    setSelectedRole(roleKey);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleQuizFinish = useCallback(
    async () => {
      try {
        const res = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName: identity.name,
            candidateEmail: identity.email,
            targetRole: selectedRole,
            answers,
          }),
        });

        if (!res.ok) {
          throw new Error("Erreur lors de la sauvegarde de l'évaluation");
        }

        const json = await res.json();
        setAssessmentId(json.data?.id ?? json.id ?? null);
      } catch (err) {
        console.error("Failed to save assessment:", err);
      }

      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [identity, selectedRole, answers],
  );

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedRole(null);
    setAnswers({});
    setIdentity({ name: "", email: "" });
    setAssessmentId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ---- loading / error states ----
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-inside-blue" />
          <p className="text-sm text-gray-500">
            Chargement des données d&apos;évaluation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-2 font-semibold text-red-700">Erreur</p>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ---- resolve current baseline ----
  const currentBaseline = baselines.find((b) => b.roleKey === selectedRole);

  return (
    <>
      {/* Header bar */}
      <header className="mb-8 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/images/logos/inside-blason-couleur.png" alt="INSIDE" className="h-10 w-10" />
          <span className="font-dm-sans text-lg font-semibold text-gray-800">
            INSIDE <span className="font-normal text-gray-500">Qualification</span>
          </span>
        </div>
        <StepIndicator current={step} />
      </header>

      {/* Step content */}
      {step === 1 && (
        <StepRole
          baselines={baselines.map((b) => ({
            roleKey: b.roleKey,
            label: b.label,
            description: b.description ?? "",
            targets: b.targets,
          }))}
          identity={identity}
          setIdentity={setIdentity}
          onSelect={handleRoleSelect}
        />
      )}

      {step === 2 && selectedRole && (
        <StepQuiz
          questions={questions.map((q) => ({
            id: q.id,
            key: q.key,
            category: q.category,
            levels: q.levels as string[],
            sortOrder: q.sortOrder,
          }))}
          answers={answers}
          setAnswers={setAnswers}
          onFinish={handleQuizFinish}
        />
      )}

      {step === 3 && selectedRole && (
        <StepReport
          roleKey={selectedRole}
          roleLabel={currentBaseline?.label ?? selectedRole}
          targets={currentBaseline?.targets ?? {}}
          answers={answers}
          identity={identity}
          questions={questions.map((q) => ({ key: q.key, category: q.category }))}
          trainingModules={trainingModules.map((m) => ({
            moduleKey: m.moduleKey,
            title: m.title,
            content: m.content ?? "",
            linkedQuestionKeys: m.linkedQuestionKeys ?? [],
            providers: m.providers ?? [],
          }))}
          assessmentId={assessmentId ?? undefined}
          onReset={handleReset}
        />
      )}
    </>
  );
}
