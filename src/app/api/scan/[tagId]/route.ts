import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, status: "active" },
    include: { pet: true },
  });

  if (!tag || !tag.pet) {
    return NextResponse.json(
      { error: "Tag not found or not linked to a pet" },
      { status: 404 }
    );
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
          emergencyContacts: pet.emergencyContacts,
        }),
  };

  return NextResponse.json(publicProfile);
}
