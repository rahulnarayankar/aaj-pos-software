import { BillingScreen } from "@/components/pos/BillingScreen";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return <BillingScreen key={order ?? "new"} initialOrderId={order ?? null} />;
}
