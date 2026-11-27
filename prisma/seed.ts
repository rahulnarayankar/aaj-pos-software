import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Diet } from "@prisma/client";

const prisma = new PrismaClient();

const menu: { name: string; items: { name: string; price: number; diet: Diet }[] }[] = [
  {
    name: "Starters",
    items: [
      { name: "Paneer Tikka", price: 280, diet: "VEG" },
      { name: "Chicken Tikka", price: 320, diet: "NON_VEG" },
      { name: "Veg Seekh Kebab", price: 240, diet: "VEG" },
      { name: "Hara Bhara Kebab", price: 220, diet: "VEG" },
    ],
  },
  {
    name: "Mains",
    items: [
      { name: "Dal Tadka", price: 220, diet: "VEG" },
      { name: "Paneer Butter Masala", price: 320, diet: "VEG" },
      { name: "Butter Chicken", price: 360, diet: "NON_VEG" },
      { name: "Veg Biryani", price: 260, diet: "VEG" },
      { name: "Chicken Biryani", price: 320, diet: "NON_VEG" },
    ],
  },
  {
    name: "Breads",
    items: [
      { name: "Butter Naan", price: 50, diet: "VEG" },
      { name: "Garlic Naan", price: 70, diet: "VEG" },
      { name: "Tandoori Roti", price: 30, diet: "VEG" },
    ],
  },
  {
    name: "Drinks",
    items: [
      { name: "Sweet Lassi", price: 80, diet: "VEG" },
      { name: "Masala Chaas", price: 60, diet: "VEG" },
      { name: "Masala Soda", price: 50, diet: "VEG" },
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
          diet: item.diet,
          isVeg: item.diet !== "NON_VEG",
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
