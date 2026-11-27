import type { OrderType, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { billTotals } from "@/lib/tax";

export type CartLineInput = {
  menuItemId: string;
  quantity: number;
};

const orderInclude = {
  items: { orderBy: { name: "asc" } },
  payments: true,
  table: true,
  staff: { select: { id: true, name: true } },
} satisfies Prisma.OrderInclude;

export type SavedOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export async function saveOrder(input: {
  id?: string;
  type: OrderType;
  tableId?: string | null;
  note?: string | null;
  discountPercent?: number;
  staffId: string;
  items: CartLineInput[];
  pay?: { method: PaymentMethod; tenderedPaise?: number };
}) {
  if (input.items.length === 0) {
    throw new Error("Add at least one item.");
  }
  if (input.type === "DINE_IN" && !input.tableId) {
    throw new Error("Choose a table for dine-in.");
  }

  const menu = await prisma.menuItem.findMany({
    where: {
      id: { in: [...new Set(input.items.map((line) => line.menuItemId))] },
      available: true,
    },
  });
  const byId = new Map(menu.map((item) => [item.id, item]));

  const lines = input.items.map((line) => {
    const item = byId.get(line.menuItemId);
    if (!item) {
      throw new Error("An item is unavailable. Refresh the menu and try again.");
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
      throw new Error("Quantity must be between 1 and 99.");
    }
    return {
      menuItemId: item.id,
      name: item.name,
      diet: item.diet,
      isVeg: item.diet !== "NON_VEG",
      unitPricePaise: item.pricePaise,
      quantity: line.quantity,
      lineTotalPaise: item.pricePaise * line.quantity,
    };
  });

  const discountPercent = input.discountPercent ?? 0;
  if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Discount must be a whole percent from 0 to 100.");
  }

  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const tax = billTotals(subtotalPaise, discountPercent);

  if (
    input.pay?.method === "CASH" &&
    input.pay.tenderedPaise != null &&
    input.pay.tenderedPaise < tax.total
  ) {
    throw new Error("Cash received is less than the bill total.");
  }

  const orderId = await prisma.$transaction(async (tx) => {
    if (input.type === "DINE_IN" && input.tableId) {
      const table = await tx.diningTable.findUnique({ where: { id: input.tableId } });
      if (!table) throw new Error("That table was not found.");
      const clash = await tx.order.findFirst({
        where: {
          tableId: input.tableId,
          status: "OPEN",
          ...(input.id ? { id: { not: input.id } } : {}),
        },
      });
      if (clash) {
        throw new Error(`${table.name} already has open bill #${clash.orderNumber}.`);
      }
    }

    const totals = {
      type: input.type,
      tableId: input.type === "DINE_IN" ? input.tableId ?? null : null,
      note: input.note?.trim() || null,
      staffId: input.staffId,
      subtotalPaise,
      discountPercent: tax.percent,
      discountPaise: tax.discount,
      cgstPaise: tax.cgst,
      sgstPaise: tax.sgst,
      totalPaise: tax.total,
      status: input.pay ? ("PAID" as const) : ("OPEN" as const),
      paidAt: input.pay ? new Date() : null,
    };

    let orderId = input.id;

    if (orderId) {
      const existing = await tx.order.findUnique({ where: { id: orderId } });
      if (!existing || existing.status !== "OPEN") {
        throw new Error("This bill is already closed.");
      }
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.update({ where: { id: orderId }, data: totals });
    } else {
      const counter = await tx.orderCounter.update({
        where: { id: 1 },
        data: { last: { increment: 1 } },
      });
      const created = await tx.order.create({
        data: { ...totals, orderNumber: counter.last },
      });
      orderId = created.id;
    }

    await tx.orderItem.createMany({
      data: lines.map((line) => ({ ...line, orderId: orderId! })),
    });

    if (input.pay) {
      if (input.id) await tx.payment.deleteMany({ where: { orderId } });
      await tx.payment.create({
        data: {
          orderId: orderId!,
          method: input.pay.method,
          amountPaise: tax.total,
          tenderedPaise: input.pay.tenderedPaise ?? null,
        },
      });
    }

    return orderId!;
  }, { maxWait: 10_000, timeout: 20_000 });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: orderInclude,
  });

  return { order };
}

export function startOfTodayIndia() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${date}T00:00:00+05:30`);
}

export { orderInclude };
