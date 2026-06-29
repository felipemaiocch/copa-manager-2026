"use client";

import { useEffect, useMemo, useState } from "react";
import type { TeamInfo } from "@/lib/game-data";
import { GROUPS, FORMATIONS, teamById } from "@/lib/game-data";
import type { GameState, Match } from "@/lib/game-engine";
import { groupStandings, name, roundLabel, starters, teamPower } from "@/lib/game-engine";

type RoomPayload = {
  room: {
    code: string;
    name: string;
    state: GameState;
    updated_at: string;
  };
  players?: { manager_name: string; team_id: string }[];
};

const emptyForm = {
  managerName: "Felipe",
  teamId: "bra",
  roomName: "Copa dos Amigos",
  code: ""
};

export function GameClient({ teams }: { teams: TeamInfo[] }) {
  const [form, setForm] = useState(emptyForm);
  const [room, setRoom] = useState<RoomPayload | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("bra");
  const [group, setGroup] = useState("A");
  const [message, setMessage] = useState("");

  async function refresh(code = room?.room.code) {
    if (!code) return;
    const response = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    setRoom(payload);
    const firstTeam = payload.room.state.managers[0]?.teamId;
    if (firstTeam && !payload.room.state.managers.some((manager: { teamId: string }) => manager.teamId === selectedTeam)) {
      setSelectedTeam(firstTeam);
    }
  }

  useEffect(() => {
    if (!room?.room.code) return;
    const id = window.setInterval(() => refresh(room.room.code), 3500);
    return () => window.clearInterval(id);
  }, [room?.room.code]);

  async function createRoom() {
    setMessage("");
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Erro ao criar sala.");
    setRoom(payload);
    setSelectedTeam(form.teamId);
  }

  async function joinRoom() {
    setMessage("");
    const response = await fetch(`/api/rooms/${form.code.trim().toUpperCase()}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Erro ao entrar na sala.");
    await refresh(form.code.trim().toUpperCase());
    setSelectedTeam(form.teamId);
  }

  async function loadRoom() {
    setMessage("");
    await refresh(form.code.trim().toUpperCase());
  }

  async function advance() {
    if (!room) return;
    const response = await fetch(`/api/rooms/${room.room.code}/advance`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Erro ao simular.");
    setRoom({ ...room, room: { ...room.room, state: payload.state } });
  }

  async function saveTactics(data: FormData) {
    if (!room) return;
    const response = await fetch(`/api/rooms/${room.room.code}/tactics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: selectedTeam,
        formation: data.get("formation"),
        mentality: data.get("mentality"),
        pressing: data.get("pressing"),
        passing: data.get("passing"),
        marking: data.get("marking")
      })
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "Erro ao salvar tatica.");
    setRoom({ ...room, room: { ...room.room, state: payload.state } });
  }

  const state = room?.room.state;
  const selectedInfo = teamById(selectedTeam);
  const selectedState = state?.teams[selectedTeam];
  const power = state && selectedState ? teamPower(state, selectedTeam) : null;
  const lastMatch = useMemo(() => {
    if (!state?.lastResults.length) return null;
    const all = [...state.matches, ...Object.values(state.knockout).flat()];
    return all.find((match) => match.id === state.lastResults[0]) ?? null;
  }, [state]);

  return (
    <main className="shell">
      <div className="topbar">
        <div className="brand">
          <h1>Copa Manager 2026</h1>
          <div className="muted">Plataforma web para criar sala, escolher selecao, ajustar tatica e simular contra amigos.</div>
        </div>
        {room && (
          <div className="actions">
            <span className="pill">Sala {room.room.code}</span>
            <button className="primary" onClick={advance}>{state?.phase === "finished" ? "Copa encerrada" : "Simular proxima rodada"}</button>
          </div>
        )}
      </div>

      {!room ? (
        <div className="grid two">
          <section className="panel">
            <h2>Criar sala</h2>
            <div className="form-row">
              <Field label="Nome da sala" value={form.roomName} onChange={(roomName) => setForm({ ...form, roomName })} />
              <Field label="Seu nome" value={form.managerName} onChange={(managerName) => setForm({ ...form, managerName })} />
              <SelectTeam teams={teams} value={form.teamId} onChange={(teamId) => setForm({ ...form, teamId })} />
            </div>
            <button className="primary" onClick={createRoom}>Criar Copa</button>
          </section>

          <section className="panel">
            <h2>Entrar em sala</h2>
            <div className="form-row">
              <Field label="Codigo da sala" value={form.code} onChange={(code) => setForm({ ...form, code })} />
              <Field label="Seu nome" value={form.managerName} onChange={(managerName) => setForm({ ...form, managerName })} />
              <SelectTeam teams={teams} value={form.teamId} onChange={(teamId) => setForm({ ...form, teamId })} />
            </div>
            <div className="actions">
              <button className="primary" onClick={joinRoom}>Entrar e escolher time</button>
              <button onClick={loadRoom}>Assistir sala</button>
            </div>
            {message && <p className="muted">{message}</p>}
          </section>
        </div>
      ) : state && (
        <div className="layout">
          <aside className="panel">
            <h2>{room.room.name}</h2>
            <div className="form-row">
              <label>Selecao em foco</label>
              <select value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}>
                {state.managers.map((manager) => (
                  <option key={manager.teamId} value={manager.teamId}>{manager.name} - {name(manager.teamId)}</option>
                ))}
              </select>
            </div>
            <div className="grid">
              <span className="badge good">{state.phase === "groups" ? `Grupos - rodada ${state.groupRound}` : state.phase === "knockout" ? `Mata-mata - ${roundLabel(state.koRound ?? "")}` : "Copa encerrada"}</span>
              <span className="pill">Compartilhe o codigo {room.room.code}</span>
              <span className="pill">{state.managers.length} jogador(es)</span>
            </div>
            {message && <p className="muted">{message}</p>}
          </aside>

          <section className="grid">
            {state.champion && (
              <div className="panel">
                <h2>{name(state.champion)} campeao</h2>
                <p className="muted">Vice: {state.runnerUp ? name(state.runnerUp) : "a definir"} | 3o lugar: {state.third ? name(state.third) : "a definir"}</p>
              </div>
            )}

            <div className="grid three">
              <Metric label="Forca media" value={power ? String(Math.round(power.overall)) : "-"} />
              <Metric label="Moral" value={selectedState ? `${Math.round(selectedState.morale)}%` : "-"} />
              <Metric label="Caixa" value={selectedState ? money(selectedState.balance) : "-"} />
            </div>

            <div className="grid two">
              <section className="panel">
                <h2>Campo ao vivo</h2>
                <Pitch match={lastMatch} state={state} selectedTeam={selectedTeam} />
              </section>

              <section className="panel">
                <h2>Tatica - {selectedInfo?.name}</h2>
                {selectedState && (
                  <form action={saveTactics} className="grid">
                    <label>Formacao<select name="formation" defaultValue={selectedState.formation}>{Object.keys(FORMATIONS).map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Mentalidade<select name="mentality" defaultValue={selectedState.mentality}>{["defensivo", "equilibrado", "ofensivo", "contra-ataque"].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Pressao<select name="pressing" defaultValue={selectedState.pressing}>{["baixa", "media", "alta"].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Passe<select name="passing" defaultValue={selectedState.passing}>{["curto", "misto", "direto"].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Marcacao<select name="marking" defaultValue={selectedState.marking}>{["zona", "individual"].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <button className="primary" type="submit">Salvar tatica</button>
                  </form>
                )}
              </section>
            </div>

            <div className="grid two">
              <section className="panel">
                <h2>Classificacao</h2>
                <div className="tabs">
                  {GROUPS.map((item) => <button key={item} className={`tab ${group === item ? "active" : ""}`} onClick={() => setGroup(item)}>Grupo {item}</button>)}
                </div>
                <Standings state={state} group={group} />
              </section>

              <section className="panel">
                <h2>Elenco titular</h2>
                <Squad state={state} teamId={selectedTeam} />
              </section>
            </div>

            <section className="panel">
              <h2>Ultimos resultados</h2>
              <Results state={state} />
            </section>
          </section>
        </div>
      )}
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectTeam({ teams, value, onChange }: { teams: TeamInfo[]; value: string; onChange: (value: string) => void }) {
  return (
    <label>Selecao
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {teams.map((team) => <option key={team.id} value={team.id}>{team.flag} - {team.name} - Grupo {team.group}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="panel"><div className="muted">{label}</div><h2>{value}</h2></div>;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function Standings({ state, group }: { state: GameState; group: string }) {
  const rows = groupStandings(state, group);
  return (
    <table>
      <thead><tr><th>#</th><th>Selecao</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead>
      <tbody>{rows.map((row, index) => <tr key={row.teamId}><td>{index + 1}</td><td>{row.team}</td><td>{row.mp}</td><td>{row.w}</td><td>{row.d}</td><td>{row.l}</td><td>{row.gd}</td><td><strong>{row.pts}</strong></td></tr>)}</tbody>
    </table>
  );
}

function Squad({ state, teamId }: { state: GameState; teamId: string }) {
  const players = starters(state, teamId);
  return (
    <table>
      <thead><tr><th>#</th><th>Jogador</th><th>Pos</th><th>Geral</th><th>Fisico</th><th>Status</th></tr></thead>
      <tbody>{players.map((player) => <tr key={player.id}><td>{player.number}</td><td>{player.name}</td><td>{player.pos}</td><td><strong>{player.ovr}</strong></td><td>{Math.round(player.fitness)}%</td><td>{player.injury > 0 ? `lesao ${player.injury}j` : player.susp > 0 ? "suspenso" : "ok"}</td></tr>)}</tbody>
    </table>
  );
}

function Results({ state }: { state: GameState }) {
  const all = [...state.matches, ...Object.values(state.knockout).flat()];
  const matches = state.lastResults.map((id) => all.find((match) => match.id === id)).filter(Boolean) as Match[];
  if (!matches.length) return <p className="muted">Nenhum jogo simulado ainda.</p>;
  return <div className="grid three">{matches.slice(0, 9).map((match) => <MatchCard key={match.id} match={match} />)}</div>;
}

function MatchCard({ match }: { match: Match }) {
  return (
    <div>
      <div className="score">
        <span>{name(match.home)}</span>
        <strong>{match.hg} x {match.ag}</strong>
        <span className="right">{name(match.away)}</span>
      </div>
      <span className="pill">{match.phase === "groups" ? `Grupo ${match.group} R${match.round}` : roundLabel(match.phase)}</span>
    </div>
  );
}

function Pitch({ match, state, selectedTeam }: { match: Match | null; state: GameState; selectedTeam: string }) {
  const fallbackHome = selectedTeam;
  const fallbackAway = state.matches.find((item) => item.home === selectedTeam || item.away === selectedTeam);
  const homeId = match?.home ?? fallbackHome;
  const awayId = match?.away ?? (fallbackAway?.home === selectedTeam ? fallbackAway.away : fallbackAway?.home) ?? state.managers.find((manager) => manager.teamId !== selectedTeam)?.teamId ?? "arg";
  const home = starters(state, homeId).slice(0, 11);
  const away = starters(state, awayId).slice(0, 11);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  const ballLeft = 48 + Math.sin(tick * 1.7) * 24;
  const ballTop = 50 + Math.cos(tick * 1.1) * 18;

  return (
    <div className="grid">
      <div className="pitch">
        {home.map((player, index) => <PlayerDot key={player.id} player={player} index={index} side="home" tick={tick} />)}
        {away.map((player, index) => <PlayerDot key={player.id} player={player} index={index} side="away" tick={tick} />)}
        <div className="ball" style={{ left: `${ballLeft}%`, top: `${ballTop}%` }} />
      </div>
      <div className="score">
        <span>{name(homeId)}</span>
        <strong>{match?.status === "complete" ? `${match.hg} x ${match.ag}` : "x"}</strong>
        <span className="right">{name(awayId)}</span>
      </div>
      <div className="event-list">
        {match?.events.length ? match.events.map((event, index) => <div className="event" key={`${event.minute}-${index}`}><strong>{event.minute}&apos;</strong> {event.text}</div>) : <p className="muted">Simule uma rodada para ver lances, gols, cartoes e movimentacao.</p>}
      </div>
    </div>
  );
}

function PlayerDot({ player, index, side, tick }: { player: { number: number; pos: string }; index: number; side: "home" | "away"; tick: number }) {
  const shape = [
    [9, 50], [23, 24], [24, 44], [24, 64], [25, 80], [38, 30], [39, 50], [39, 70], [52, 28], [53, 50], [54, 72]
  ];
  const [baseX, baseY] = shape[index] ?? [50, 50];
  const direction = side === "home" ? 1 : -1;
  const left = side === "home" ? baseX : 100 - baseX;
  const driftX = Math.sin(tick + index * 0.8) * 2.8 * direction;
  const driftY = Math.cos(tick * 0.9 + index) * 2.6;

  return (
    <div
      className={`player-dot ${side === "home" ? "home-dot" : "away-dot"}`}
      title={`${player.number} - ${player.pos}`}
      style={{ left: `${left + driftX}%`, top: `${baseY + driftY}%` }}
    >
      {player.number}
    </div>
  );
}
