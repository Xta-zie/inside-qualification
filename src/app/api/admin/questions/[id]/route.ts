import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const updateQuestionSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Key must be a valid slug")
    .optional(),
  category: z.string().min(1).max(200).optional(),
  levels: z
    .array(z.string())
    .length(5, "Levels must be an array of 5 strings")
    .optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const questionId = parseInt(id, 10);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(questions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(questions.id, questionId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/admin/questions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const questionId = parseInt(id, 10);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, questionId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/questions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
