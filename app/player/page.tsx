import type { Metadata } from "next";
import { Player } from "./Player";

export const metadata: Metadata = {
  title: "Player · sonmic",
};

export default function PlayerPage() {
  return <Player />;
}
