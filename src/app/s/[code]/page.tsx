import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ScanPageClient } from "@/components/scan/scan-page-client";
import { InactiveTagPage } from "@/components/scan/inactive-tag-page";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;

  const tag = await prisma.tag.findFirst({
    where: { shortCode: code },
    include: { pet: { select: { name: true, species: true, primaryPhotoUrl: true } } },
  });

  if (!tag) {
    return { title: "Tag Not Found - Smart Pet ID" };
  }

  if (tag.status !== "active" || !tag.pet) {
    return { title: "Activate Your Tag - Smart Pet ID" };
  }

  return {
    title: `${tag.pet.name} - Smart Pet ID`,
    description: `Found a ${tag.pet.species}? This is ${tag.pet.name}'s Smart Pet ID profile. Scan to contact the owner.`,
    openGraph: {
      title: `${tag.pet.name} - Smart Pet ID`,
      description: `Found a ${tag.pet.species}? Contact the owner through Smart Pet ID.`,
      images: tag.pet.primaryPhotoUrl ? [tag.pet.primaryPhotoUrl] : [],
    },
  };
}

export default async function ShortScanPage({ params }: Props) {
  const { code } = await params;

  const tag = await prisma.tag.findFirst({
    where: { shortCode: code },
    include: { pet: true },
  });

  // Tag doesn't exist at all — true 404
  if (!tag) {
    notFound();
  }

  // Tag exists but is not active or has no pet linked — show activation page
  if (tag.status !== "active" || !tag.pet) {
    return <InactiveTagPage activationCode={tag.activationCode} tagStatus={tag.status} />;
  }

  const pet = tag.pet;

  const publicProfile = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    photoUrls: pet.photoUrls,
    primaryPhotoUrl: pet.primaryPhotoUrl,
    medications: pet.medications,
    vaccinations: pet.vaccinations,
    allergies: pet.allergies,
    specialNeeds: pet.specialNeeds,
    foodIntolerances: pet.foodIntolerances,
    behavioralNotes: pet.behavioralNotes,
    privacyEnabled: pet.privacyEnabled,
    ...(pet.privacyEnabled
      ? {}
      : {
          ownerPhone: pet.ownerPhone,
          ownerEmail: pet.ownerEmail,
          ownerAddress: pet.ownerAddress,
          emergencyContacts: pet.emergencyContacts as { name: string; phone: string; relationship?: string }[] | null,
        }),
  };

  // Pass the original tag.id so existing /api/scan/[tagId]/* APIs work unchanged
  return <ScanPageClient tagId={tag.id} pet={publicProfile} />;
}
