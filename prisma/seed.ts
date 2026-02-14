import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter });

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SHORT_CODE_LENGTH = 8;

function generateActivationCode(): string {
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

async function main() {
  console.log("Seeding database...");

  // Create test user
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@smartpetid.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@smartpetid.com",
      passwordHash,
      emailVerified: new Date(),
      role: "admin",
    },
  });
  console.log(`Test user: admin@smartpetid.com / password123`);

  // Create sample tags (batch of 20)
  const tagCodes: string[] = [];
  for (let i = 0; i < 20; i++) {
    tagCodes.push(generateActivationCode());
  }

  for (const code of tagCodes) {
    await prisma.tag.upsert({
      where: { activationCode: code },
      update: {},
      create: {
        activationCode: code,
        shortCode: generateShortCode(),
        status: "inactive",
      },
    });
  }

  console.log(`Created ${tagCodes.length} tags:`);
  tagCodes.forEach((code) => console.log(`  ${code}`));

  // Create FAQ items
  const faqs = [
    {
      question: "What is a Tagz.au Tag?",
      answer:
        "A Tagz.au Tag is a digital pet identification tag with a QR code and NFC chip that links to a detailed online pet profile.",
      sortOrder: 1,
    },
    {
      question: "How do I create a pet profile?",
      answer:
        "Create an account, activate your tag with the code provided, and fill in your pet's information including photos, medical details, and emergency contacts.",
      sortOrder: 2,
    },
    {
      question: "Is there a subscription fee?",
      answer:
        "No. There are no subscription fees. Once you purchase a tag, the online profile service is free to use forever.",
      sortOrder: 3,
    },
    {
      question: "How many pets can I add?",
      answer:
        "You can add an unlimited number of pet profiles to your account.",
      sortOrder: 4,
    },
    {
      question: "Does the tag work worldwide?",
      answer:
        "Yes. QR codes and NFC work with any smartphone anywhere in the world.",
      sortOrder: 5,
    },
  ];

  for (const faq of faqs) {
    await prisma.faqItem.create({
      data: faq,
    });
  }

  console.log(`Created ${faqs.length} FAQ items`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
