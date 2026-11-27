# Aaj Restaurant POS

Counter billing for the restaurant: dine-in tables, takeaway, 5% GST, discounts, and cash, UPI, or card.

This app uses its own Supabase Postgres database (`aaj-restaurant-pos`).

## Setup

1. In the Supabase project, open **Connect** and copy the **URI** connection string. Prefer the session pooler.
2. Copy `.env.example` to `.env`.
3. Paste the URI into `DATABASE_URL`. Keep `?sslmode=require` on the end.
4. Set `AUTH_SECRET` to a long random string.
5. Optional receipt lines: `RESTAURANT_ADDRESS`, `RESTAURANT_PHONE`, and `RESTAURANT_GSTIN`. Leave them empty and the receipt omits that line.
6. Install and create the tables:

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000. The seeded manager PIN is `2580` (four digits). Change `POS_SEED_PIN` before the first `db:setup` if you want a different PIN.

`npm run db:setup` creates the tables and loads a starter menu plus tables T1–T8. Running it again will not duplicate those dishes.

## What this version does

- Staff PIN sign-in. Eight wrong tries in 15 minutes lock that browser out for the rest of the window.
- Counter: search and filter dishes, dine-in or takeaway, park a bill on a table, take payment.
- Each dish is Vegetarian, Non-vegetarian, or Pure Jain. The counter can filter by that, and the mark prints on the receipt.
- Discount as a whole percent from 0 to 100, with shortcuts for 5%, 10%, 15%, and 20%. GST is calculated on the amount after the discount.
- Bills list for today, plus any still-open bills. The bottom of the list shows how many orders that is and their combined total. Cancelled bills are left out of both figures.
- Menu: a manager can add a category or dish, change a dish’s diet, and hide a dish from the counter. Other staff can view the menu.
- Printable receipt, including the restaurant address, phone, and GSTIN when those are set.

GST is 5%, shown as CGST 2.5% and SGST 2.5%, added on top of menu prices.

## Next

Kitchen tickets, split payments, and a cash drawer close come after this counter is in daily use.

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
