import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In - Smart Pet ID",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
