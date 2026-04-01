"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2, Plus, Loader2, X, AlertTriangle } from "lucide-react";
import { FORMAT_LABELS } from "@/lib/scoring";
import type { BaselineData, BaselineTargets } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionRow {
  id: number;
  key: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

interface FormState {
  roleKey: string;
  label: string;
  description: string;
  targets: Record<string, number>;
}

const EMPTY_FORM: FormState = {
  roleKey: "",
  label: "",
  description: "",
  targets: {},
};

// ---------------------------------------------------------------------------
// Color constants (INSIDE brand)
// ---------------------------------------------------------------------------

const BLUE = "#00548c";
const PINK = "#e31b58";
const CYAN = "#6bebf4";
const PURPLE = "#8883f0";
const YELLOW = "#ffe289";

const LEVEL_COLORS = [
  "#d1d5db", // 0 — gray-300
  CYAN,
  PURPLE,
  YELLOW,
  PINK,
];

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function DotLevel({ value, max = 4 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="inline-block h-2.5 w-2.5 rounded-full border"
          style={{
            backgroundColor: i < value ? LEVEL_COLORS[value] : "transparent",
            borderColor: i < value ? LEVEL_COLORS[value] : "#cbd5e1",
          }}
        />
      ))}
      <span
        className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: LEVEL_COLORS[value] || "#d1d5db" }}
      >
        {value}
      </span>
    </span>
  );
}

function LevelBar({ value, max = 4 }: { value: number; max?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-200">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: LEVEL_COLORS[value] || "#d1d5db",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function BaselinesAdminPage() {
  // ------ data state ------
  const [baselines, setBaselines] = useState<BaselineData[]>([]);
  const [questionKeys, setQuestionKeys] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------ dialog state ------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ------ delete confirm state ------
  const [deleteTarget, setDeleteTarget] = useState<BaselineData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ------ fetch helpers ------

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [blRes, qRes] = await Promise.all([
        fetch("/api/baselines"),
        fetch("/api/questions"),
      ]);
      if (!blRes.ok) throw new Error("Impossible de charger les profils.");
      if (!qRes.ok) throw new Error("Impossible de charger les questions.");

      const blJson = await blRes.json();
      const qJson = await qRes.json();

      setBaselines(blJson.data ?? []);
      setQuestionKeys(qJson.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ------ form helpers ------

  function openCreate() {
    const defaultTargets: Record<string, number> = {};
    for (const q of questionKeys) {
      defaultTargets[q.key] = 0;
    }
    setForm({ ...EMPTY_FORM, targets: defaultTargets });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(baseline: BaselineData) {
    const targets: Record<string, number> = {};
    for (const q of questionKeys) {
      targets[q.key] =
        (baseline.targets as BaselineTargets)[q.key] ?? 0;
    }
    setForm({
      roleKey: baseline.roleKey,
      label: baseline.label,
      description: baseline.description ?? "",
      targets,
    });
    setEditingId(baseline.id);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        roleKey: form.roleKey,
        label: form.label,
        description: form.description || undefined,
        targets: form.targets,
      };

      const url =
        editingId !== null
          ? `/api/admin/baselines/${editingId}`
          : "/api/admin/baselines";

      const res = await fetch(url, {
        method: editingId !== null ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody.error ?? `Erreur serveur (${res.status})`
        );
      }

      closeDialog();
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // ------ delete helpers ------

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/baselines/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        throw new Error("Impossible de supprimer le profil.");
      }
      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }

  // ------ label helper ------

  function labelFor(key: string): string {
    return FORMAT_LABELS[key] ?? key;
  }

  // ------ render ------

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ================================================================ */}
      {/* HEADER                                                          */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: BLUE }}
          >
            Gestion des Profils M&eacute;tier
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            D&eacute;finissez les niveaux cibles pour chaque r&ocirc;le.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: PINK }}
        >
          <Plus className="h-4 w-4" />
          Ajouter un profil
        </button>
      </div>

      {/* ================================================================ */}
      {/* LOADING / ERROR / EMPTY                                         */}
      {/* ================================================================ */}
      {loading && (
        <div className="mt-16 flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement&hellip;</span>
        </div>
      )}

      {!loading && error && (
        <div className="mt-16 rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && baselines.length === 0 && (
        <div className="mt-16 text-center text-gray-400">
          <p className="text-lg font-medium">Aucun profil m&eacute;tier</p>
          <p className="mt-1 text-sm">
            Cliquez sur &laquo;&nbsp;Ajouter un profil&nbsp;&raquo; pour commencer.
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* BASELINES GRID                                                  */}
      {/* ================================================================ */}
      {!loading && !error && baselines.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {baselines.map((bl) => {
            const targets = bl.targets as BaselineTargets;
            return (
              <div
                key={bl.id}
                className="relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* card header */}
                <div className="border-b border-gray-100 px-5 pt-5 pb-4">
                  <h2
                    className="text-lg font-bold leading-tight"
                    style={{ color: BLUE }}
                  >
                    {bl.label}
                  </h2>
                  <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                    {bl.roleKey}
                  </span>
                  {bl.description && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {bl.description}
                    </p>
                  )}
                </div>

                {/* targets grid */}
                <div className="flex-1 px-5 py-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Niveaux cibles
                  </p>
                  <div className="space-y-2.5">
                    {questionKeys.map((q) => {
                      const val = targets[q.key] ?? 0;
                      return (
                        <div key={q.key}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-gray-700">
                              {labelFor(q.key)}
                            </span>
                            <DotLevel value={val} />
                          </div>
                          <LevelBar value={val} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* card actions */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
                  <button
                    onClick={() => openEdit(bl)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition hover:bg-gray-100"
                    style={{ color: BLUE }}
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteTarget(bl)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* EDIT / CREATE DIALOG                                            */}
      {/* ================================================================ */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 pt-16 pb-10 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            {/* dialog header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3
                className="text-lg font-bold"
                style={{ color: BLUE }}
              >
                {editingId !== null
                  ? "Modifier le profil"
                  : "Nouveau profil m\u00e9tier"}
              </h3>
              <button
                onClick={closeDialog}
                className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* dialog body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {/* roleKey */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cl&eacute; du r&ocirc;le
                  </label>
                  <input
                    type="text"
                    value={form.roleKey}
                    disabled={editingId !== null}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, roleKey: e.target.value }))
                    }
                    placeholder="ex: sysadmin"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Slug unique (lettres minuscules, chiffres, tirets). Non modifiable apr&egrave;s cr&eacute;ation.
                  </p>
                </div>

                {/* label */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Libell&eacute;
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                    placeholder="ex: Ing\u00e9nieur Syst\u00e8me"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* description */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Description du profil m\u00e9tier\u2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* targets */}
                <div>
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Niveaux cibles
                  </p>
                  <div className="space-y-3">
                    {questionKeys.map((q) => {
                      const val = form.targets[q.key] ?? 0;
                      return (
                        <div
                          key={q.key}
                          className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                            {labelFor(q.key)}
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={4}
                            step={1}
                            value={val}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                targets: {
                                  ...f.targets,
                                  [q.key]: parseInt(e.target.value, 10),
                                },
                              }))
                            }
                            className="h-2 w-28 cursor-pointer accent-[#00548c]"
                          />
                          <span
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{
                              backgroundColor: LEVEL_COLORS[val] || "#d1d5db",
                            }}
                          >
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* dialog footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={closeDialog}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.roleKey.trim() || !form.label.trim()}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: BLUE }}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId !== null ? "Enregistrer" : "Cr\u00e9er"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DELETE CONFIRMATION                                             */}
      {/* ================================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Supprimer le profil
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  &Ecirc;tes-vous s&ucirc;r de vouloir supprimer le profil{" "}
                  <strong>{deleteTarget.label}</strong>{" "}
                  <span className="font-mono text-gray-400">
                    ({deleteTarget.roleKey})
                  </span>
                  &nbsp;? Cette action est irr&eacute;versible.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
