import { GameClient } from "@/components/GameClient";
import { TEAMS } from "@/lib/game-data";

export default function Home() {
  return <GameClient teams={TEAMS} />;
}
