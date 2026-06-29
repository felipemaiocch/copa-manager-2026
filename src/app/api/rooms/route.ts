import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { TEAMS } from "@/lib/game-data";
import { createGame } from "@/lib/game-engine";

export const runtime = "nodejs";

type RoomRow = {
  id: string;
  code: string;
  name: string;
  phase: string;
  group_round: number;
  ko_round: string | null;
  state: unknown;
  created_at: string;
  updated_at: string;
};

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json().catch(() => ({}));
    const managerName = String(body.managerName ?? "Manager").slice(0, 40);
    const teamId = String(body.teamId ?? "bra");
    const roomName = String(body.roomName ?? "Copa dos Amigos").slice(0, 80);

    if (!TEAMS.some((team) => team.id === teamId)) {
      return NextResponse.json({ error: "Selecao invalida." }, { status: 400 });
    }

    const code = roomCode();
    const state = createGame([{ name: managerName, teamId }]);
    const sql = getSql();
    const rows = (await sql`
      insert into rooms (code, name, phase, group_round, ko_round, state)
      values (${code}, ${roomName}, ${state.phase}, ${state.groupRound}, ${state.koRound}, ${JSON.stringify(state)}::jsonb)
      returning id, code, name, phase, group_round, ko_round, state, created_at, updated_at
    `) as RoomRow[];
    await sql`
      insert into room_players (room_id, manager_name, team_id)
      values (${rows[0].id}, ${managerName}, ${teamId})
    `;

    return NextResponse.json({ room: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao criar sala.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
