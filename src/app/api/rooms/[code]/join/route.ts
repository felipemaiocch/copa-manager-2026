import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { TEAMS } from "@/lib/game-data";
import { GameState } from "@/lib/game-engine";

export const runtime = "nodejs";

type RoomStateRow = {
  id: string;
  state: GameState;
};

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    await ensureSchema();
    const { code } = await context.params;
    const body = await request.json().catch(() => ({}));
    const managerName = String(body.managerName ?? "Manager").slice(0, 40);
    const teamId = String(body.teamId ?? "").slice(0, 12);

    if (!TEAMS.some((team) => team.id === teamId)) {
      return NextResponse.json({ error: "Selecao invalida." }, { status: 400 });
    }

    const sql = getSql();
    const rooms = (await sql`select id, state from rooms where code = ${code.toUpperCase()} limit 1`) as RoomStateRow[];
    if (!rooms.length) return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });

    const state = rooms[0].state;
    if (state.managers.some((manager) => manager.teamId === teamId)) {
      return NextResponse.json({ error: "Essa selecao ja foi escolhida." }, { status: 409 });
    }

    state.managers.push({ name: managerName, teamId });
    await sql`
      insert into room_players (room_id, manager_name, team_id)
      values (${rooms[0].id}, ${managerName}, ${teamId})
    `;
    await sql`
      update rooms
      set state = ${JSON.stringify(state)}::jsonb, updated_at = now()
      where id = ${rooms[0].id}
    `;

    return NextResponse.json({ ok: true, state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao entrar na sala.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
