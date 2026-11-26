import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, requireStaff } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a category name." }, { status: 400 });
  }

  try {
    const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name.trim(),
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
