"use client";

import { useEffect, useState } from "react";
import { VegMark } from "@/components/pos/VegMark";
import { formatRupees } from "@/lib/money";
import { GST_LABEL } from "@/lib/tax";

type Item = {
  id: string;
  name: string;
  pricePaise: number;
  isVeg: boolean;
  available: boolean;
};

type Category = {
  id: string;
  name: string;
  items: Item[];
};

export function MenuScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/menu/items");
    const data = (await response.json()) as { categories?: Category[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not load the menu.");
      return;
    }
    const next = data.categories ?? [];
    setCategories(next);
    setCategoryId((current) => current || next[0]?.id || "");
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/menu/items")
      .then((response) => response.json())
      .then((data: { categories?: Category[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const next = data.categories ?? [];
        setCategories(next);
        setCategoryId(next[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the menu.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/menu/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName }),
    });
    const data = (await response.json()) as { error?: string; category?: { id: string } };
    if (!response.ok) {
      setError(data.error ?? "Could not add the category.");
      setBusy(false);
      return;
    }
    setCategoryName("");
    await load();
    if (data.category) setCategoryId(data.category.id);
    setBusy(false);
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/menu/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryId,
        priceRupees: Number(price),
        isVeg,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not add the dish.");
      setBusy(false);
      return;
    }
    setName("");
    setPrice("");
    await load();
    setBusy(false);
  }

  async function toggle(item: Item) {
    const response = await fetch(`/api/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not update the dish.");
      return;
    }
    await load();
  }

  return (
    <div className="pos-enter h-full overflow-y-auto p-4">
      <h1 className="text-2xl font-semibold">Menu</h1>
      <p className="mt-1 text-sm text-ink/60">Prices are before {GST_LABEL} GST. Hidden dishes stay off the counter.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <form onSubmit={addItem} className="rounded-3xl border border-white bg-white p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
          <h2 className="font-semibold">Add a dish</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Dish name"
              className="h-11 min-w-0 rounded-xl border border-line px-3"
              required
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Price in ₹"
              inputMode="decimal"
              className="h-11 min-w-0 rounded-xl border border-line px-3"
              required
            />
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-11 min-w-0 rounded-xl border border-line bg-white px-3"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label className="flex h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={isVeg} onChange={(event) => setIsVeg(event.target.checked)} />
              Vegetarian
            </label>
          </div>
          <button disabled={busy} className="mt-3 h-11 rounded-2xl bg-[#2f6bff] px-4 font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">
            Save dish
          </button>
        </form>

        <form onSubmit={addCategory} className="rounded-3xl border border-white bg-white p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
          <h2 className="font-semibold">Add a category</h2>
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Category name"
            className="mt-3 h-11 w-full rounded-xl border border-line px-3"
            required
          />
          <button disabled={busy} className="mt-3 h-11 rounded-2xl border border-[#2f6bff]/30 px-4 font-semibold text-[#2f6bff] transition hover:bg-[#2f6bff]/5 disabled:opacity-50">
            Save category
          </button>
        </form>
      </div>

      <div className="mt-6 space-y-6">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="font-semibold">{category.name}</h2>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-3xl border border-white bg-white shadow-[0_12px_36px_rgba(47,84,180,0.06)]">
              {category.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <VegMark veg={item.isVeg} />
                  <span className={`min-w-0 flex-1 break-words ${item.available ? "" : "text-ink/40 line-through"}`}>{item.name}</span>
                  <span className="shrink-0 font-medium">{formatRupees(item.pricePaise)}</span>
                  <button type="button" onClick={() => toggle(item)} className="shrink-0 text-sm font-semibold text-[#2f6bff]">
                    {item.available ? "Hide" : "Show"}
                  </button>
                </li>
              ))}
              {category.items.length === 0 ? (
                <li className="px-4 py-3 text-sm text-ink/50">No dishes in this category.</li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
