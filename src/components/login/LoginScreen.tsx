"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const numRows = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
] as const;

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" strokeLinecap="round" />
    </svg>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    if (next && next.startsWith("/pos")) return next;
    return "/pos";
  }, [searchParams]);

  function addDigit(digit: string) {
    setError(null);
    setPin((current) => (current.length >= 4 ? current : current + digit));
  }

  function backspace() {
    setError(null);
    setPin((current) => current.slice(0, -1));
  }

  function clearPin() {
    setError(null);
    setPin("");
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (pin.length !== 4 || busy) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(data?.error ?? "Could not sign in.");
      setPin("");
      setBusy(false);
      return;
    }
    router.replace(nextPath);
    router.refresh();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key >= "0" && event.key <= "9") {
      event.preventDefault();
      addDigit(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      backspace();
    }
  }

  const digitKey =
    "grid h-12 place-items-center rounded-xl bg-[#2f6bff] text-xl font-semibold text-white shadow-sm active:translate-y-px sm:h-14";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-[#eef3fb] px-4 py-6">
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#7aa2ff]/40" />
      <div className="pointer-events-none absolute top-10 right-0 h-80 w-80 rounded-full bg-[#6d5efc]/25" />
      <div className="pointer-events-none absolute right-16 bottom-6 h-36 w-36 rounded-full border-[14px] border-[#5b7cff]/30" />
      <div className="pointer-events-none absolute bottom-10 left-8 h-24 w-24 rounded-full border-[12px] border-[#8b7cff]/25" />

      <div className="relative w-full max-w-md">
        <form
          onSubmit={submit}
          onKeyDown={onKeyDown}
          className="rounded-[28px] bg-white shadow-[0_30px_80px_rgba(47,84,180,0.18)]"
        >
          <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-b from-[#2f6bff] via-[#4d62f6] to-[#6a45ef] px-4 pt-7 pb-8 text-center text-white sm:px-6">
            <div className="pointer-events-none absolute -top-8 left-16 h-28 w-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute top-4 right-12 h-20 w-20 rounded-full bg-[#9eb6ff]/25" />
            <p className="text-lg font-medium tracking-wide text-white/90">POS System</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome Back</h1>
            <div className="relative z-10 mx-auto mt-6 flex max-w-md items-center gap-3">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 text-slate-400 shadow-[0_8px_24px_rgba(47,84,180,0.16)]">
                <LockIcon />
                <span className="min-w-16 tracking-[0.45em] text-slate-800" aria-hidden>
                  {pin.length === 0 ? (
                    <span className="text-sm tracking-normal text-slate-300">PIN</span>
                  ) : (
                    "•".repeat(pin.length)
                  )}
                </span>
                <span className="sr-only">{pin.length} of 4 PIN digits entered</span>
              </div>
              <button
                type="submit"
                disabled={pin.length !== 4 || busy}
                className="h-11 shrink-0 rounded-full bg-[#2fce62] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {busy ? "…" : "Login"}
              </button>
            </div>
          </div>

          <svg viewBox="0 0 1200 48" preserveAspectRatio="none" className="block h-10 w-full bg-white" aria-hidden>
            <path d="M0 0H1200V12C900 48 300 48 0 12V0Z" fill="#6a45ef" />
          </svg>

          <div className="px-4 pt-5 pb-5 sm:px-5">
            {error ? (
              <p className="mb-3 text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : (
              <p className="mb-3 text-center text-sm text-slate-400">Enter the 4-digit staff PIN.</p>
            )}

            <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
              {numRows.flat().map((digit) => (
                <button key={digit} type="button" onClick={() => addDigit(digit)} className={digitKey}>
                  {digit}
                </button>
              ))}
              <button type="button" onClick={backspace} aria-label="Delete" className={digitKey}>
                ←
              </button>
              <button type="button" onClick={() => addDigit("0")} className={digitKey}>
                0
              </button>
              <button
                type="button"
                onClick={clearPin}
                className="grid h-12 place-items-center rounded-xl bg-[#f04444] text-sm font-semibold text-white shadow-sm active:translate-y-px sm:h-14"
              >
                CLEAR
              </button>
            </div>
          </div>
        </form>

        <p className="mt-5 text-center text-lg font-medium text-[#3d4d78]">
          Login Screen POS System
          <span className="mx-auto mt-2 block h-0.5 w-16 rounded-full bg-[#3d4d78]" />
        </p>
      </div>
    </main>
  );
}
