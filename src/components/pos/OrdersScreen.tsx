"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BillListSkeleton } from "@/components/pos/Skeleton";
import { formatRupees } from "@/lib/money";

type OrderRow = {
  id: string;
  orderNumber: number;
  type: "DINE_IN" | "TAKEAWAY";
  status: "OPEN" | "PAID" | "CANCELLED";
  totalPaise: number;
  createdAt: string;
  table: { name: string } | null;
  payments: { method: string }[];
  items: { quantity: number }[];
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/orders")
      .then(async (response) => {
        const data = (await response.json()) as { orders?: OrderRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load bills.");
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch((loadError: Error) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function typeLabel(order: OrderRow) {
    return order.type === "DINE_IN" ? `Dine-in${order.table ? ` · ${order.table.name}` : ""}` : "Takeaway";
  }

  function statusLabel(order: OrderRow) {
    if (order.status === "OPEN") return "Open";
    if (order.status === "PAID") return order.payments[0]?.method ?? "Paid";
    return "Cancelled";
  }

  const counted = orders.filter((order) => order.status !== "CANCELLED");
  const orderCount = counted.length;
  const amountPaise = counted.reduce((sum, order) => sum + order.totalPaise, 0);

  function action(order: OrderRow) {
    if (order.status === "OPEN") {
      return (
        <Link href={`/pos?order=${order.id}`} className="font-semibold text-[#2f6bff]">
          Open
        </Link>
      );
    }
    return (
      <Link href={`/pos/receipt/${order.id}`} className="font-semibold text-[#2f6bff]">
        Receipt
      </Link>
    );
  }

  return (
    <div className="pos-enter h-full overflow-y-auto p-3 sm:p-4">
      <h1 className="text-2xl font-semibold">Today&apos;s bills</h1>
      <p className="mt-1 text-sm text-ink/60">Open bills from earlier days stay in this list until they are paid.</p>
      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
      {loading ? <BillListSkeleton /> : null}
      {!loading && orders.length === 0 && !error ? (
        <p className="mt-4 rounded-[6px] bg-white px-4 py-8 text-sm text-ink/50 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
          No bills yet today.
        </p>
      ) : null}
      <ul className="mt-4 space-y-3 md:hidden">
        {orders.map((order) => (
          <li key={order.id} className="rounded-[6px] bg-white p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">#{order.orderNumber}</p>
                <p className="text-sm break-words text-slate-500">{typeLabel(order)}</p>
              </div>
              <p className="shrink-0 font-semibold">{formatRupees(order.totalPaise)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className={order.status === "OPEN" ? "text-orange" : "text-green"}>
                {statusLabel(order)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
              {action(order)}
            </div>
          </li>
        ))}
      </ul>
      {!loading && orderCount > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-[6px] bg-white px-4 py-3 text-sm font-semibold shadow-[0_16px_50px_rgba(47,84,180,0.08)] md:hidden">
          <span>{orderCount} {orderCount === 1 ? "order" : "orders"}</span>
          <span className="tabular-nums">{formatRupees(amountPaise)}</span>
        </div>
      ) : null}
      <div className="mt-4 hidden overflow-x-auto rounded-[6px] border border-white bg-white shadow-[0_16px_50px_rgba(47,84,180,0.08)] md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-slate-50 text-ink/70">
            <tr>
              <th className="px-4 py-3 font-medium">Bill</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-line transition hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold whitespace-nowrap">#{order.orderNumber}</td>
                <td className="px-4 py-3">{typeLabel(order)}</td>
                <td className="px-4 py-3">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatRupees(order.totalPaise)}</td>
                <td className="px-4 py-3">
                  <span className={order.status === "OPEN" ? "text-orange" : "text-green"}>{statusLabel(order)}</span>
                </td>
                <td className="px-4 py-3 text-right">{action(order)}</td>
              </tr>
            ))}
          </tbody>
          {orderCount > 0 ? (
            <tfoot>
              <tr className="border-t border-line bg-slate-50 font-semibold">
                <td className="px-4 py-3" colSpan={3}>
                  {orderCount} {orderCount === 1 ? "order" : "orders"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatRupees(amountPaise)}</td>
                <td className="px-4 py-3" colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
