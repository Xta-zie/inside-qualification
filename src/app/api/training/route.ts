import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingModules } from "@/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(trainingModules);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/training error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training modules" },
      { status: 500 }
    );
  }
}
