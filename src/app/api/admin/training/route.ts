import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trainingModules } from "@/db/schema";
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

const createTrainingModuleSchema = z.object({
  moduleKey: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "moduleKey must be a valid slug"),
  title: z.string().min(1).max(300),
  content: z.string().optional(),
  linkedQuestionKeys: z.array(z.string()).optional(),
  providers: z.array(providerSchema).optional(),
});

export async function POST(request: NextRequest) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const parsed = createTrainingModuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(trainingModules)
      .values({
        moduleKey: parsed.data.moduleKey,
        title: parsed.data.title,
        content: parsed.data.content,
        linkedQuestionKeys: parsed.data.linkedQuestionKeys,
        providers: parsed.data.providers,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/training error:", error);
    return NextResponse.json(
      { error: "Failed to create training module" },
      { status: 500 }
    );
  }
}
