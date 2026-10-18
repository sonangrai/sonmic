import type { Metadata } from "next";
import { AuthGate } from "../components/AuthGate";
import { Player } from "./Player";

export const metadata: Metadata = {
  title: "Player · sonmic",
};

export default function PlayerPage() {
  return (
    <AuthGate mode="app">
      <Player />
    </AuthGate>
  );
}
