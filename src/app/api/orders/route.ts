import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, requireStaff } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { saveOrder, startOfTodayIndia } from "@/lib/orders";

const bodySchema = z.object({
  id: z.string().min(1).optional(),
  type: z.enum(["DINE_IN", "TAKEAWAY"]),
  tableId: z.string().min(1).nullable().optional(),
  note: z.string().max(200).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  pay: z
    .object({
      method: z.enum(["CASH", "UPI", "CARD"]),
      tenderedPaise: z.number().int().min(0).optional(),
    })
    .optional(),
});

export async function GET() {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ createdAt: { gte: startOfTodayIndia() } }, { status: "OPEN" }],
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      orderNumber: true,
      type: true,
      status: true,
      totalPaise: true,
      createdAt: true,
      table: { select: { name: true } },
      items: { select: { quantity: true } },
      payments: { select: { method: true } },
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the bill and try again." }, { status: 400 });
  }

  try {
    const saved = await saveOrder({
      ...parsed.data,
      staffId: staff.id,
    });
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
