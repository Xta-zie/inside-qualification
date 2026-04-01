import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trainingModules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleKey: string }> }
) {
  try {
    const { moduleKey } = await params;

    const result = await db
      .select()
      .from(trainingModules)
      .where(eq(trainingModules.moduleKey, moduleKey));

    if (result.length === 0) {
      return NextResponse.json(
        { error: `Training module not found: ${moduleKey}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("GET /api/training/[moduleKey] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training module" },
      { status: 500 }
    );
  }
}
