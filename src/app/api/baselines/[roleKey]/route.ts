import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { baselines } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roleKey: string }> }
) {
  try {
    const { roleKey } = await params;

    const result = await db
      .select()
      .from(baselines)
      .where(eq(baselines.roleKey, roleKey));

    if (result.length === 0) {
      return NextResponse.json(
        { error: `Baseline not found for role: ${roleKey}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("GET /api/baselines/[roleKey] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch baseline" },
      { status: 500 }
    );
  }
}
