// Wspólny schemat głowic (rdzeń). Bez DOM i bez grafiki.
export interface Pin  { id: string; x: number; y: number; d: number; h: number; groove: number; step: number }
export interface Bolt { id: string; R: number; d: number; h: number; angle: number; groove: number; step: number }
export interface Station {            // = "przebieg" z konfiguratora (para robocza)
  id: number; name: string; toolType: number;
  activeBolt: string; passivePin: string; supportPin: string;
  direction: 'left' | 'right'; step: number; feedDuringBend: boolean;
  headRotationW: number; boltAngle: number | null;
}
export interface Head {
  id: string; name: string; wireDia: number; headDia: number;
  headContactHeight: number; housingWidth: number; sleeveDistance: number;
  pins: Pin[]; bolts: Bolt[]; stations: Station[];
}
const n = (v: unknown, d = 0) => { const x = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v); return Number.isFinite(x) ? x : d; };

function toHead(raw: any, id: string): Head {
  const pins: Pin[] = (raw.pins ?? []).map((p: any) => ({ id: String(p.id ?? 'D'), x: n(p.x), y: n(p.y), d: n(p.d, 5), h: n(p.h, 5.5), groove: n(p.groove ?? p.g), step: n(p.step ?? p.st, 1) }));
  const bolts: Bolt[] = (raw.bolts ?? []).map((b: any) => ({ id: String(b.id ?? 'S'), R: n(b.R ?? b.r), d: n(b.d, 10), h: n(b.h, 8), angle: n(b.angle ?? b.ang), groove: n(b.groove ?? b.g), step: n(b.step ?? b.st, 1) }));
  const stations: Station[] = (raw.passes ?? []).map((p: any, i: number): Station => ({
    id: n(p.id, i + 1), name: String(p.name ?? `Przebieg ${i + 1}`), toolType: n(p.toolType, 5),
    activeBolt: String(p.activeBolt ?? bolts[0]?.id ?? ''),
    passivePin: String((Array.isArray(p.passivePins) ? p.passivePins[0] : p.passivePin) ?? ''),
    supportPin: String(p.supportPin ?? ''),
    direction: /lew|left/i.test(String(p.direction ?? '')) ? 'left' : 'right',
    step: n(p.step, 1), feedDuringBend: p.feedDuringBend === true,
    headRotationW: n(p.headRotationW), boltAngle: p.manualBoltAngle ? n(p.boltAngleOverride) : null }));
  return { id, name: String(raw.name ?? 'Głowica'), wireDia: n(raw.wireDia, 4.5), headDia: n(raw.headDia, 45),
    headContactHeight: n(raw.headContactHeight, 35), housingWidth: n(raw.housingWidth, 65),
    sleeveDistance: n(raw.sleeveDistance, 87), pins, bolts, stations };
}

/** Import pliku JSON z konfiguratora: bieżąca konfiguracja + wszystkie zapisane. */
export function importHeads(json: unknown): Head[] {
  const raw = json as any;
  if (!raw || typeof raw !== 'object') throw new Error('Plik nie jest poprawnym JSON-em konfiguracji.');
  const heads: Head[] = [toHead(raw, 'current')];
  (raw.savedConfigurations ?? []).forEach((s: any, i: number) => heads.push(toHead(s.data ?? s, s.id ?? `saved_${i}`)));
  return heads;
}

/** Walidacja spójności: odwołania stacji do istniejących narzędzi. */
export function validateHead(h: Head): string[] {
  const out: string[] = [];
  const pin = new Set(h.pins.map(p => p.id)), bolt = new Set(h.bolts.map(b => b.id));
  for (const s of h.stations) {
    if (!bolt.has(s.activeBolt)) out.push(`${s.name}: brak bolca ${s.activeBolt}`);
    if (s.passivePin && !pin.has(s.passivePin)) out.push(`${s.name}: brak trzpienia ${s.passivePin}`);
    if (s.supportPin && !pin.has(s.supportPin)) out.push(`${s.name}: brak podpory ${s.supportPin}`);
  }
  return out;
}
