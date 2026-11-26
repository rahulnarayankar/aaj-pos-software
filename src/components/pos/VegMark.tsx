export function VegMark({ veg }: { veg: boolean }) {
  const color = veg ? "border-green-700" : "border-red-700";
  const fill = veg ? "bg-green-700" : "bg-red-700";
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border bg-white ${color}`}
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${fill}`} />
    </span>
  );
}
