import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trainingModules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const providerSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  detail: z.string().min(1),
});

const updateTrainingModuleSchema = z.object({
  moduleKey: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "moduleKey must be a valid slug")
    .optional(),
  title: z.string().min(1).max(300).optional(),
  content: z.string().optional(),
  linkedQuestionKeys: z.array(z.string()).optional(),
  providers: z.array(providerSchema).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const moduleId = parseInt(id, 10);
    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: "Invalid training module ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateTrainingModuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(trainingModules)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(trainingModules.id, moduleId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Training module not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/admin/training/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update training module" },
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
    const moduleId = parseInt(id, 10);
    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: "Invalid training module ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(trainingModules)
      .where(eq(trainingModules.id, moduleId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Training module not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/training/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete training module" },
      { status: 500 }
    );
  }
}
