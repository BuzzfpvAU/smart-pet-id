import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot Password - Tagz.au",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}
