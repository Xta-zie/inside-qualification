import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const createQuestionSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Key must be a valid slug"),
  category: z.string().min(1).max(200),
  levels: z.array(z.string()).length(5, "Levels must be an array of 5 strings"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const parsed = createQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(questions)
      .values({
        key: parsed.data.key,
        category: parsed.data.category,
        levels: parsed.data.levels,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/questions error:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
