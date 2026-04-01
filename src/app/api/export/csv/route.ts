// ============================================================================
// GET /api/export/csv — Export all assessments as CSV
// ============================================================================

import { NextRequest } from "next/server";
import { desc, eq, and, gte, lte } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assessments } from "@/db/schema";
import { FORMAT_LABELS } from "@/lib/scoring";
import { TARGET_ROLE_LABELS } from "@/types";
import type { AnswerMap, TargetRole } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All question keys in display order (matches FORMAT_LABELS iteration). */
const QUESTION_KEYS = Object.keys(FORMAT_LABELS);

/**
 * Escapes a CSV field value: wraps in double-quotes if the value contains
 * a comma, double-quote, or newline. Internal double-quotes are doubled.
 */
function csvEscape(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Formats a Date to YYYY-MM-DD. */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // ------------------------------------------------------------------
    // Auth check — if a session exists, allow; otherwise 401
    // ------------------------------------------------------------------
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------------
    // Query params
    // ------------------------------------------------------------------
    const { searchParams } = request.nextUrl;
    const role = searchParams.get("role");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build dynamic where conditions
    const conditions = [];

    if (role) {
      conditions.push(
        eq(assessments.targetRole, role as "sysadmin" | "architect" | "ops"),
      );
    }

    if (dateFrom) {
      conditions.push(gte(assessments.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(assessments.createdAt, new Date(dateTo)));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // ------------------------------------------------------------------
    // Fetch all matching assessments (no pagination)
    // ------------------------------------------------------------------
    const data = await db
      .select()
      .from(assessments)
      .where(whereClause)
      .orderBy(desc(assessments.createdAt));

    // ------------------------------------------------------------------
    // Build CSV
    // ------------------------------------------------------------------

    // Header row
    const headers = [
      "ID",
      "Date",
      "Candidat",
      "Email",
      "Role Cible",
      "Score Global (%)",
      "Moyenne Prerequis",
      "Moyenne OpenStack",
      ...QUESTION_KEYS.map((key) => FORMAT_LABELS[key]),
    ];

    const rows: string[] = [];

    // Header line
    rows.push(headers.map(csvEscape).join(","));

    // Data lines
    for (const row of data) {
      const answers = (row.answers ?? {}) as AnswerMap;
      const roleLabel =
        TARGET_ROLE_LABELS[row.targetRole as TargetRole] ?? row.targetRole;

      const cells = [
        row.id,
        formatDate(row.createdAt),
        row.candidateName,
        row.candidateEmail,
        roleLabel,
        row.overallScore != null ? String(row.overallScore) : "",
        row.avgPrereq != null ? String(row.avgPrereq) : "",
        row.avgOpenstack != null ? String(row.avgOpenstack) : "",
        ...QUESTION_KEYS.map((key) =>
          answers[key] != null ? String(answers[key]) : "",
        ),
      ];

      rows.push(cells.map(csvEscape).join(","));
    }

    const csvContent = rows.join("\n");

    // BOM for Excel compatibility + CSV content
    const bom = "\uFEFF";
    const body = bom + csvContent;

    // Today's date for the filename
    const today = formatDate(new Date());

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evaluations-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/export/csv error:", error);
    return new Response(JSON.stringify({ error: "Failed to export CSV" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
