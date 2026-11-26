export function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function rupeesToPaise(rupees: number) {
  if (!Number.isFinite(rupees) || rupees <= 0 || rupees > 100000) {
    throw new Error("Enter a price between ₹1 and ₹1,00,000.");
  }
  return Math.round(rupees * 100);
}
