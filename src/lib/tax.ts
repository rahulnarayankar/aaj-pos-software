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

export const GST_LABEL = "5%";
