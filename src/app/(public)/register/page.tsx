import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Sign Up - Tagz.au",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
