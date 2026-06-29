import { joinRoomByCode } from "@/lib/rooms";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? body.roomCode ?? "").trim().toUpperCase();
  const managerName = String(body.managerName ?? "Manager").slice(0, 40);
  const teamId = String(body.teamId ?? "").slice(0, 12);

  return joinRoomByCode(code, managerName, teamId);
}
