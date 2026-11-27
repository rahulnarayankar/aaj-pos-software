"use client";

import { useEffect, useState } from "react";
import { MenuSkeleton } from "@/components/pos/Skeleton";
import { VegMark } from "@/components/pos/VegMark";
import { clearCatalog } from "@/lib/catalog-client";
import { dietOptions, type Diet } from "@/lib/diet";
import { formatRupees } from "@/lib/money";
import { GST_LABEL } from "@/lib/tax";

type Item = {
  id: string;
  name: string;
  pricePaise: number;
  diet: Diet;
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
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [diet, setDiet] = useState<Diet>("VEG");
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
    Promise.all([
      fetch("/api/menu/items").then((response) => response.json()) as Promise<{
        categories?: Category[];
        error?: string;
      }>,
      fetch("/api/auth/me").then((response) => (response.ok ? response.json() : null)) as Promise<{
        staff?: { role: string };
      } | null>,
    ])
      .then(([data, me]) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const next = data.categories ?? [];
        setCategories(next);
        setCategoryId(next[0]?.id ?? "");
        setCanEdit(me?.staff?.role === "MANAGER");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the menu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
    clearCatalog();
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
        diet,
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
    clearCatalog();
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
    clearCatalog();
    await load();
  }

  async function changeDiet(item: Item, next: Diet) {
    if (next === item.diet) return;
    const response = await fetch(`/api/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diet: next }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not update the dish.");
      return;
    }
    clearCatalog();
    await load();
  }

  return (
    <div className="pos-enter h-full overflow-y-auto p-4">
      <h1 className="text-2xl font-semibold">Menu</h1>
      <p className="mt-1 text-sm text-ink/60">Prices are before {GST_LABEL} GST. Hidden dishes stay off the counter.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {loading ? <MenuSkeleton /> : null}
      {!loading && !canEdit ? (
        <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Only a manager can change the menu.
        </p>
      ) : null}

      {!loading && canEdit ? (
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <form onSubmit={addItem} className="rounded-[6px] border border-white bg-white p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
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
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
              {dietOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDiet(option.id)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-[6px] border text-sm font-medium ${diet === option.id ? "border-[#2f6bff] bg-[#2f6bff]/10 text-[#2f6bff]" : "border-line text-ink/70"}`}
                >
                  <VegMark diet={option.id} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button disabled={busy} className="mt-3 h-11 rounded-[6px] bg-[#2f6bff] px-4 font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">
            Save dish
          </button>
        </form>

        <form onSubmit={addCategory} className="rounded-[6px] border border-white bg-white p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
          <h2 className="font-semibold">Add a category</h2>
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Category name"
            className="mt-3 h-11 w-full rounded-xl border border-line px-3"
            required
          />
          <button disabled={busy} className="mt-3 h-11 rounded-[6px] border border-[#2f6bff]/30 px-4 font-semibold text-[#2f6bff] transition hover:bg-[#2f6bff]/5 disabled:opacity-50">
            Save category
          </button>
        </form>
      </div>
      ) : null}

      {!loading ? (
      <div className="mt-6 space-y-6">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="font-semibold">{category.name}</h2>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-[6px] border border-white bg-white shadow-[0_12px_36px_rgba(47,84,180,0.06)]">
              {category.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <VegMark diet={item.diet} />
                  <span className={`min-w-0 flex-1 break-words ${item.available ? "" : "text-ink/40 line-through"}`}>{item.name}</span>
                  {canEdit ? (
                    <select
                      value={item.diet}
                      onChange={(event) => changeDiet(item, event.target.value as Diet)}
                      aria-label={`Diet for ${item.name}`}
                      className="h-9 shrink-0 rounded-[6px] border border-line bg-white px-2 text-sm"
                    >
                      {dietOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="shrink-0 text-sm text-ink/60">{dietOptions.find((option) => option.id === item.diet)?.label}</span>
                  )}
                  <span className="shrink-0 font-medium">{formatRupees(item.pricePaise)}</span>
                  {canEdit ? (
                    <button type="button" onClick={() => toggle(item)} className="shrink-0 text-sm font-semibold text-[#2f6bff]">
                      {item.available ? "Hide" : "Show"}
                    </button>
                  ) : null}
                </li>
              ))}
              {category.items.length === 0 ? (
                <li className="px-4 py-3 text-sm text-ink/50">No dishes in this category.</li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
      ) : null}
    </div>
  );
}
