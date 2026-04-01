import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { baselines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const updateBaselineSchema = z.object({
  roleKey: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "roleKey must be a valid slug")
    .optional(),
  label: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  targets: z
    .record(z.string(), z.number().min(0).max(4))
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const baselineId = parseInt(id, 10);
    if (isNaN(baselineId)) {
      return NextResponse.json(
        { error: "Invalid baseline ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateBaselineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(baselines)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(baselines.id, baselineId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Baseline not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/admin/baselines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update baseline" },
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
    const baselineId = parseInt(id, 10);
    if (isNaN(baselineId)) {
      return NextResponse.json(
        { error: "Invalid baseline ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(baselines)
      .where(eq(baselines.id, baselineId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Baseline not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/baselines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete baseline" },
      { status: 500 }
    );
  }
}
