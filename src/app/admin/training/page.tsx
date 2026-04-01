"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FORMAT_LABELS } from "@/lib/scoring";
import type { TrainingModuleData, TrainingProvider, QuestionData } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModuleFormValues {
  moduleKey: string;
  title: string;
  content: string;
  linkedQuestionKeys: string[];
  providers: TrainingProvider[];
}

const EMPTY_FORM: ModuleFormValues = {
  moduleKey: "",
  title: "",
  content: "",
  linkedQuestionKeys: [],
  providers: [],
};

const EMPTY_PROVIDER: TrainingProvider = { name: "", type: "", detail: "" };

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminTrainingPage() {
  // Data
  const [modules, setModules] = useState<TrainingModuleData[]>([]);
  const [questionKeys, setQuestionKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModuleData | null>(
    null,
  );
  const [form, setForm] = useState<ModuleFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<TrainingModuleData | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch modules
  // -----------------------------------------------------------------------

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/training");
      if (!res.ok) throw new Error("Erreur lors du chargement des modules");
      const json = await res.json();
      setModules(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Fetch question keys (for linked question selection)
  // -----------------------------------------------------------------------

  const fetchQuestionKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) return;
      const json = await res.json();
      const questions: QuestionData[] = json.data ?? [];
      const keys = questions.map((q) => q.key);
      // Deduplicate while preserving order
      setQuestionKeys([...new Set(keys)]);
    } catch {
      // Non-critical: fall back to FORMAT_LABELS keys
      setQuestionKeys(Object.keys(FORMAT_LABELS));
    }
  }, []);

  useEffect(() => {
    fetchModules();
    fetchQuestionKeys();
  }, [fetchModules, fetchQuestionKeys]);

  // -----------------------------------------------------------------------
  // All available question keys (union of fetched + FORMAT_LABELS)
  // -----------------------------------------------------------------------

  const allQuestionKeys =
    questionKeys.length > 0
      ? questionKeys
      : Object.keys(FORMAT_LABELS);

  // -----------------------------------------------------------------------
  // Dialog helpers
  // -----------------------------------------------------------------------

  function openCreate() {
    setEditingModule(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(mod: TrainingModuleData) {
    setEditingModule(mod);
    setForm({
      moduleKey: mod.moduleKey,
      title: mod.title,
      content: mod.content ?? "",
      linkedQuestionKeys: [...mod.linkedQuestionKeys],
      providers: mod.providers.map((p) => ({ ...p })),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingModule(null);
    setFormError(null);
  }

  // -----------------------------------------------------------------------
  // Form field handlers
  // -----------------------------------------------------------------------

  function updateField(field: keyof ModuleFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleQuestionKey(key: string) {
    setForm((prev) => {
      const keys = prev.linkedQuestionKeys.includes(key)
        ? prev.linkedQuestionKeys.filter((k) => k !== key)
        : [...prev.linkedQuestionKeys, key];
      return { ...prev, linkedQuestionKeys: keys };
    });
  }

  function updateProvider(
    index: number,
    field: keyof TrainingProvider,
    value: string,
  ) {
    setForm((prev) => {
      const providers = [...prev.providers];
      providers[index] = { ...providers[index], [field]: value };
      return { ...prev, providers };
    });
  }

  function addProvider() {
    setForm((prev) => ({
      ...prev,
      providers: [...prev.providers, { ...EMPTY_PROVIDER }],
    }));
  }

  function removeProvider(index: number) {
    setForm((prev) => ({
      ...prev,
      providers: prev.providers.filter((_, i) => i !== index),
    }));
  }

  // -----------------------------------------------------------------------
  // Save (create / update)
  // -----------------------------------------------------------------------

  async function handleSave() {
    setFormError(null);

    if (!form.moduleKey.trim() || !form.title.trim()) {
      setFormError("La cle du module et le titre sont requis.");
      return;
    }

    // Validate providers: all fields must be filled if any providers exist
    for (const p of form.providers) {
      if (!p.name.trim() || !p.type.trim() || !p.detail.trim()) {
        setFormError(
          "Chaque fournisseur doit avoir un nom, un type et un detail.",
        );
        return;
      }
    }

    setSaving(true);
    try {
      const isEdit = !!editingModule;
      const url = isEdit
        ? `/api/admin/training/${editingModule!.id}`
        : "/api/admin/training";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: form.title,
        content: form.content || undefined,
        linkedQuestionKeys: form.linkedQuestionKeys,
        providers: form.providers,
      };
      if (!isEdit) {
        body.moduleKey = form.moduleKey;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erreur lors de la sauvegarde");
      }

      closeDialog();
      fetchModules();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/training/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Erreur lors de la suppression");
      }
      setDeleteTarget(null);
      fetchModules();
    } catch {
      // Keep the dialog open so user sees something went wrong
      setFormError("La suppression a echoue.");
    } finally {
      setDeleting(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-wide text-[#00548c]">
            Gestion des Modules de Formation
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Creer, modifier et supprimer les modules de formation
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#e31b58] text-white hover:bg-[#c4164d]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un module
        </Button>
      </div>

      {/* Main content */}
      {error ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border p-12 text-[#e31b58]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00548c]" />
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-gray-400">
          <BookOpen className="mb-2 h-10 w-10" />
          <p>Aucun module de formation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {modules.map((mod) => (
            <Card key={mod.id} className="hover:border-gray-300">
              <CardContent className="space-y-3 p-5">
                {/* Title & key */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-[#00548c]">
                      {mod.title}
                    </h2>
                    <span className="inline-block mt-1 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                      {mod.moduleKey}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(mod)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setDeleteTarget(mod)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {mod.content && (
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {mod.content}
                  </p>
                )}

                {/* Linked question keys */}
                {mod.linkedQuestionKeys.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Competences liees
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {mod.linkedQuestionKeys.map((key) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs border-[#8883f0] text-[#8883f0]"
                        >
                          {FORMAT_LABELS[key] ?? key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Providers */}
                {mod.providers.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      Fournisseurs
                    </p>
                    <div className="overflow-x-auto rounded border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-left text-gray-500">
                            <th className="px-2 py-1 font-medium">Nom</th>
                            <th className="px-2 py-1 font-medium">Type</th>
                            <th className="px-2 py-1 font-medium">Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mod.providers.map((prov, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{prov.name}</td>
                              <td className="px-2 py-1">
                                <span className="inline-block rounded bg-[#ffe289] px-1.5 py-0.5 text-xs font-medium text-gray-800">
                                  {prov.type}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-gray-600">
                                {prov.detail}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* Edit / Create Dialog (inline overlay)                             */}
      {/* ================================================================= */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            {/* Dialog header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#00548c]">
                {editingModule ? "Modifier le module" : "Nouveau module"}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeDialog}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form error */}
            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Module key */}
              <div>
                <Label htmlFor="moduleKey">Cle du module</Label>
                <Input
                  id="moduleKey"
                  placeholder="ex: mod_linux"
                  value={form.moduleKey}
                  onChange={(e) => updateField("moduleKey", e.target.value)}
                  disabled={!!editingModule}
                  className="mt-1 font-mono"
                />
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Titre du module"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="content">Description</Label>
                <textarea
                  id="content"
                  rows={3}
                  placeholder="Contenu / description du module..."
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#00548c] focus:outline-none focus:ring-1 focus:ring-[#00548c]"
                />
              </div>

              {/* Linked question keys */}
              <div>
                <Label>Competences liees</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allQuestionKeys.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.linkedQuestionKeys.includes(key)}
                        onChange={() => toggleQuestionKey(key)}
                        className="h-4 w-4 rounded border-gray-300 text-[#00548c] focus:ring-[#00548c]"
                      />
                      <span className="truncate">
                        {FORMAT_LABELS[key] ?? key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Providers */}
              <div>
                <Label>Fournisseurs</Label>
                <div className="mt-2 space-y-2">
                  {form.providers.map((prov, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded border bg-gray-50 p-2"
                    >
                      <div className="grid flex-1 grid-cols-3 gap-2">
                        <Input
                          placeholder="Nom"
                          value={prov.name}
                          onChange={(e) =>
                            updateProvider(idx, "name", e.target.value)
                          }
                          className="text-sm"
                        />
                        <Input
                          placeholder="Type"
                          value={prov.type}
                          onChange={(e) =>
                            updateProvider(idx, "type", e.target.value)
                          }
                          className="text-sm"
                        />
                        <Input
                          placeholder="Detail"
                          value={prov.detail}
                          onChange={(e) =>
                            updateProvider(idx, "detail", e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-red-500 hover:text-red-700"
                        onClick={() => removeProvider(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addProvider}
                    className="w-full"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Ajouter un fournisseur
                  </Button>
                </div>
              </div>
            </div>

            {/* Dialog footer */}
            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={closeDialog} disabled={saving}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#00548c] text-white hover:bg-[#004070]"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingModule ? "Enregistrer" : "Creer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Delete confirmation (inline overlay)                              */}
      {/* ================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Confirmer la suppression
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Etes-vous sur de vouloir supprimer le module{" "}
              <span className="font-semibold text-[#00548c]">
                {deleteTarget.title}
              </span>{" "}
              ? Cette action est irreversible.
            </p>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteTarget(null);
                  setFormError(null);
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
