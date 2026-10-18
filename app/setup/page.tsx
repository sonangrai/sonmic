import type { Metadata } from "next";
import { AuthCard } from "../components/AuthCard";
import { AuthGate } from "../components/AuthGate";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = {
  title: "Connect · sonmic",
};

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
