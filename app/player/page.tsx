import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/site";
import { AuthGate } from "../components/AuthGate";
import { Player } from "./Player";

export const metadata: Metadata = privatePageMetadata(
  "Player",
  "Play the music saved on this device, even offline.",
);

export default function PlayerPage() {
  return (
    <AuthGate mode="app">
      <Player />
    </AuthGate>
  );
}
