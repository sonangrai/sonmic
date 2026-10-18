import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/site";
import { AuthCard } from "../components/AuthCard";
import { AuthGate } from "../components/AuthGate";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = privatePageMetadata(
  "Log in",
  "Log in to sonmic with the account set up on your backend.",
);

export default function LoginPage() {
  return (
    <AuthGate mode="login">
      <AuthCard title="Log in to sonmic" subtitle="Use the account set up on your backend.">
        <LoginForm />
      </AuthCard>
    </AuthGate>
  );
}
