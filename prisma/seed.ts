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

  // Seed default tag types
  const { defaultTagTypes } = await import("../src/lib/tag-type-defaults");

  for (const tagType of defaultTagTypes) {
    await prisma.tagType.upsert({
      where: { slug: tagType.slug },
      update: {
        name: tagType.name,
        description: tagType.description,
        icon: tagType.icon,
        color: tagType.color,
        fieldGroups: tagType.fieldGroups,
        defaultVisibility: tagType.defaultVisibility,
      },
      create: {
        slug: tagType.slug,
        name: tagType.name,
        description: tagType.description,
        icon: tagType.icon,
        color: tagType.color,
        fieldGroups: tagType.fieldGroups,
        defaultVisibility: tagType.defaultVisibility,
        sortOrder: defaultTagTypes.indexOf(tagType),
      },
    });
  }

  console.log(`Seeded ${defaultTagTypes.length} tag types`);

  // Seed default checklist templates
  const checklistTemplates = [
    {
      name: "Drone Pre-flight",
      description: "Pre-flight inspection checklist for drones and UAVs",
      icon: "plane",
      color: "#8b5cf6",
      sortOrder: 0,
      items: [
        { id: "drone-1", label: "Drone present", type: "checkbox", required: true },
        { id: "drone-2", label: "Controller", type: "checkbox", required: true },
        { id: "drone-3", label: "Charger", type: "checkbox", required: false },
        { id: "drone-4", label: "Spare propellers", type: "checkbox", required: false },
        { id: "drone-5", label: "Battery count", type: "number", required: true },
        { id: "drone-6", label: "USB cables", type: "checkbox", required: false },
        { id: "drone-7", label: "Memory cards", type: "checkbox", required: true },
        { id: "drone-8", label: "Firmware updated", type: "checkbox", required: false },
        { id: "drone-9", label: "Pre-flight notes", type: "text", required: false },
      ],
    },
    {
      name: "Vehicle Inspection",
      description: "Daily vehicle walk-around inspection checklist",
      icon: "car",
      color: "#ef4444",
      sortOrder: 1,
      items: [
        { id: "vehicle-1", label: "Tyre pressure checked", type: "checkbox", required: true },
        { id: "vehicle-2", label: "Oil level checked", type: "checkbox", required: true },
        { id: "vehicle-3", label: "Coolant level checked", type: "checkbox", required: true },
        { id: "vehicle-4", label: "Lights working", type: "checkbox", required: true },
        { id: "vehicle-5", label: "Odometer", type: "number", required: true },
        { id: "vehicle-6", label: "Fuel level %", type: "number", required: false },
        { id: "vehicle-7", label: "Windscreen OK", type: "checkbox", required: true },
        { id: "vehicle-8", label: "Notes", type: "text", required: false },
      ],
    },
    {
      name: "Fire Safety",
      description: "Fire extinguisher and safety equipment inspection",
      icon: "flame",
      color: "#f97316",
      sortOrder: 2,
      items: [
        { id: "fire-1", label: "Extinguisher present", type: "checkbox", required: true },
        { id: "fire-2", label: "Seal intact", type: "checkbox", required: true },
        { id: "fire-3", label: "Pressure gauge OK", type: "checkbox", required: true },
        { id: "fire-4", label: "Accessible and unobstructed", type: "checkbox", required: true },
        { id: "fire-5", label: "Last service date", type: "text", required: false },
        { id: "fire-6", label: "Inspector name", type: "text", required: true },
      ],
    },
    {
      name: "Equipment Handover",
      description: "Equipment handover and receipt checklist",
      icon: "package",
      color: "#10b981",
      sortOrder: 3,
      items: [
        { id: "equip-1", label: "All items present", type: "checkbox", required: true },
        { id: "equip-2", label: "No visible damage", type: "checkbox", required: true },
        { id: "equip-3", label: "Quantity", type: "number", required: true },
        { id: "equip-4", label: "Condition notes", type: "text", required: false },
        { id: "equip-5", label: "Received by", type: "text", required: true },
      ],
    },
  ];

  for (const template of checklistTemplates) {
    const existing = await prisma.checklistTemplate.findFirst({
      where: { name: template.name },
    });
    if (!existing) {
      await prisma.checklistTemplate.create({ data: template });
    }
  }

  console.log(`Seeded ${checklistTemplates.length} checklist templates`);
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
