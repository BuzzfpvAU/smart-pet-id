import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SHORT_CODE_LENGTH = 8;

function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter });

async function main() {
  const tags = await prisma.tag.findMany({
    where: { shortCode: null },
    select: { id: true },
  });

  console.log(`Found ${tags.length} tags without shortCode`);

  let updated = 0;
  for (const tag of tags) {
    let shortCode: string;
    let exists = true;

    // Ensure unique short codes
    do {
      shortCode = generateShortCode();
      const existing = await prisma.tag.findFirst({
        where: { shortCode },
      });
      exists = !!existing;
    } while (exists);

    await prisma.tag.update({
      where: { id: tag.id },
      data: { shortCode },
    });
    updated++;
  }

  console.log(`Backfilled ${updated} tags with shortCodes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
