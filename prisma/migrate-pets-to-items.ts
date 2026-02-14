/**
 * One-time migration script: Copy existing Pet records into the Item model
 * using the "pet" tag type, and set tag.itemId for all linked tags.
 *
 * Usage: npx tsx prisma/migrate-pets-to-items.ts
 *
 * This is non-destructive: it does NOT delete any Pet records or petId links.
 * After verifying the migration, you can optionally remove legacy pet data.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter });

async function main() {
  console.log("Starting pet-to-item migration...\n");

  // Find the "pet" tag type
  const petTagType = await prisma.tagType.findUnique({
    where: { slug: "pet" },
  });

  if (!petTagType) {
    console.error('ERROR: "pet" tag type not found. Run seed first: npx tsx prisma/seed.ts');
    process.exit(1);
  }

  console.log(`Found pet tag type: ${petTagType.id} (${petTagType.name})\n`);

  // Get all pets with their tags
  const pets = await prisma.pet.findMany({
    include: {
      tags: { select: { id: true } },
    },
  });

  console.log(`Found ${pets.length} pets to migrate\n`);

  let created = 0;
  let skipped = 0;
  let tagsLinked = 0;

  for (const pet of pets) {
    // Check if already migrated
    const existing = await prisma.item.findUnique({
      where: { legacyPetId: pet.id },
    });

    if (existing) {
      console.log(`  SKIP: "${pet.name}" (already migrated as item ${existing.id})`);
      skipped++;
      continue;
    }

    // Build the data JSON from pet fields
    const data: Record<string, unknown> = {};
    if (pet.species) data.species = pet.species;
    if (pet.breed) data.breed = pet.breed;
    if (pet.age) data.age = pet.age;
    if (pet.medications) data.medications = pet.medications;
    if (pet.vaccinations) data.vaccinations = pet.vaccinations;
    if (pet.allergies) data.allergies = pet.allergies;
    if (pet.specialNeeds) data.specialNeeds = pet.specialNeeds;
    if (pet.foodIntolerances) data.foodIntolerances = pet.foodIntolerances;
    if (pet.behavioralNotes) data.behavioralNotes = pet.behavioralNotes;
    if (pet.emergencyContacts) data.emergencyContacts = pet.emergencyContacts;

    // Build visibility from pet's privacyEnabled setting
    const visibility: Record<string, boolean> = {};
    if (pet.privacyEnabled) {
      visibility.ownerPhone = false;
      visibility.ownerEmail = false;
      visibility.ownerAddress = false;
      visibility.emergencyContacts = false;
    }

    // Create the Item record
    const item = await prisma.item.create({
      data: {
        userId: pet.userId,
        tagTypeId: petTagType.id,
        name: pet.name,
        data,
        photoUrls: pet.photoUrls || [],
        primaryPhotoUrl: pet.primaryPhotoUrl || null,
        ownerPhone: pet.ownerPhone || null,
        ownerEmail: pet.ownerEmail || null,
        ownerAddress: pet.ownerAddress || null,
        visibility,
        legacyPetId: pet.id,
      },
    });

    console.log(`  CREATE: "${pet.name}" -> item ${item.id}`);
    created++;

    // Link tags to the new item (keep petId intact for backward compat)
    for (const tag of pet.tags) {
      await prisma.tag.update({
        where: { id: tag.id },
        data: { itemId: item.id },
      });
      tagsLinked++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  Created: ${created} items`);
  console.log(`  Skipped: ${skipped} (already migrated)`);
  console.log(`  Tags linked: ${tagsLinked}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
