import { NextResponse } from "next/server";
import { db } from "@/db";
import { baselines } from "@/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(baselines);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/baselines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch baselines" },
      { status: 500 }
    );
  }
}
