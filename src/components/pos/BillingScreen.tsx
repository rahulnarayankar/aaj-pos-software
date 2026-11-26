"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { VegMark } from "@/components/pos/VegMark";
import { formatRupees } from "@/lib/money";
import { splitGst } from "@/lib/tax";

type MenuItem = {
  id: string;
  name: string;
  pricePaise: number;
  isVeg: boolean;
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

type Table = {
  id: string;
  name: string;
  seats: number;
  orders: { id: string; orderNumber: number }[];
};

type CartLine = MenuItem & { quantity: number };

type OrderPayload = {
  id: string;
  orderNumber: number;
  type: "DINE_IN" | "TAKEAWAY";
  status: string;
  tableId: string | null;
  note: string | null;
  items: {
    menuItemId: string | null;
    name: string;
    isVeg: boolean;
    unitPricePaise: number;
    quantity: number;
  }[];
};

const paymentMethods = [
  { id: "CASH", label: "Cash" },
  { id: "UPI", label: "UPI" },
  { id: "CARD", label: "Card" },
] as const;

export function BillingScreen({ initialOrderId }: { initialOrderId: string | null }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [tableId, setTableId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [note, setNote] = useState("");
  const [openOrderId, setOpenOrderId] = useState<string | null>(initialOrderId);
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<(typeof paymentMethods)[number]["id"]>("CASH");
  const [tendered, setTendered] = useState("");

  async function loadCatalog() {
    const response = await fetch("/api/catalog");
    if (!response.ok) return;
    const data = (await response.json()) as { categories: Category[]; tables: Table[] };
    setCategories(data.categories);
    setTables(data.tables);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { categories: Category[]; tables: Table[] } | null) => {
        if (!cancelled && data) {
          setCategories(data.categories);
          setTables(data.tables);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialOrderId) return;
    let cancelled = false;
    fetch(`/api/orders/${initialOrderId}`)
      .then(async (response) => {
        const data = (await response.json()) as { order?: OrderPayload; error?: string };
        if (!response.ok || !data.order) throw new Error(data.error ?? "Bill not found.");
        return data.order;
      })
      .then((order) => {
        if (cancelled) return;
        if (order.status !== "OPEN") {
          setError("This bill is already closed.");
          return;
        }
        setOpenOrderId(order.id);
        setOpenNumber(order.orderNumber);
        setOrderType(order.type);
        setTableId(order.tableId);
        setNote(order.note ?? "");
        setCart(
          order.items
            .filter((item) => item.menuItemId)
            .map((item) => ({
              id: item.menuItemId!,
              name: item.name,
              isVeg: item.isVeg,
              pricePaise: item.unitPricePaise,
              quantity: item.quantity,
            })),
        );
      })
      .catch((loadError: Error) => {
        if (!cancelled) setError(loadError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [initialOrderId]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories
      .filter((category) => categoryId === "all" || category.id === categoryId)
      .flatMap((category) => category.items)
      .filter((item) => item.name.toLowerCase().includes(query));
  }, [categories, categoryId, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const tax = splitGst(subtotal);
  const selectedTable = tables.find((table) => table.id === tableId) ?? null;

  function addItem(item: MenuItem) {
    setNotice(null);
    setCart((current) => {
      const existing = current.find((line) => line.id === item.id);
      if (!existing) return [...current, { ...item, quantity: 1 }];
      return current.map((line) =>
        line.id === item.id ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line,
      );
    });
  }

  function setQuantity(id: string, quantity: number) {
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  }

  function chooseTable(table: Table) {
    const open = table.orders[0];
    if (open && open.id !== openOrderId) {
      const dirty = cart.length > 0;
      if (dirty && !window.confirm(`Open bill #${open.orderNumber} on ${table.name}? The current cart will be replaced.`)) {
        return;
      }
      router.push(`/pos?order=${open.id}`);
      return;
    }
    setTableId(table.id);
    setOrderType("DINE_IN");
  }

  function resetBill() {
    setCart([]);
    setNote("");
    setOpenOrderId(null);
    setOpenNumber(null);
    setTableId(null);
    setError(null);
    setPaying(false);
    if (initialOrderId) router.push("/pos");
  }

  async function submit(pay?: { method: (typeof paymentMethods)[number]["id"]; tenderedPaise?: number }) {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: openOrderId ?? undefined,
        type: orderType,
        tableId: orderType === "DINE_IN" ? tableId : null,
        note,
        items: cart.map((line) => ({ menuItemId: line.id, quantity: line.quantity })),
        pay,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      error?: string;
      order?: { id: string; orderNumber: number; table?: { name: string } | null };
    } | null;
    if (!response.ok || !data?.order) {
      setError(data?.error ?? "Could not save the bill.");
      setBusy(false);
      return;
    }
    if (pay) {
      router.push(`/pos/receipt/${data.order.id}`);
      return;
    }
    setNotice(
      `Bill #${data.order.orderNumber} parked${data.order.table ? ` on ${data.order.table.name}` : ""}.`,
    );
    setCart([]);
    setNote("");
    setOpenOrderId(null);
    setOpenNumber(null);
    setTableId(null);
    setBusy(false);
    await loadCatalog();
    if (initialOrderId) router.replace("/pos");
  }

  function openPayment() {
    setError(null);
    if (cart.length === 0) {
      setError("Add at least one item.");
      return;
    }
    if (orderType === "DINE_IN" && !tableId) {
      setError("Choose a table for dine-in.");
      return;
    }
    setTendered((tax.total / 100).toFixed(2));
    setMethod("CASH");
    setPaying(true);
  }

  const tenderedPaise = Math.round(Number(tendered) * 100);
  const changePaise = Number.isFinite(tenderedPaise) ? tenderedPaise - tax.total : 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:overflow-hidden">
      <section className="pos-enter rounded-3xl bg-white/80 p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)] backdrop-blur lg:min-h-0 lg:overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dishes"
            className="h-12 flex-1 rounded-2xl border border-line bg-white px-4 shadow-sm outline-none transition focus:border-[#2f6bff] focus:ring-4 focus:ring-[#2f6bff]/15"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${categoryId === "all" ? "bg-[#2f6bff] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${categoryId === category.id ? "bg-[#2f6bff] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((item, index) => {
            const inCart = cart.find((line) => line.id === item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}
                className="pos-card flex min-h-28 flex-col items-start rounded-3xl border border-white bg-white p-3 text-left shadow-[0_8px_24px_rgba(16,24,40,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(47,107,255,0.14)] active:scale-[0.98]"
              >
                <VegMark veg={item.isVeg} />
                <span className="mt-2 font-medium leading-snug break-words">{item.name}</span>
                <span className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-sm font-semibold text-[#2f6bff]">
                  {formatRupees(item.pricePaise)}
                  {inCart ? (
                    <span key={inCart.quantity} className="pos-pop rounded-full bg-[#2f6bff]/10 px-2 py-0.5 text-xs text-[#2f6bff]">
                      × {inCart.quantity}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        {visibleItems.length === 0 ? (
          <p className="mt-8 text-sm text-ink/60">No dishes match. Add items from the Menu tab after the database is seeded.</p>
        ) : null}
      </section>

      <aside className="pos-enter flex flex-col rounded-3xl bg-white shadow-[0_16px_50px_rgba(47,84,180,0.1)] [animation-delay:80ms] lg:min-h-0 lg:overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{openNumber ? `Bill #${openNumber}` : "New bill"}</h2>
            <button type="button" onClick={resetBill} className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100">
              Clear
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            {(["DINE_IN", "TAKEAWAY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`h-10 rounded-xl text-sm font-semibold transition duration-200 ${orderType === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {type === "DINE_IN" ? "Dine-in" : "Takeaway"}
              </button>
            ))}
          </div>
          {orderType === "DINE_IN" ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tables.map((table) => {
                const open = table.orders[0];
                const selected = table.id === tableId;
                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => chooseTable(table)}
                    className={`rounded-2xl border px-2 py-2 text-sm font-semibold transition duration-200 active:scale-95 ${selected ? "border-[#2f6bff] bg-[#2f6bff] text-white shadow-sm" : open ? "border-orange/30 bg-orange/10 text-orange" : "border-line bg-slate-50 hover:border-[#2f6bff]/40"}`}
                  >
                    {table.name}
                    <span className="block text-[10px] font-medium opacity-80">
                      {open ? `#${open.orderNumber}` : `${table.seats} seats`}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="px-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {cart.length === 0 ? (
            <p className="py-8 text-sm text-ink/50">Tap a dish to start the bill.</p>
          ) : (
            <ul className="space-y-2 py-3">
              {cart.map((line) => (
                <li key={line.id} className="pos-card flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0 flex-1 basis-36">
                    <p className="font-medium break-words">{line.name}</p>
                    <p className="text-sm text-ink/60">{formatRupees(line.pricePaise)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)} className="h-8 w-8 rounded-full bg-white shadow-sm transition active:scale-90">
                      −
                    </button>
                    <span key={line.quantity} className="pos-pop w-6 text-center font-semibold">{line.quantity}</span>
                    <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} className="h-8 w-8 rounded-full bg-white shadow-sm transition active:scale-90">
                      +
                    </button>
                  </div>
                  <p className="ml-auto shrink-0 text-right text-sm font-semibold">{formatRupees(line.pricePaise * line.quantity)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line p-4">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note for the kitchen"
            maxLength={200}
            className="mb-3 h-11 w-full rounded-2xl border border-line bg-slate-50 px-3 text-sm outline-none transition focus:border-[#2f6bff] focus:bg-white focus:ring-4 focus:ring-[#2f6bff]/15"
          />
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupees(subtotal)}</dd></div>
            <div className="flex justify-between text-ink/70"><dt>CGST 2.5%</dt><dd>{formatRupees(tax.cgst)}</dd></div>
            <div className="flex justify-between text-ink/70"><dt>SGST 2.5%</dt><dd>{formatRupees(tax.sgst)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatRupees(tax.total)}</dd></div>
          </dl>
          {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          {notice ? <p className="mt-3 rounded-xl bg-green/10 px-3 py-2 text-sm text-green">{notice}</p> : null}
          <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <button
              type="button"
              disabled={busy || cart.length === 0}
              onClick={() => submit()}
              className="h-12 rounded-2xl border border-slate-200 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              {openOrderId ? "Update bill" : "Park bill"}
            </button>
            <button
              type="button"
              disabled={busy || cart.length === 0}
              onClick={openPayment}
              className="h-12 rounded-2xl bg-gradient-to-r from-[#2f6bff] to-[#6a45ef] font-semibold text-white shadow-[0_10px_24px_rgba(47,107,255,0.28)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
            >
              Take payment
            </button>
          </div>
          {selectedTable && orderType === "DINE_IN" ? (
            <p className="mt-2 text-center text-xs text-ink/50">Table {selectedTable.name}</p>
          ) : null}
        </div>
      </aside>

      {paying ? (
        <div className="pos-overlay fixed inset-0 z-40 overflow-y-auto bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
          <div className="pos-sheet my-4 w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_30px_80px_rgba(16,24,40,0.22)]">
            <h3 className="text-xl font-semibold">Take payment</h3>
            <p className="mt-1 text-sm text-ink/60">Amount due {formatRupees(tax.total)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {paymentMethods.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMethod(option.id)}
                  className={`h-11 rounded-xl font-semibold transition duration-200 ${method === option.id ? "bg-[#2f6bff] text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {method === "CASH" ? (
              <label className="mt-4 block text-sm">
                Cash received
                <input
                  inputMode="decimal"
                  value={tendered}
                  onChange={(event) => setTendered(event.target.value)}
                  className="mt-1 h-12 w-full rounded-2xl border border-line px-3 text-lg outline-none transition focus:border-[#2f6bff] focus:ring-4 focus:ring-[#2f6bff]/15"
                />
                <span className="mt-2 block text-ink/70">
                  Change {formatRupees(Math.max(0, changePaise))}
                </span>
              </label>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPaying(false)} className="h-12 rounded-2xl bg-slate-100 font-semibold transition hover:bg-slate-200">
                Back
              </button>
              <button
                type="button"
                disabled={busy || (method === "CASH" && changePaise < 0)}
                onClick={() =>
                  submit({
                    method,
                    tenderedPaise: method === "CASH" ? tenderedPaise : undefined,
                  })
                }
                className="h-12 rounded-2xl bg-gradient-to-r from-[#18b955] to-[#0f9a62] font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
