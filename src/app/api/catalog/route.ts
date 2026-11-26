import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const [categories, tables] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { available: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    }),
    prisma.diningTable.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        orders: {
          where: { status: "OPEN" },
          select: { id: true, orderNumber: true },
          take: 1,
        },
      },
    }),
  ]);

  return NextResponse.json({ categories, tables });
}
