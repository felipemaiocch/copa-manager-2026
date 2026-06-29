import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { GameState, simulateNext } from "@/lib/game-engine";

export const runtime = "nodejs";

type RoomStateRow = {
  id: string;
  state: GameState;
};

export async function POST(_: Request, context: { params: Promise<{ code: string }> }) {
  try {
    await ensureSchema();
    const { code } = await context.params;
    const sql = getSql();
    const rooms = (await sql`select id, state from rooms where code = ${code.toUpperCase()} limit 1`) as RoomStateRow[];
    if (!rooms.length) return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });

    const state = simulateNext(rooms[0].state);
    await sql`
      update rooms
      set state = ${JSON.stringify(state)}::jsonb,
          phase = ${state.phase},
          group_round = ${state.groupRound},
          ko_round = ${state.koRound},
          updated_at = now()
      where id = ${rooms[0].id}
    `;

    return NextResponse.json({ ok: true, state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao simular rodada.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
