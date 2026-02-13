import { PetProfileForm } from "@/components/pets/pet-profile-form";

export const metadata = {
  title: "Add Pet - Smart Pet ID",
};

export default function NewPetPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add a New Pet</h1>
        <p className="text-muted-foreground text-sm">
          Create a profile for your pet to link to a smart tag
        </p>
      </div>
      <PetProfileForm />
    </div>
  );
}
