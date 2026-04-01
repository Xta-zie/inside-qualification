import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const activeParam = searchParams.get("active");

    // Default to active-only; pass ?active=false to get all
    const showAll = activeParam === "false";

    const result = showAll
      ? await db.select().from(questions).orderBy(asc(questions.sortOrder))
      : await db
          .select()
          .from(questions)
          .where(eq(questions.isActive, true))
          .orderBy(asc(questions.sortOrder));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
