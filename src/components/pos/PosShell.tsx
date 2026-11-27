"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/pos", label: "Counter" },
  { href: "/pos/orders", label: "Bills" },
  { href: "/pos/menu", label: "Menu" },
];

function pageTitle(pathname: string) {
  if (pathname.startsWith("/pos/orders")) return "Bills";
  if (pathname.startsWith("/pos/menu")) return "Menu";
  if (pathname.startsWith("/pos/receipt")) return "Receipt";
  return "Counter";
}

export function PosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("Staff");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { staff?: { name: string } } | null) => {
        if (data?.staff?.name) setName(data.staff.name);
      })
      .catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const signOut = (
    <button
      type="button"
      onClick={logout}
      className="shrink-0 rounded-[6px] border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
    >
      Sign out
    </button>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbe7ff_0,transparent_32rem),radial-gradient(circle_at_top_right,#efe7ff_0,transparent_28rem),#eef3fb] text-ink">
      <header className="no-print shrink-0 border-b border-white/80 bg-white/80 px-3 py-3 shadow-[0_10px_30px_rgba(47,84,180,0.06)] backdrop-blur-xl sm:px-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2f6bff] to-[#6a45ef] text-sm font-bold text-white shadow-[0_8px_18px_rgba(47,107,255,0.35)]">
              A
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium tracking-[0.18em] text-slate-400 uppercase">Aaj Restaurant</p>
              <p className="truncate text-lg leading-tight font-semibold">{pageTitle(pathname)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">{signOut}</div>
          <nav className="col-span-2 grid grid-cols-3 gap-1 rounded-[6px] bg-slate-100/90 p-1 lg:col-span-1 lg:flex lg:justify-self-center">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-[6px] px-2 py-2 text-center text-sm font-medium transition duration-200 lg:px-3.5 lg:py-1.5 ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center justify-self-end gap-2 lg:flex">
            <span className="max-w-40 truncate rounded-[6px] bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              {name}
            </span>
            {signOut}
          </div>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">{children}</div>
      </div>
    </div>
  );
}
