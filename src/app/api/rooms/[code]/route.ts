import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const sql = getSql();
  const rooms = await sql`
    select id, code, name, phase, group_round, ko_round, state, created_at, updated_at
    from rooms
    where code = ${code.toUpperCase()}
    limit 1
  `;

  if (!rooms.length) {
    return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });
  }

  const players = await sql`
    select manager_name, team_id, created_at
    from room_players
    where room_id = ${rooms[0].id}
    order by created_at asc
  `;

  return NextResponse.json({ room: rooms[0], players });
}
