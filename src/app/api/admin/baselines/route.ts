import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { baselines } from "@/db/schema";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const createBaselineSchema = z.object({
  roleKey: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "roleKey must be a valid slug"),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  targets: z.record(
    z.string(),
    z.number().min(0).max(4)
  ),
});

export async function POST(request: NextRequest) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const parsed = createBaselineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(baselines)
      .values({
        roleKey: parsed.data.roleKey,
        label: parsed.data.label,
        description: parsed.data.description,
        targets: parsed.data.targets,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/baselines error:", error);
    return NextResponse.json(
      { error: "Failed to create baseline" },
      { status: 500 }
    );
  }
}
