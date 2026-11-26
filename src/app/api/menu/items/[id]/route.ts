import { NextResponse } from "next/server";
import { z } from "zod";
import { errorMessage, requireStaff } from "@/lib/http";
import { rupeesToPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  available: z.boolean().optional(),
  name: z.string().trim().min(1).max(80).optional(),
  priceRupees: z.number().positive().optional(),
  isVeg: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { staff, response } = await requireStaff();
  if (!staff) return response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Could not update that item." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        available: parsed.data.available,
        name: parsed.data.name?.trim(),
        isVeg: parsed.data.isVeg,
        pricePaise:
          parsed.data.priceRupees == null
            ? undefined
            : rupeesToPaise(parsed.data.priceRupees),
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
