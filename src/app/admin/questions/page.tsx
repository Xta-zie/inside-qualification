"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { QuestionData } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  blue: "#00548c",
  pink: "#e31b58",
  cyan: "#6bebf4",
  purple: "#8883f0",
  yellow: "#ffe289",
} as const;

const LEVEL_LABELS = [
  "Niveau 0 - Aucune comp\u00e9tence",
  "Niveau 1 - D\u00e9butant",
  "Niveau 2 - Interm\u00e9diaire",
  "Niveau 3 - Avanc\u00e9",
  "Niveau 4 - Expert",
];

const emptyQuestion: QuestionData = {
  id: 0,
  key: "",
  category: "",
  levels: ["", "", "", "", ""],
  sortOrder: 0,
  isActive: true,
};

// ---------------------------------------------------------------------------
// Toast component
// ---------------------------------------------------------------------------

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-lg px-4 py-3 text-white text-sm shadow-lg animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: t.type === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionData | null>(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ---- Toast helper -------------------------------------------------------

  const addToast = useCallback(
    (message: string, type: "success" | "error") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  // ---- Fetch questions ----------------------------------------------------

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/questions?active=false");
      if (!res.ok) throw new Error("Erreur lors du chargement des questions");
      const json = await res.json();
      setQuestions(json.data ?? []);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Erreur inconnue",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ---- CRUD handlers ------------------------------------------------------

  const openNewDialog = () => {
    const nextOrder =
      questions.length > 0
        ? Math.max(...questions.map((q) => q.sortOrder)) + 1
        : 1;
    setEditingQuestion({ ...emptyQuestion, sortOrder: nextOrder });
    setIsNewQuestion(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (q: QuestionData) => {
    setEditingQuestion({ ...q, levels: [...q.levels] });
    setIsNewQuestion(false);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    if (!editingQuestion.key.trim() || !editingQuestion.category.trim()) {
      addToast("La cl\u00e9 et la cat\u00e9gorie sont requises.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        key: editingQuestion.key,
        category: editingQuestion.category,
        levels: editingQuestion.levels,
        sortOrder: editingQuestion.sortOrder,
        isActive: editingQuestion.isActive,
      };

      if (isNewQuestion) {
        const res = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Erreur lors de la cr\u00e9ation");
        }
        addToast("Question cr\u00e9\u00e9e avec succ\u00e8s.", "success");
      } else {
        const res = await fetch(
          `/api/admin/questions/${editingQuestion.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.error ?? "Erreur lors de la mise \u00e0 jour",
          );
        }
        addToast("Question mise \u00e0 jour.", "success");
      }

      closeDialog();
      await fetchQuestions();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Erreur inconnue",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/questions/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Erreur lors de la suppression");
      }
      addToast("Question supprim\u00e9e.", "success");
      setDeleteTarget(null);
      await fetchQuestions();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Erreur inconnue",
        "error",
      );
    }
  };

  const handleToggleActive = async (q: QuestionData) => {
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !q.isActive }),
      });
      if (!res.ok) throw new Error("Erreur lors du basculement");
      await fetchQuestions();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Erreur inconnue",
        "error",
      );
    }
  };

  // ---- Reorder ------------------------------------------------------------

  const handleReorder = async (
    q: QuestionData,
    direction: "up" | "down",
  ) => {
    const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((item) => item.id === q.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const neighbor = sorted[swapIdx];

    try {
      await Promise.all([
        fetch(`/api/admin/questions/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: neighbor.sortOrder }),
        }),
        fetch(`/api/admin/questions/${neighbor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
      await fetchQuestions();
    } catch {
      addToast("Erreur lors du r\u00e9ordonnancement", "error");
    }
  };

  // ---- Form field updater -------------------------------------------------

  const updateField = <K extends keyof QuestionData>(
    field: K,
    value: QuestionData[K],
  ) => {
    setEditingQuestion((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateLevel = (index: number, value: string) => {
    setEditingQuestion((prev) => {
      if (!prev) return prev;
      const levels = [...prev.levels];
      levels[index] = value;
      return { ...prev, levels };
    });
  };

  // ---- Sorted list --------------------------------------------------------

  const sortedQuestions = [...questions].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  // ---- Render -------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <ToastContainer toasts={toasts} />

      {/* ----------------------------------------------------------------- */}
      {/* HEADER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="mb-8 flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: COLORS.blue }}
        >
          Gestion des Questions
        </h1>
        <button
          onClick={openNewDialog}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90"
          style={{ backgroundColor: COLORS.pink }}
        >
          <Plus size={18} />
          Ajouter une question
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* LOADING / EMPTY                                                   */}
      {/* ----------------------------------------------------------------- */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          Chargement...
        </div>
      )}

      {!loading && sortedQuestions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center text-gray-400">
          Aucune question trouv\u00e9e. Cliquez sur &quot;Ajouter une
          question&quot; pour commencer.
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* QUESTIONS LIST                                                    */}
      {/* ----------------------------------------------------------------- */}
      {!loading && sortedQuestions.length > 0 && (
        <div className="flex flex-col gap-4">
          {sortedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start gap-4">
                {/* Sort-order badge */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: COLORS.blue }}
                >
                  {q.sortOrder}
                </div>

                {/* Key + Category */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {q.key}
                    </code>
                    <span className="text-base font-bold text-gray-800">
                      {q.category}
                    </span>
                  </div>

                  {/* Level previews */}
                  <div className="mt-2 space-y-0.5">
                    {q.levels.map((lvl, li) => (
                      <p
                        key={li}
                        className="truncate text-xs text-gray-500"
                        title={lvl}
                      >
                        <span
                          className="mr-1 inline-block font-semibold"
                          style={{ color: COLORS.purple }}
                        >
                          N{li}
                        </span>
                        {lvl || (
                          <span className="italic text-gray-300">
                            (vide)
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Right-side controls */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(q)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
                    style={{
                      backgroundColor: q.isActive ? "#16a34a" : "#d1d5db",
                    }}
                    title={q.isActive ? "Active" : "Inactive"}
                  >
                    <span
                      className="inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform"
                      style={{
                        transform: q.isActive
                          ? "translateX(1.375rem) translateY(0.125rem)"
                          : "translateX(0.125rem) translateY(0.125rem)",
                      }}
                    />
                  </button>

                  {/* Reorder */}
                  <button
                    onClick={() => handleReorder(q, "up")}
                    disabled={idx === 0}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                    title="Monter"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => handleReorder(q, "down")}
                    disabled={idx === sortedQuestions.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                    title="Descendre"
                  >
                    <ChevronDown size={18} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditDialog(q)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(q)}
                    className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* EDIT / CREATE DIALOG                                              */}
      {/* ----------------------------------------------------------------- */}
      {isDialogOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2
              className="mb-6 text-lg font-bold"
              style={{ color: COLORS.blue }}
            >
              {isNewQuestion
                ? "Nouvelle question"
                : "Modifier la question"}
            </h2>

            <div className="space-y-4">
              {/* Key */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cl\u00e9 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingQuestion.key}
                  onChange={(e) => updateField("key", e.target.value)}
                  disabled={!isNewQuestion}
                  placeholder="ex: linux-basics"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cat\u00e9gorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingQuestion.category}
                  onChange={(e) =>
                    updateField("category", e.target.value)
                  }
                  placeholder="ex: Pr\u00e9requis Linux"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Sort order + Active row */}
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={editingQuestion.sortOrder}
                    onChange={(e) =>
                      updateField(
                        "sortOrder",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-2 pt-5 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={editingQuestion.isActive}
                    onChange={(e) =>
                      updateField("isActive", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Active
                </label>
              </div>

              {/* Levels */}
              <div>
                <p
                  className="mb-2 text-sm font-semibold"
                  style={{ color: COLORS.purple }}
                >
                  Niveaux
                </p>
                <div className="space-y-3">
                  {LEVEL_LABELS.map((label, li) => (
                    <div key={li}>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        {label}
                      </label>
                      <textarea
                        rows={2}
                        value={editingQuestion.levels[li] ?? ""}
                        onChange={(e) => updateLevel(li, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeDialog}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: COLORS.blue }}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION                                               */}
      {/* ----------------------------------------------------------------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              Confirmer la suppression
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Voulez-vous vraiment supprimer la question{" "}
              <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                {deleteTarget.key}
              </code>
              &nbsp;? Cette action est irr\u00e9versible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
