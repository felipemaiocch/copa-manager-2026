import { FORMATIONS, GROUPS, POSITIONS, TEAMS, teamById } from "./game-data";

export type Player = {
  id: string;
  name: string;
  pos: string;
  cat: "GOL" | "DEF" | "MEI" | "ATA";
  number: number;
  age: number;
  atk: number;
  def: number;
  tec: number;
  fis: number;
  gk: number;
  ovr: number;
  form: number;
  fitness: number;
  morale: number;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
  injury: number;
  susp: number;
  matches: number;
  value: number;
};

export type Match = {
  id: string;
  phase: "groups" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  group?: string;
  round?: number;
  home: string;
  away: string;
  status: "scheduled" | "complete";
  hg: number | null;
  ag: number | null;
  winner: string | null;
  events: { minute: number; type: string; team?: string | null; text: string }[];
  pen: { home: number; away: number } | null;
  extra: boolean;
};

export type GameState = {
  version: string;
  phase: "lobby" | "groups" | "knockout" | "finished";
  groupRound: number;
  koRound: "r32" | "r16" | "qf" | "sf" | "third" | "final" | null;
  managers: { name: string; teamId: string }[];
  teams: Record<string, { formation: keyof typeof FORMATIONS; mentality: string; pressing: string; passing: string; marking: string; morale: number; balance: number; lineup: string[]; eliminated: boolean }>;
  players: Record<string, Player[]>;
  matches: Match[];
  knockout: Record<"r32" | "r16" | "qf" | "sf" | "third" | "final", Match[]>;
  news: { time: string; text: string }[];
  lastResults: string[];
  champion: string | null;
  runnerUp: string | null;
  third: string | null;
};

const firstNames = ["Alex", "Andre", "Bruno", "Caio", "Daniel", "Diego", "Edu", "Enzo", "Felipe", "Gabriel", "Hugo", "Igor", "Joao", "Kevin", "Leo", "Lucas", "Marco", "Nico", "Otavio", "Paulo", "Rafael", "Renan", "Samuel", "Tiago", "Victor", "Yuri"];
const lastNames = ["Almeida", "Arias", "Bento", "Costa", "Duarte", "Ferreira", "Gomes", "Herrera", "Jansen", "Kim", "Lopes", "Mendes", "Nakamura", "Oliveira", "Pereira", "Rocha", "Silva", "Torres", "Vargas", "Williams", "Zanetti"];
const money = { start: 12000000, win: 700000, draw: 250000, qualifyR32: 2500000, qualifyR16: 3500000, qualifyQF: 5000000, qualifySF: 7000000, final: 10000000, champion: 16000000 };

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sortBy<T>(values: T[], fn: (value: T) => number, desc = true) {
  return [...values].sort((a, b) => (desc ? fn(b) - fn(a) : fn(a) - fn(b)));
}

function cat(pos: string): Player["cat"] {
  if (pos === "GOL") return "GOL";
  if (["LD", "LE", "ZAG"].includes(pos)) return "DEF";
  if (["VOL", "MC", "MEI"].includes(pos)) return "MEI";
  return "ATA";
}

function calcOvr(player: Omit<Player, "ovr" | "value">) {
  if (player.pos === "GOL") return Math.round(player.gk * 0.55 + player.fis * 0.15 + player.tec * 0.15 + player.def * 0.15);
  if (["ZAG", "LD", "LE"].includes(player.pos)) return Math.round(player.def * 0.45 + player.fis * 0.25 + player.tec * 0.18 + player.atk * 0.12);
  if (["VOL", "MC", "MEI"].includes(player.pos)) return Math.round(player.tec * 0.36 + player.def * 0.22 + player.atk * 0.22 + player.fis * 0.2);
  return Math.round(player.atk * 0.45 + player.tec * 0.28 + player.fis * 0.18 + player.def * 0.09);
}

function makePlayer(teamId: string, rating: number, index: number, pos: string): Player {
  const r = rng(hash(`${teamId}-${pos}-${index}`));
  const base = rating + Math.round((r() - 0.5) * 18);
  const draft = {
    id: `${teamId}-${index}-${hash(pos + index) % 9999}`,
    name: `${firstNames[Math.floor(r() * firstNames.length)]} ${lastNames[Math.floor(r() * lastNames.length)]}`,
    pos,
    cat: cat(pos),
    number: index + 1,
    age: 18 + Math.floor(r() * 18),
    atk: clamp(base + (["ATA", "SA", "PE", "PD"].includes(pos) ? 8 : -3) + Math.round((r() - 0.5) * 12), 20, 99),
    def: clamp(base + (["ZAG", "LD", "LE", "VOL"].includes(pos) ? 7 : -7) + Math.round((r() - 0.5) * 12), 20, 99),
    tec: clamp(base + (["MEI", "MC", "PE", "PD", "SA"].includes(pos) ? 6 : 0) + Math.round((r() - 0.5) * 12), 20, 99),
    fis: clamp(base + (["ZAG", "VOL", "ATA"].includes(pos) ? 4 : 0) + Math.round((r() - 0.5) * 12), 20, 99),
    gk: pos === "GOL" ? clamp(base + Math.round(r() * 10), 50, 99) : clamp(30 + Math.round(r() * 20), 20, 65),
    form: clamp(62 + Math.round(r() * 30), 35, 99),
    fitness: clamp(78 + Math.round(r() * 22), 50, 100),
    morale: clamp(58 + Math.round(r() * 34), 40, 100),
    goals: 0,
    assists: 0,
    yellows: 0,
    reds: 0,
    injury: 0,
    susp: 0,
    matches: 0
  };
  const ovr = calcOvr(draft);
  return { ...draft, ovr, value: Math.round((ovr * ovr * 1100 + (28 - draft.age) * 18000) / 10000) * 10000 };
}

export function createGame(managers: { name: string; teamId: string }[]): GameState {
  const teams: GameState["teams"] = {};
  const players: GameState["players"] = {};

  for (const team of TEAMS) {
    players[team.id] = POSITIONS.map((pos, index) => makePlayer(team.id, team.rating, index, pos));
    teams[team.id] = {
      formation: "4-3-3",
      mentality: "equilibrado",
      pressing: "media",
      passing: "misto",
      marking: "zona",
      morale: 70,
      balance: money.start + Math.round((team.rating - 75) * 350000),
      lineup: [],
      eliminated: false
    };
  }

  const state: GameState = {
    version: "0.1.0",
    phase: "groups",
    groupRound: 1,
    koRound: null,
    managers,
    teams,
    players,
    matches: [],
    knockout: { r32: [], r16: [], qf: [], sf: [], third: [], final: [] },
    news: [{ time: "Pre-Copa", text: "A sala foi criada. Convide seus amigos, ajustem as taticas e simulem a primeira rodada." }],
    lastResults: [],
    champion: null,
    runnerUp: null,
    third: null
  };

  generateFixtures(state);
  Object.keys(teams).forEach((teamId) => autoLineup(state, teamId));
  return state;
}

function generateFixtures(state: GameState) {
  let id = 1;
  for (const group of GROUPS) {
    const ids = TEAMS.filter((team) => team.group === group).map((team) => team.id);
    const rounds = [[[ids[0], ids[1]], [ids[2], ids[3]]], [[ids[0], ids[2]], [ids[3], ids[1]]], [[ids[3], ids[0]], [ids[1], ids[2]]]];
    rounds.forEach((pairs, roundIndex) => {
      pairs.forEach(([home, away]) => {
        state.matches.push({ id: `G${id++}`, phase: "groups", group, round: roundIndex + 1, home, away, status: "scheduled", hg: null, ag: null, winner: null, events: [], pen: null, extra: false });
      });
    });
  }
}

export function autoLineup(state: GameState, teamId: string) {
  const formation = FORMATIONS[state.teams[teamId].formation] ?? FORMATIONS["4-3-3"];
  const squad = state.players[teamId].filter((player) => player.injury <= 0 && player.susp <= 0);
  const chosen: string[] = [];
  (["GOL", "DEF", "MEI", "ATA"] as Player["cat"][]).forEach((slot) => {
    sortBy(squad.filter((player) => player.cat === slot && !chosen.includes(player.id)), (player) => player.ovr + player.form * 0.18 + player.fitness * 0.14 + player.morale * 0.1).slice(0, formation[slot]).forEach((player) => chosen.push(player.id));
  });
  sortBy(squad.filter((player) => !chosen.includes(player.id)), (player) => player.ovr).slice(0, 11 - chosen.length).forEach((player) => chosen.push(player.id));
  state.teams[teamId].lineup = chosen.slice(0, 11);
}

export function starters(state: GameState, teamId: string) {
  const lineup = state.teams[teamId].lineup.map((id) => state.players[teamId].find((player) => player.id === id)).filter(Boolean) as Player[];
  if (lineup.filter((player) => player.injury <= 0 && player.susp <= 0).length < 11) autoLineup(state, teamId);
  return state.teams[teamId].lineup.map((id) => state.players[teamId].find((player) => player.id === id)).filter(Boolean) as Player[];
}

export function teamPower(state: GameState, teamId: string) {
  const team = state.teams[teamId];
  const squad = starters(state, teamId);
  const goalkeepers = squad.filter((player) => player.cat === "GOL");
  const defenders = squad.filter((player) => player.cat === "DEF");
  const mids = squad.filter((player) => player.cat === "MEI");
  const attackers = squad.filter((player) => player.cat === "ATA");
  const baseOvr = avg(squad.map((player) => player.ovr));
  const fitness = avg(squad.map((player) => player.fitness));
  const form = avg(squad.map((player) => player.form));
  const morale = avg(squad.map((player) => player.morale));
  let attack = avg(attackers.map((player) => player.atk)) * 0.52 + avg(mids.map((player) => player.tec)) * 0.28 + form * 0.12 + baseOvr * 0.08;
  let defense = avg(defenders.map((player) => player.def)) * 0.45 + avg(mids.map((player) => player.def)) * 0.22 + avg(goalkeepers.map((player) => player.gk)) * 0.25 + baseOvr * 0.08;
  let control = avg(mids.map((player) => player.tec)) * 0.45 + avg(squad.map((player) => player.tec)) * 0.25 + baseOvr * 0.3;
  if (team.mentality === "ofensivo") { attack += 5; defense -= 3; }
  if (team.mentality === "defensivo") { defense += 5; attack -= 3; }
  if (team.mentality === "contra-ataque") { attack += 2; defense += 2; control -= 2; }
  if (team.pressing === "alta") { attack += 2; defense += 1; control += 1; }
  if (team.passing === "curto") { control += 3; attack += 1; }
  if (team.passing === "direto") { attack += 3; control -= 2; }
  const condition = (fitness - 75) * 0.16 + (form - 70) * 0.12 + (morale - 70) * 0.1;
  return { attack: attack + condition, defense: defense + condition, control: control + condition, overall: baseOvr + condition, fitness, form, morale };
}

function poisson(lambda: number, r: () => number) {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= r();
  } while (p > limit && k < 10);
  return k - 1;
}

function simulateMatch(state: GameState, match: Match, knockout = false) {
  const random = rng(hash(`${match.id}-${Date.now()}-${JSON.stringify(state.teams[match.home])}-${JSON.stringify(state.teams[match.away])}`));
  const home = teamPower(state, match.home);
  const away = teamPower(state, match.away);
  const hxg = clamp(1.15 + (home.attack - away.defense) * 0.055 + (home.control - away.control) * 0.018 + (random() - 0.5) * 0.32, 0.15, 4.2);
  const axg = clamp(1.0 + (away.attack - home.defense) * 0.055 + (away.control - home.control) * 0.018 + (random() - 0.5) * 0.32, 0.15, 4.2);
  let hg = poisson(hxg, random);
  let ag = poisson(axg, random);
  const homePlayers = starters(state, match.home);
  const awayPlayers = starters(state, match.away);
  const events: Match["events"] = [];

  const addGoal = (side: "H" | "A", minute: number) => {
    const teamId = side === "H" ? match.home : match.away;
    const squad = side === "H" ? homePlayers : awayPlayers;
    const candidates = squad.filter((player) => player.cat === "ATA").concat(squad.filter((player) => player.cat === "MEI"), squad);
    const scorer = candidates[Math.floor(random() * candidates.length)];
    const assister = squad.filter((player) => player.id !== scorer.id && player.cat !== "GOL")[Math.floor(random() * Math.max(1, squad.length - 1))];
    scorer.goals++;
    if (assister) assister.assists++;
    events.push({ minute, type: "goal", team: teamId, text: `${scorer.name} marcou${assister ? ` apos passe de ${assister.name}` : ""}.` });
  };

  const goalMinutes: ["H" | "A", number][] = [];
  for (let i = 0; i < hg; i++) goalMinutes.push(["H", 5 + Math.floor(random() * 85)]);
  for (let i = 0; i < ag; i++) goalMinutes.push(["A", 5 + Math.floor(random() * 85)]);
  goalMinutes.sort((a, b) => a[1] - b[1]).forEach(([side, minute]) => addGoal(side, minute));

  for (const [side, squad] of [["H", homePlayers], ["A", awayPlayers]] as const) {
    const teamId = side === "H" ? match.home : match.away;
    if (random() < 0.42) {
      const player = squad[Math.floor(random() * squad.length)];
      player.yellows++;
      events.push({ minute: 12 + Math.floor(random() * 75), type: "yellow", team: teamId, text: `Cartao amarelo para ${player.name}.` });
    }
    if (random() < 0.08) {
      const player = squad[Math.floor(random() * squad.length)];
      player.reds++;
      player.susp = 1;
      events.push({ minute: 35 + Math.floor(random() * 50), type: "red", team: teamId, text: `${player.name} foi expulso e esta suspenso.` });
    }
    if (random() < 0.1) {
      const player = squad[Math.floor(random() * squad.length)];
      player.injury = 1 + Math.floor(random() * 3);
      events.push({ minute: 18 + Math.floor(random() * 65), type: "injury", team: teamId, text: `${player.name} saiu lesionado por ${player.injury} jogo(s).` });
    }
  }

  let pen: Match["pen"] = null;
  let extra = false;
  if (knockout && hg === ag) {
    extra = true;
    const bonus = (home.overall - away.overall) * 0.015 + (random() - 0.5) * 0.9;
    if (Math.abs(bonus) > 0.55) {
      if (bonus > 0) hg++;
      else ag++;
      events.push({ minute: 105 + Math.floor(random() * 15), type: "goal", team: bonus > 0 ? match.home : match.away, text: "Gol na prorrogacao." });
    }
    if (hg === ag) {
      const hp = 3 + Math.floor(random() * 3);
      let ap = 3 + Math.floor(random() * 3);
      if (hp === ap) ap = hp === 5 ? 4 : hp + 1;
      pen = { home: hp, away: ap };
      events.push({ minute: 120, type: "penalty", team: hp > ap ? match.home : match.away, text: `Decisao por penaltis: ${hp} x ${ap}.` });
    }
  }

  const winner = knockout ? (hg > ag ? match.home : ag > hg ? match.away : pen && pen.home > pen.away ? match.home : match.away) : null;
  Object.assign(match, { status: "complete", hg, ag, winner, pen, extra, events: events.sort((a, b) => a.minute - b.minute) });

  [match.home, match.away].forEach((teamId) => {
    const won = winner ? winner === teamId : (teamId === match.home ? hg > ag : ag > hg);
    const drew = !winner && hg === ag;
    state.teams[teamId].morale = clamp(state.teams[teamId].morale + (won ? 6 : drew ? 1 : -5), 0, 100);
    state.teams[teamId].balance += won ? money.win : drew ? money.draw : 0;
    starters(state, teamId).forEach((player) => {
      player.matches++;
      player.fitness = clamp(player.fitness - (knockout ? 10 : 8) - Math.floor(random() * 6), 20, 100);
      player.form = clamp(player.form + Math.round((random() - 0.45) * 5), 30, 100);
    });
  });

  state.lastResults.unshift(match.id);
  state.news.unshift({ time: match.phase === "groups" ? `Grupo ${match.group} - Rodada ${match.round}` : roundLabel(match.phase), text: `${name(match.home)} ${hg}${pen ? ` (${pen.home})` : ""} x ${ag}${pen ? ` (${pen.away})` : ""} ${name(match.away)}` });
}

function decay(state: GameState) {
  Object.values(state.players).flat().forEach((player) => {
    if (player.injury > 0) player.injury--;
    if (player.susp > 0) player.susp--;
    player.fitness = clamp(player.fitness + 10, 20, 100);
  });
}

export function groupStandings(state: GameState, group: string) {
  const rows = TEAMS.filter((team) => team.group === group).map((team) => ({ teamId: team.id, team: team.name, group, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, rating: team.rating }));
  state.matches.filter((match) => match.phase === "groups" && match.group === group && match.status === "complete").forEach((match) => {
    const home = rows.find((row) => row.teamId === match.home)!;
    const away = rows.find((row) => row.teamId === match.away)!;
    home.mp++; away.mp++; home.gf += match.hg ?? 0; home.ga += match.ag ?? 0; away.gf += match.ag ?? 0; away.ga += match.hg ?? 0;
    if ((match.hg ?? 0) > (match.ag ?? 0)) { home.w++; home.pts += 3; away.l++; }
    else if ((match.hg ?? 0) < (match.ag ?? 0)) { away.w++; away.pts += 3; home.l++; }
    else { home.d++; away.d++; home.pts++; away.pts++; }
  });
  rows.forEach((row) => { row.gd = row.gf - row.ga; });
  return rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || b.rating - a.rating);
}

function makeKnockout(state: GameState) {
  const standings = GROUPS.flatMap((group) => groupStandings(state, group).map((row, index) => ({ ...row, pos: index + 1 })));
  const winners = standings.filter((row) => row.pos === 1);
  const runners = standings.filter((row) => row.pos === 2);
  const thirds = standings.filter((row) => row.pos === 3).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || b.rating - a.rating).slice(0, 8);
  const ranked = (row: { pts: number; gd: number; gf: number; rating: number }) => row.pts * 100 + row.gd * 15 + row.gf * 4 + row.rating * 0.3;
  const high = [...winners, ...sortBy(runners, ranked).slice(0, 4)].sort((a, b) => ranked(b) - ranked(a));
  const low = [...sortBy(runners, ranked).slice(4), ...thirds].sort((a, b) => ranked(a) - ranked(b));
  const qualified = new Set([...high, ...low].map((row) => row.teamId));
  TEAMS.forEach((team) => { state.teams[team.id].eliminated = !qualified.has(team.id); });
  const used = new Set<string>();
  state.knockout.r32 = high.map((home, index) => {
    let opponentIndex = low.findIndex((row) => !used.has(row.teamId) && row.group !== home.group);
    if (opponentIndex < 0) opponentIndex = low.findIndex((row) => !used.has(row.teamId));
    const opponent = low[opponentIndex];
    used.add(opponent.teamId);
    return { id: `K${index + 1}`, phase: "r32", home: home.teamId, away: opponent.teamId, status: "scheduled", hg: null, ag: null, winner: null, events: [], pen: null, extra: false } satisfies Match;
  });
  state.phase = "knockout";
  state.koRound = "r32";
  state.news.unshift({ time: "Mata-mata", text: "Os 32 classificados foram definidos e as chaves foram montadas." });
}

function advanceKnockout(state: GameState, current: NonNullable<GameState["koRound"]>) {
  const matches = state.knockout[current];
  if (current === "sf") {
    const winners = matches.map((match) => match.winner!);
    const losers = matches.map((match) => match.winner === match.home ? match.away : match.home);
    state.knockout.third = [{ id: "K3P", phase: "third", home: losers[0], away: losers[1], status: "scheduled", hg: null, ag: null, winner: null, events: [], pen: null, extra: false }];
    state.knockout.final = [{ id: "KF", phase: "final", home: winners[0], away: winners[1], status: "scheduled", hg: null, ag: null, winner: null, events: [], pen: null, extra: false }];
    state.koRound = "third";
    return;
  }
  if (current === "third") {
    state.third = matches[0].winner;
    state.koRound = "final";
    return;
  }
  if (current === "final") {
    state.champion = matches[0].winner;
    state.runnerUp = matches[0].winner === matches[0].home ? matches[0].away : matches[0].home;
    state.phase = "finished";
    state.news.unshift({ time: "Final", text: `${name(state.champion!)} e campeao da Copa Manager 2026.` });
    return;
  }
  const next = ({ r32: "r16", r16: "qf", qf: "sf" } as const)[current as "r32" | "r16" | "qf"];
  const winners = matches.map((match) => match.winner!);
  state.knockout[next] = [];
  for (let i = 0; i < winners.length; i += 2) {
    state.knockout[next].push({ id: `K-${next}-${i / 2 + 1}`, phase: next, home: winners[i], away: winners[i + 1], status: "scheduled", hg: null, ag: null, winner: null, events: [], pen: null, extra: false });
  }
  state.koRound = next;
}

export function simulateNext(state: GameState) {
  if (state.phase === "groups") {
    state.lastResults = [];
    state.matches.filter((match) => match.phase === "groups" && match.round === state.groupRound && match.status === "scheduled").forEach((match) => simulateMatch(state, match, false));
    decay(state);
    if (state.groupRound >= 3) makeKnockout(state);
    else state.groupRound++;
    return state;
  }
  if (state.phase === "knockout" && state.koRound) {
    state.lastResults = [];
    state.knockout[state.koRound].filter((match) => match.status === "scheduled").forEach((match) => simulateMatch(state, match, true));
    decay(state);
    advanceKnockout(state, state.koRound);
  }
  return state;
}

export function updateTactics(state: GameState, teamId: string, input: Partial<GameState["teams"][string]>) {
  if (!state.teams[teamId]) return state;
  state.teams[teamId] = { ...state.teams[teamId], ...input };
  autoLineup(state, teamId);
  state.news.unshift({ time: "Tatica", text: `${name(teamId)} atualizou sua estrategia.` });
  return state;
}

export function name(teamId: string) {
  return teamById(teamId)?.name ?? teamId;
}

export function roundLabel(round: string) {
  return ({ r32: "32 avos", r16: "Oitavas", qf: "Quartas", sf: "Semifinal", third: "3o lugar", final: "Final", groups: "Grupos" } as Record<string, string>)[round] ?? round;
}
