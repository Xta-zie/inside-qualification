import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { assessments, baselines } from "@/db/schema";
import { eq, desc, sql, and, gte, lte, like } from "drizzle-orm";
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

const createAssessmentSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  candidateEmail: z.string().email("Invalid email address"),
  targetRole: z.enum(["sysadmin", "architect", "ops"]),
  answers: z.record(z.string(), z.number().min(0).max(5)),
  conductedBy: z.string().nullable().optional(),
  conductedByName: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/assessments
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10)));
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build dynamic where conditions
    const conditions = [];

    if (role) {
      conditions.push(eq(assessments.targetRole, role as "sysadmin" | "architect" | "ops"));
    }

    if (search) {
      conditions.push(
        sql`(${assessments.candidateName} ILIKE ${`%${search}%`} OR ${assessments.candidateEmail} ILIKE ${`%${search}%`})`,
      );
    }

    if (dateFrom) {
      conditions.push(gte(assessments.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(assessments.createdAt, new Date(dateTo)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Run data + count queries in parallel
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(assessments)
        .where(whereClause)
        .orderBy(desc(assessments.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(assessments)
        .where(whereClause),
    ]);

    const total = Number(countResult[0].count);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/assessments
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = createAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { candidateName, candidateEmail, targetRole, answers, conductedBy, conductedByName } = parsed.data;

    // Fetch baseline targets for the target role
    const baseline = await db
      .select()
      .from(baselines)
      .where(eq(baselines.roleKey, targetRole))
      .limit(1);

    if (baseline.length === 0) {
      return NextResponse.json(
        { error: `No baseline found for role "${targetRole}"` },
        { status: 400 },
      );
    }

    const targets = baseline[0].targets as Record<string, number>;
    const answersMap = answers as AnswerMap;

    const overallScore = calculateOverallScore(answersMap, targets);
    const avgPrereq = calculateAverageLevel(answersMap, getPrereqKeys());
    const avgOpenstack = calculateAverageLevel(answersMap, getOpenstackKeys());

    const [inserted] = await db
      .insert(assessments)
      .values({
        candidateName,
        candidateEmail,
        targetRole,
        answers,
        conductedBy: conductedBy ?? null,
        conductedByName: conductedByName ?? null,
        overallScore,
        avgPrereq,
        avgOpenstack,
        completedAt: new Date(),
      })
      .returning({
        id: assessments.id,
        overallScore: assessments.overallScore,
        avgPrereq: assessments.avgPrereq,
        avgOpenstack: assessments.avgOpenstack,
      });

    return NextResponse.json({ data: inserted }, { status: 201 });
  } catch (error) {
    console.error("POST /api/assessments error:", error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 },
    );
  }
}
