import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { FORMATIONS } from "@/lib/game-data";
import { GameState, updateTactics } from "@/lib/game-engine";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const body = await request.json().catch(() => ({}));
  const teamId = String(body.teamId ?? "");
  const patch = {
    formation: Object.keys(FORMATIONS).includes(body.formation) ? body.formation : undefined,
    mentality: ["defensivo", "equilibrado", "ofensivo", "contra-ataque"].includes(body.mentality) ? body.mentality : undefined,
    pressing: ["baixa", "media", "alta"].includes(body.pressing) ? body.pressing : undefined,
    passing: ["curto", "misto", "direto"].includes(body.passing) ? body.passing : undefined,
    marking: ["zona", "individual"].includes(body.marking) ? body.marking : undefined
  };

  const sql = getSql();
  const rooms = await sql`select id, state from rooms where code = ${code.toUpperCase()} limit 1`;
  if (!rooms.length) return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });

  const state = updateTactics(rooms[0].state as GameState, teamId, patch);
  await sql`
    update rooms
    set state = ${JSON.stringify(state)}::jsonb, updated_at = now()
    where id = ${rooms[0].id}
  `;

  return NextResponse.json({ ok: true, state });
}
