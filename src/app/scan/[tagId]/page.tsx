import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ScanPageClient } from "@/components/scan/scan-page-client";

interface Props {
  params: Promise<{ tagId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tagId } = await params;

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, status: "active" },
    include: { pet: { select: { name: true, species: true, primaryPhotoUrl: true } } },
  });

  if (!tag?.pet) {
    return { title: "Pet Not Found - Smart Pet ID" };
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

export default async function ScanPage({ params }: Props) {
  const { tagId } = await params;

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, status: "active" },
    include: { pet: true },
  });

  if (!tag || !tag.pet) {
    notFound();
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

  return <ScanPageClient tagId={tagId} pet={publicProfile} />;
}
