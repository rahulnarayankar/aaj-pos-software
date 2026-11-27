export function Bone({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded-2xl bg-slate-200/80 ${className}`} aria-hidden />;
}

export function CounterSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="min-h-28 rounded-[6px] bg-white p-3 shadow-sm">
          <Bone className="h-4 w-4 rounded" />
          <Bone className="mt-3 h-4 w-3/4" />
          <Bone className="mt-6 h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function BillListSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-[6px] bg-white p-4 shadow-[0_16px_50px_rgba(47,84,180,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <Bone className="h-5 w-24" />
            <Bone className="h-5 w-20" />
          </div>
          <Bone className="mt-3 h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      <div className="grid gap-3 lg:grid-cols-2">
        <Bone className="h-48 rounded-[6px]" />
        <Bone className="h-40 rounded-[6px]" />
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <Bone key={index} className="h-14 rounded-[6px]" />
      ))}
    </div>
  );
}
