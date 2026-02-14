import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PetProfileForm } from "@/components/pets/pet-profile-form";
import { DeletePetButton } from "@/components/pets/delete-pet-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";

export const metadata = {
  title: "Edit Pet - Tagz.au",
};

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { petId } = await params;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, userId: session.user.id },
  });

  if (!pet) notFound();

  const initialData = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed || "",
    age: pet.age || "",
    primaryPhotoUrl: pet.primaryPhotoUrl || "",
    photoUrls: pet.photoUrls || [],
    medications: pet.medications || "",
    vaccinations: pet.vaccinations || "",
    allergies: pet.allergies || "",
    specialNeeds: pet.specialNeeds || "",
    foodIntolerances: pet.foodIntolerances || "",
    behavioralNotes: pet.behavioralNotes || "",
    ownerPhone: pet.ownerPhone || "",
    ownerEmail: pet.ownerEmail || "",
    ownerAddress: pet.ownerAddress || "",
    emergencyContacts: (pet.emergencyContacts as { name: string; phone: string; relationship?: string }[]) || [],
    privacyEnabled: pet.privacyEnabled,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit {pet.name}</h1>
            <p className="text-muted-foreground text-sm">
              Update your pet&apos;s profile information
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/pets/${petId}/scans`}>
            <History className="h-4 w-4 mr-2" />
            Scan History
          </Link>
        </Button>
      </div>
      <PetProfileForm initialData={initialData} petId={petId} />
      <DeletePetButton petId={petId} petName={pet.name} />
    </div>
  );
}
