const GST_BASIS_POINTS = 500;

export function splitGst(subtotalPaise: number) {
  const tax = Math.round((subtotalPaise * GST_BASIS_POINTS) / 10000);
  const cgst = Math.floor(tax / 2);
  const sgst = tax - cgst;
  return {
    cgst,
    sgst,
    tax,
    total: subtotalPaise + tax,
  };
}

export function billTotals(subtotalPaise: number, discountPercent: number) {
  const percent = Math.min(100, Math.max(0, Math.trunc(discountPercent)));
  const discount = Math.min(subtotalPaise, Math.round((subtotalPaise * percent) / 100));
  const taxable = subtotalPaise - discount;
  return { percent, discount, taxable, ...splitGst(taxable) };
}

export const GST_LABEL = "5%";
