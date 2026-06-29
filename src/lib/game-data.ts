export type TeamInfo = {
  id: string;
  name: string;
  flag: string;
  group: string;
  rating: number;
  style: string;
};

export const GROUPS = "ABCDEFGHIJKL".split("");

export const TEAMS: TeamInfo[] = [
  { id: "mex", name: "Mexico", flag: "MX", group: "A", rating: 82, style: "equilibrado" },
  { id: "rsa", name: "Africa do Sul", flag: "ZA", group: "A", rating: 73, style: "transicao" },
  { id: "kor", name: "Coreia do Sul", flag: "KR", group: "A", rating: 79, style: "velocidade" },
  { id: "cze", name: "Tchequia", flag: "CZ", group: "A", rating: 77, style: "forca" },
  { id: "can", name: "Canada", flag: "CA", group: "B", rating: 80, style: "velocidade" },
  { id: "bih", name: "Bosnia", flag: "BA", group: "B", rating: 76, style: "tecnico" },
  { id: "qat", name: "Catar", flag: "QA", group: "B", rating: 72, style: "posse" },
  { id: "sui", name: "Suica", flag: "CH", group: "B", rating: 83, style: "organizado" },
  { id: "bra", name: "Brasil", flag: "BR", group: "C", rating: 90, style: "tecnico" },
  { id: "mar", name: "Marrocos", flag: "MA", group: "C", rating: 84, style: "compacto" },
  { id: "hai", name: "Haiti", flag: "HT", group: "C", rating: 69, style: "transicao" },
  { id: "sco", name: "Escocia", flag: "SCO", group: "C", rating: 78, style: "forca" },
  { id: "usa", name: "Estados Unidos", flag: "US", group: "D", rating: 83, style: "pressao" },
  { id: "par", name: "Paraguai", flag: "PY", group: "D", rating: 77, style: "compacto" },
  { id: "aus", name: "Australia", flag: "AU", group: "D", rating: 76, style: "forca" },
  { id: "tur", name: "Turquia", flag: "TR", group: "D", rating: 80, style: "intenso" },
  { id: "ger", name: "Alemanha", flag: "DE", group: "E", rating: 88, style: "posse" },
  { id: "cuw", name: "Curacao", flag: "CW", group: "E", rating: 70, style: "transicao" },
  { id: "civ", name: "Costa do Marfim", flag: "CI", group: "E", rating: 79, style: "fisico" },
  { id: "ecu", name: "Equador", flag: "EC", group: "E", rating: 82, style: "intenso" },
  { id: "ned", name: "Paises Baixos", flag: "NL", group: "F", rating: 87, style: "posse" },
  { id: "jpn", name: "Japao", flag: "JP", group: "F", rating: 82, style: "mobilidade" },
  { id: "swe", name: "Suecia", flag: "SE", group: "F", rating: 80, style: "forca" },
  { id: "tun", name: "Tunisia", flag: "TN", group: "F", rating: 75, style: "compacto" },
  { id: "bel", name: "Belgica", flag: "BE", group: "G", rating: 86, style: "tecnico" },
  { id: "egy", name: "Egito", flag: "EG", group: "G", rating: 79, style: "transicao" },
  { id: "irn", name: "Ira", flag: "IR", group: "G", rating: 78, style: "compacto" },
  { id: "nzl", name: "Nova Zelandia", flag: "NZ", group: "G", rating: 68, style: "forca" },
  { id: "esp", name: "Espanha", flag: "ES", group: "H", rating: 90, style: "posse" },
  { id: "cpv", name: "Cabo Verde", flag: "CV", group: "H", rating: 72, style: "transicao" },
  { id: "ksa", name: "Arabia Saudita", flag: "SA", group: "H", rating: 74, style: "posse" },
  { id: "uru", name: "Uruguai", flag: "UY", group: "H", rating: 86, style: "intenso" },
  { id: "fra", name: "Franca", flag: "FR", group: "I", rating: 92, style: "velocidade" },
  { id: "sen", name: "Senegal", flag: "SN", group: "I", rating: 82, style: "fisico" },
  { id: "irq", name: "Iraque", flag: "IQ", group: "I", rating: 72, style: "compacto" },
  { id: "nor", name: "Noruega", flag: "NO", group: "I", rating: 84, style: "vertical" },
  { id: "arg", name: "Argentina", flag: "AR", group: "J", rating: 91, style: "tecnico" },
  { id: "alg", name: "Argelia", flag: "DZ", group: "J", rating: 80, style: "transicao" },
  { id: "aut", name: "Austria", flag: "AT", group: "J", rating: 81, style: "pressao" },
  { id: "jor", name: "Jordania", flag: "JO", group: "J", rating: 69, style: "compacto" },
  { id: "por", name: "Portugal", flag: "PT", group: "K", rating: 89, style: "tecnico" },
  { id: "cod", name: "RD Congo", flag: "CD", group: "K", rating: 75, style: "fisico" },
  { id: "uzb", name: "Uzbequistao", flag: "UZ", group: "K", rating: 73, style: "organizado" },
  { id: "col", name: "Colombia", flag: "CO", group: "K", rating: 84, style: "tecnico" },
  { id: "eng", name: "Inglaterra", flag: "EN", group: "L", rating: 89, style: "posse" },
  { id: "cro", name: "Croacia", flag: "HR", group: "L", rating: 85, style: "tecnico" },
  { id: "gha", name: "Gana", flag: "GH", group: "L", rating: 77, style: "fisico" },
  { id: "pan", name: "Panama", flag: "PA", group: "L", rating: 71, style: "transicao" }
];

export const FORMATIONS = {
  "4-3-3": { GOL: 1, DEF: 4, MEI: 3, ATA: 3 },
  "4-4-2": { GOL: 1, DEF: 4, MEI: 4, ATA: 2 },
  "4-2-3-1": { GOL: 1, DEF: 4, MEI: 5, ATA: 1 },
  "3-5-2": { GOL: 1, DEF: 3, MEI: 5, ATA: 2 },
  "5-3-2": { GOL: 1, DEF: 5, MEI: 3, ATA: 2 }
} as const;

export const POSITIONS = ["GOL", "GOL", "GOL", "LD", "ZAG", "ZAG", "LE", "ZAG", "LD", "LE", "VOL", "VOL", "MC", "MC", "MEI", "MEI", "PE", "PD", "ATA", "ATA", "SA", "MEI", "ZAG"];

export function teamById(id: string) {
  return TEAMS.find((team) => team.id === id);
}
