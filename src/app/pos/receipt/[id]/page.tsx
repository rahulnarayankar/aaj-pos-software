import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/pos/PrintButton";
import { VegMark } from "@/components/pos/VegMark";
import { formatRupees } from "@/lib/money";
import { restaurant } from "@/lib/restaurant";
import { GST_LABEL } from "@/lib/tax";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { name: "asc" } },
      payments: true,
      table: true,
      staff: true,
    },
  });

  if (!order) notFound();

  const payment = order.payments[0];
  const change =
    payment?.tenderedPaise != null ? payment.tenderedPaise - payment.amountPaise : null;

  return (
    <div className="pos-enter h-full overflow-y-auto p-4">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/pos" className="text-sm font-semibold text-green">
          Back to counter
        </Link>
        <PrintButton />
      </div>
      <article className="receipt-sheet mx-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-center text-xs tracking-[0.2em] text-green uppercase">{restaurant.name}</p>
        <div className="mt-2 space-y-0.5 text-center text-sm leading-5">
          {restaurant.address ? <p className="whitespace-pre-line">{restaurant.address}</p> : null}
          {restaurant.phone ? <p>Ph: {restaurant.phone}</p> : null}
          {restaurant.gstin ? <p>GSTIN: {restaurant.gstin}</p> : null}
        </div>
        <h1 className="mt-3 text-center text-2xl font-semibold">Bill #{order.orderNumber}</h1>
        <p className="mt-1 text-center text-sm text-ink/60">{formatWhen(order.paidAt ?? order.createdAt)}</p>
        <p className="mt-3 text-center text-sm">
          {order.type === "DINE_IN" ? `Dine-in${order.table ? ` · ${order.table.name}` : ""}` : "Takeaway"}
          {order.staff ? ` · ${order.staff.name}` : ""}
        </p>
        <ul className="mt-5 space-y-2 border-t border-dashed border-line pt-4 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="flex min-w-0 items-start gap-2 break-words">
                <VegMark diet={item.diet} />
                <span>
                  {item.quantity} × {item.name}
                </span>
              </span>
              <span className="shrink-0">{formatRupees(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-dashed border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupees(order.subtotalPaise)}</dd></div>
          {order.discountPaise > 0 ? (
            <div className="flex justify-between">
              <dt>Discount {order.discountPercent}%</dt>
              <dd>−{formatRupees(order.discountPaise)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between"><dt>CGST 2.5%</dt><dd>{formatRupees(order.cgstPaise)}</dd></div>
          <div className="flex justify-between"><dt>SGST 2.5%</dt><dd>{formatRupees(order.sgstPaise)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatRupees(order.totalPaise)}</dd></div>
          {payment ? (
            <div className="flex justify-between"><dt>{payment.method}</dt><dd>{formatRupees(payment.amountPaise)}</dd></div>
          ) : (
            <div className="flex justify-between text-orange"><dt>Status</dt><dd>Unpaid</dd></div>
          )}
          {change != null && change > 0 ? (
            <div className="flex justify-between"><dt>Change</dt><dd>{formatRupees(change)}</dd></div>
          ) : null}
        </dl>
        {order.note ? <p className="mt-4 text-sm text-ink/70">Note: {order.note}</p> : null}
        <p className="mt-6 text-center text-xs text-ink/50">Thank you. GST extra at {GST_LABEL}.</p>
      </article>
    </div>
  );
}
