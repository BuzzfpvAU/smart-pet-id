import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  const products = [
    {
      name: "Single Smart Tag",
      description: "One QR + NFC smart tag. Perfect for your most important item.",
      slug: "single-tag",
      price: 1500,
      tagQuantity: 1,
      sortOrder: 1,
    },
    {
      name: "3-Pack Smart Tags",
      description: "Three QR + NFC smart tags. Cover your essentials and save.",
      slug: "3-pack",
      price: 3500,
      compareAtPrice: 4500,
      tagQuantity: 3,
      sortOrder: 2,
    },
    {
      name: "5-Pack Smart Tags",
      description: "Five QR + NFC smart tags. Best value for families and frequent travellers.",
      slug: "5-pack",
      price: 5000,
      compareAtPrice: 7500,
      tagQuantity: 5,
      sortOrder: 3,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log("Seeded products:", products.map((p) => p.name).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
