import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const menu = [
  {
    name: "Starters",
    items: [
      { name: "Paneer Tikka", price: 280, isVeg: true },
      { name: "Chicken Tikka", price: 320, isVeg: false },
      { name: "Veg Seekh Kebab", price: 240, isVeg: true },
      { name: "Hara Bhara Kebab", price: 220, isVeg: true },
    ],
  },
  {
    name: "Mains",
    items: [
      { name: "Dal Tadka", price: 220, isVeg: true },
      { name: "Paneer Butter Masala", price: 320, isVeg: true },
      { name: "Butter Chicken", price: 360, isVeg: false },
      { name: "Veg Biryani", price: 260, isVeg: true },
      { name: "Chicken Biryani", price: 320, isVeg: false },
    ],
  },
  {
    name: "Breads",
    items: [
      { name: "Butter Naan", price: 50, isVeg: true },
      { name: "Garlic Naan", price: 70, isVeg: true },
      { name: "Tandoori Roti", price: 30, isVeg: true },
    ],
  },
  {
    name: "Drinks",
    items: [
      { name: "Sweet Lassi", price: 80, isVeg: true },
      { name: "Masala Chaas", price: 60, isVeg: true },
      { name: "Masala Soda", price: 50, isVeg: true },
    ],
  },
];

async function main() {
  const pin = process.env.POS_SEED_PIN ?? "2580";
  const pinHash = await bcrypt.hash(pin, 10);

  await prisma.staff.upsert({
    where: { id: "staff_manager" },
    update: { name: "Manager", role: "MANAGER", active: true },
    create: {
      id: "staff_manager",
      name: "Manager",
      pinHash,
      role: "MANAGER",
    },
  });

  const manager = await prisma.staff.findUnique({ where: { id: "staff_manager" } });
  if (manager && !(await bcrypt.compare(pin, manager.pinHash))) {
    await prisma.staff.update({
      where: { id: "staff_manager" },
      data: { pinHash },
    });
  }

  await prisma.orderCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, last: 100 },
  });

  for (const [categoryIndex, category] of menu.entries()) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name },
    });
    const saved =
      existing ??
      (await prisma.category.create({
        data: { name: category.name, sortOrder: categoryIndex + 1 },
      }));

    for (const [itemIndex, item] of category.items.entries()) {
      const found = await prisma.menuItem.findFirst({
        where: { categoryId: saved.id, name: item.name },
      });
      if (found) continue;
      await prisma.menuItem.create({
        data: {
          categoryId: saved.id,
          name: item.name,
          pricePaise: item.price * 100,
          isVeg: item.isVeg,
          sortOrder: itemIndex + 1,
        },
      });
    }
  }

  for (let number = 1; number <= 8; number += 1) {
    await prisma.diningTable.upsert({
      where: { name: `T${number}` },
      update: { sortOrder: number, seats: 4 },
      create: { name: `T${number}`, sortOrder: number, seats: 4 },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
