import type { Diet } from "@/lib/diet";
import { dietLabel } from "@/lib/diet";

const styles: Record<Diet, { border: string; fill: string }> = {
  VEG: { border: "border-green-700", fill: "bg-green-700" },
  NON_VEG: { border: "border-red-700", fill: "bg-red-700" },
  JAIN: { border: "border-amber-600", fill: "bg-amber-500" },
};

export function VegMark({ diet }: { diet: Diet }) {
  const style = styles[diet] ?? styles.VEG;
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border bg-white ${style.border}`}
      aria-label={dietLabel(diet)}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.fill}`} />
    </span>
  );
}
