import { NextResponse } from "next/server";
import { errorMessage, requireStaff } from "@/lib/http";
import { orderInclude } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const { id } = await context.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      return NextResponse.json({ error: "Bill not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
