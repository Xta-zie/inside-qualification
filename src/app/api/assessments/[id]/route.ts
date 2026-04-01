import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { assessments, baselines } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateOverallScore,
  calculateAverageLevel,
  getPrereqKeys,
  getOpenstackKeys,
} from "@/lib/scoring";
import type { AnswerMap } from "@/types";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const updateAssessmentSchema = z.object({
  candidateName: z.string().min(1).optional(),
  candidateEmail: z.string().email().optional(),
  targetRole: z.enum(["sysadmin", "architect", "ops"]).optional(),
  answers: z.record(z.string(), z.number().min(0).max(5)).optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET /api/assessments/[id]
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json({ data: assessment });
  } catch (error) {
    console.error("GET /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/assessments/[id]
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 },
      );
    }

    // Fetch the existing assessment to merge data for score recalculation
    const [existing] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Build the values to set
    const setValues: Record<string, unknown> = {};

    if (updates.candidateName !== undefined) {
      setValues.candidateName = updates.candidateName;
    }
    if (updates.candidateEmail !== undefined) {
      setValues.candidateEmail = updates.candidateEmail;
    }
    if (updates.targetRole !== undefined) {
      setValues.targetRole = updates.targetRole;
    }
    if (updates.answers !== undefined) {
      setValues.answers = updates.answers;
    }

    // Recalculate scores if answers or targetRole changed
    if (updates.answers !== undefined || updates.targetRole !== undefined) {
      const effectiveRole = updates.targetRole ?? existing.targetRole;
      const effectiveAnswers = (updates.answers ?? existing.answers) as AnswerMap;

      const baseline = await db
        .select()
        .from(baselines)
        .where(eq(baselines.roleKey, effectiveRole))
        .limit(1);

      if (baseline.length === 0) {
        return NextResponse.json(
          { error: `No baseline found for role "${effectiveRole}"` },
          { status: 400 },
        );
      }

      const targets = baseline[0].targets as Record<string, number>;

      setValues.overallScore = calculateOverallScore(effectiveAnswers, targets);
      setValues.avgPrereq = calculateAverageLevel(effectiveAnswers, getPrereqKeys());
      setValues.avgOpenstack = calculateAverageLevel(effectiveAnswers, getOpenstackKeys());
    }

    const [updated] = await db
      .update(assessments)
      .set(setValues)
      .where(eq(assessments.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/assessments/[id]
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(assessments)
      .where(eq(assessments.id, id))
      .returning({ id: assessments.id });

    if (!deleted) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 },
    );
  }
}
