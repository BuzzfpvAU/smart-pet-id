import { PetProfileForm } from "@/components/pets/pet-profile-form";

export const metadata = {
  title: "Add Profile - Tagz.au",
};

export default function NewPetPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add a New Profile</h1>
        <p className="text-muted-foreground text-sm">
          Create a profile to link to a smart tag
        </p>
      </div>
      <PetProfileForm />
    </div>
  );
}
