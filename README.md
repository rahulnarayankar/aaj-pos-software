# Aaj Restaurant POS

Counter billing for the restaurant: dine-in tables, takeaway, 5% GST, and cash, UPI, or card.

This app uses its own Supabase Postgres database (`aaj-restaurant-pos`). It does not share data with the Aaj Bites storefront.

## Setup

1. In the Supabase project, open **Connect** and copy the **URI** connection string.
2. Copy `.env.example` to `.env`.
3. Paste the URI into `DATABASE_URL`. Keep `?sslmode=require` on the end.
4. Install and create the tables:

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000. The seeded manager PIN is `2580`.

`npm run db:setup` creates the tables and loads a starter menu plus tables T1–T8. Running it again will not duplicate those dishes.

## What this version does

- Staff PIN sign-in
- Counter: add dishes, dine-in or takeaway, park a bill on a table, take payment
- Bills list for today, plus any still-open bills
- Menu: add a category or dish, hide a dish from the counter
- Printable receipt

GST is 5%, shown as CGST 2.5% and SGST 2.5%, added on top of menu prices.

## Next

Kitchen tickets, split payments, and a cash drawer close come after this counter is in daily use.
