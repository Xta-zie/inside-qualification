// ============================================================================
// GET /api/export/pdf/[id] — Generate and return a PDF assessment report
// ============================================================================

import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { assessments, baselines, trainingModules } from "@/db/schema";
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
  getRecommendedModules,
  FORMAT_LABELS,
} from "@/lib/scoring";
import { AssessmentPDFDocument } from "@/lib/pdf";
import { TARGET_ROLE_LABELS } from "@/types";
import type { AnswerMap, TargetRole, TrainingProvider } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid assessment ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Fetch assessment ──────────────────────────────────────────────────
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (!assessment) {
      return new Response(
        JSON.stringify({ error: "Assessment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Fetch baseline for the target role ────────────────────────────────
    const [baseline] = await db
      .select()
      .from(baselines)
      .where(eq(baselines.roleKey, assessment.targetRole))
      .limit(1);

    if (!baseline) {
      return new Response(
        JSON.stringify({
          error: `No baseline found for role "${assessment.targetRole}"`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const answers = assessment.answers as AnswerMap;
    const targets = baseline.targets as Record<string, number>;

    // ── Compute scores ────────────────────────────────────────────────────
    const overallScore = calculateOverallScore(answers, targets);
    const avgPrereq = calculateAverageLevel(answers, getPrereqKeys());
    const avgOpenstack = calculateAverageLevel(answers, getOpenstackKeys());

    const prereqStatus = getPrereqStatus(avgPrereq);
    const openstackStatus = getOpenstackStatus(avgOpenstack);

    const prereqRecommendation = getPrereqRecommendation(avgPrereq);
    const openstackRecommendation = getOpenstackRecommendation(avgOpenstack);

    // ── Gap analysis ──────────────────────────────────────────────────────
    const gaps = calculateGapAnalysis(answers, targets);
    const gapAnalysis = gaps.map((g) => ({
      ...g,
      label: FORMAT_LABELS[g.key] ?? g.key,
    }));

    // ── Training modules ──────────────────────────────────────────────────
    const recommendedModuleKeys = getRecommendedModules(gaps);

    let trainingMods: Array<{
      title: string;
      content: string;
      providers: TrainingProvider[];
    }> = [];

    if (recommendedModuleKeys.length > 0) {
      const dbModules = await db
        .select()
        .from(trainingModules)
        .where(inArray(trainingModules.moduleKey, recommendedModuleKeys));

      trainingMods = dbModules.map((m) => ({
        title: m.title,
        content: m.content ?? "",
        providers: (m.providers as TrainingProvider[] | null) ?? [],
      }));
    }

    // ── Build date string ─────────────────────────────────────────────────
    const generatedAt = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ── Render PDF ────────────────────────────────────────────────────────
    const roleLabel =
      TARGET_ROLE_LABELS[assessment.targetRole as TargetRole] ??
      assessment.targetRole;

    const doc = AssessmentPDFDocument({
      candidateName: assessment.candidateName,
      candidateEmail: assessment.candidateEmail,
      roleLabel,
      overallScore,
      avgPrereq,
      avgOpenstack,
      prereqStatus,
      openstackStatus,
      prereqRecommendation,
      openstackRecommendation,
      gapAnalysis,
      trainingModules: trainingMods,
      generatedAt,
    });

    const buffer = await renderToBuffer(doc as any);

    // ── Build filename ────────────────────────────────────────────────────
    const safeName = assessment.candidateName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `INSIDE_Audit_${safeName}_${dateStr}.pdf`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/export/pdf/[id] error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF report" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
