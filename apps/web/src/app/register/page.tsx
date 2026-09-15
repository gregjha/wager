import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Wager",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">
          Find a game tonight, or run your own
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
