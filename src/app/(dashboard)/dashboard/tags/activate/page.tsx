import { Suspense } from "react";
import { TagActivationForm } from "@/components/tags/tag-activation-form";

export const metadata = {
  title: "Activate Tag - Tagz.au",
};

export default function ActivateTagPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold">Activate a Tag</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the activation code found on your smart tag
        </p>
      </div>
      <Suspense>
        <TagActivationForm />
      </Suspense>
    </div>
  );
}
