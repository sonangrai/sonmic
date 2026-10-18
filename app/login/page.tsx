import type { Metadata } from "next";
import { AuthCard } from "../components/AuthCard";
import { AuthGate } from "../components/AuthGate";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in · sonmic",
};

export default function LoginPage() {
  return (
    <AuthGate mode="login">
      <AuthCard title="Log in to sonmic" subtitle="Use the account set up on your backend.">
        <LoginForm />
      </AuthCard>
    </AuthGate>
  );
}
