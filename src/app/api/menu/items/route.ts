import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, requireStaff } from "@/lib/http";
import { rupeesToPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.string().min(1),
  priceRupees: z.number().positive(),
  isVeg: z.boolean(),
});

export async function GET() {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a name, category, and price." }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Choose a category." }, { status: 400 });
    }
    const item = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: parsed.data.name.trim(),
        pricePaise: rupeesToPaise(parsed.data.priceRupees),
        isVeg: parsed.data.isVeg,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
