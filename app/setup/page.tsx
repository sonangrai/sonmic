import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/site";
import { AuthCard } from "../components/AuthCard";
import { AuthGate } from "../components/AuthGate";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = privatePageMetadata(
  "Connect to your backend",
  "Connect sonmic to the backend server that downloads audio for your family.",
);

export default function SetupPage() {
  return (
    <AuthGate mode="setup">
      <AuthCard
        title="Connect to your backend"
        subtitle="sonmic downloads audio through your own server."
      >
        <SetupForm />
      </AuthCard>
    </AuthGate>
  );
}
