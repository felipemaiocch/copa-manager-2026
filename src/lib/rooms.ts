import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "./db";
import { TEAMS } from "./game-data";
import { GameState } from "./game-engine";

type RoomStateRow = {
  id: string;
  state: GameState;
};

export async function joinRoomByCode(code: string, managerName: string, teamId: string) {
  try {
    await ensureSchema();

    if (!code) {
      return NextResponse.json({ error: "Digite o codigo da sala." }, { status: 400 });
    }

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
