export type IntelligenceLevel = 0 | 1 | 2 | 3;
export type Observation = { price: number; quantity: number; fee: number; intelligenceCentre?: IntelligenceLevel };
export type Item = { id: string; name: string; short: string; basePrice: number; noFlea?: boolean; isKey?: boolean; source?: "api" | "manual" | "inferred"; observations?: Observation[] };
export type Settings = { offer: number; requirement: number; intelligenceCentre?: IntelligenceLevel };
export const DEFAULT_RATES: Settings = { offer: .05, requirement: .05 };
export const SEEDS: Item[] = [
  { id: "590c311186f77424d1667482", name: "Wrench", short: "WR", basePrice: 3544, source: "api", observations: [
    { price: 30000, quantity: 1, fee: 5435 }, { price: 100000, quantity: 1, fee: 39710 },
    { price: 182600, quantity: 1, fee: 108785 }, { price: 200000, quantity: 1, fee: 126749 },
  ] },
  { id: "59e3606886f77417674759a5", name: "Bottle of Saline Solution", short: "NaCl", basePrice: 8508, source: "api", observations: [
    { price: 10000, quantity: 1, fee: 927 }, { price: 50000, quantity: 1, fee: 7249 }, { price: 100000, quantity: 1, fee: 22319 },
    { price: 10000, quantity: 3, fee: 2781 }, { price: 50000, quantity: 3, fee: 21746 }, { price: 100000, quantity: 3, fee: 66956 },
  ] },
];
export const MAX_PRICE = 5_000_000, MAX_BASE = 100_000_000, MAX_QUANTITY = 1000;
export function validInteger(n: number, min: number, max: number) { return Number.isSafeInteger(n) && n >= min && n <= max; }
export function validBase(n: number) { return Number.isFinite(n) && n >= 1 && n <= MAX_BASE; }
export function intelligenceMultiplier(level: number = 1): number {
  if (!validInteger(level, 0, 3)) throw new RangeError("Intelligence Centre level must be 0, 1, 2 or 3.");
  return level === 3 ? 0.7 : 1;
}
export function isKeyItem(item: Item): boolean { return item.isKey ?? /\b(?:keys?|keycards?)\b/i.test(item.name); }
function assertRates(rates: Settings) { if (![rates.offer, rates.requirement].every(r => Number.isFinite(r) && r > 0 && r <= 1)) throw new RangeError("Invalid fee rates."); intelligenceMultiplier(rates.intelligenceCentre); }
// Shared fee formula; all inputs are per item. Multiply the unrounded fee by
// listing quantity before rounding once. IC3 reduces the unrounded fee by 30%.
export function rawUnitFee(base: number, price: number, rates: Settings = DEFAULT_RATES) {
  let po = Math.log10(base / price), pr = -po;
  if (price < base) po = Math.pow(po, 1.08); else pr = Math.pow(pr, 1.08);
  return (base * rates.offer * Math.pow(4, po) + price * rates.requirement * Math.pow(4, pr)) * intelligenceMultiplier(rates.intelligenceCentre);
}
export function formulaFee(base: number, price: number, quantity = 1, rates: Settings = DEFAULT_RATES) {
  if (!validBase(base) || !validInteger(price, 1, MAX_PRICE) || !validInteger(quantity, 1, MAX_QUANTITY)) throw new RangeError("Invalid base, price or quantity.");
  assertRates(rates);
  return Math.round(rawUnitFee(base, price, rates) * quantity);
}
export type Quote = { intelligenceCentre: IntelligenceLevel; price: number; quantity: number; revenue: number; fee: number; net: number; perItem: number; kind: "known" | "api" | "manualBase" | "inferred" | "manual" };
export function quote(item: Item, base: number, price: number, quantity: number, rates: Settings = DEFAULT_RATES, manualFee?: number): Quote {
  const predicted = formulaFee(base, price, quantity, rates);
  if (manualFee !== undefined && !validInteger(manualFee, 0, 1e12)) throw new RangeError("Invalid entered fee.");
  const known = item.observations?.some(p => p.price === price && p.quantity === quantity && p.fee === predicted && (p.intelligenceCentre ?? 1) === (rates.intelligenceCentre ?? 1));
  const fee = manualFee ?? predicted;
  const kind = manualFee !== undefined ? "manual" : known ? "known" : base !== item.basePrice || item.source === "manual" ? "manualBase" : item.source === "inferred" ? "inferred" : "api";
  const revenue = price * quantity, net = revenue - fee;
  return { intelligenceCentre: rates.intelligenceCentre ?? 1, price, quantity, revenue, fee, net, perItem: net / quantity, kind };
}
export function optimise(item: Item, base: number, quantity: number, min: number, max: number, rates: Settings = DEFAULT_RATES, override?: { price: number; fee: number }): Quote {
  if (!validInteger(min, 1, MAX_PRICE) || !validInteger(max, min, MAX_PRICE)) throw new RangeError("Invalid search range.");
  formulaFee(base, min, quantity, rates);
  if (override) quote(item, base, override.price, quantity, rates, override.fee);
  let bestPrice = min, bestNet = -Infinity;
  for (let price = min; price <= max; price++) {
    const fee = override?.price === price ? override.fee : Math.round(rawUnitFee(base, price, rates) * quantity);
    const net = price * quantity - fee;
    if (net > bestNet) { bestPrice = price; bestNet = net; }
  }
  return quote(item, base, bestPrice, quantity, rates, override?.price === bestPrice ? override.fee : undefined);
}
export type Calibration = { basePrice: number; maxError: number; matches: number; count: number; ambiguous: boolean; errors: number[] };
export function inferBase(points: Observation[], rates: Settings = DEFAULT_RATES): Calibration {
  assertRates(rates);
  if (!Array.isArray(points) || points.length < 2 || points.length > 20 || points.some(p => !p || typeof p !== "object") || new Set(points.map(p => p.price)).size < 2) throw new RangeError("Enter at least two different listing prices to infer a base price.");
  for (const p of points) if (!validInteger(p.price, 1, MAX_PRICE) || !validInteger(p.quantity, 1, MAX_QUANTITY) || !validInteger(p.fee, 1, 1e12) || !validInteger(p.intelligenceCentre ?? rates.intelligenceCentre ?? 1, 0, 3)) throw new RangeError("Invalid observed point.");
  const score = (logBase: number) => points.reduce((s, p) => s + Math.pow((rawUnitFee(Math.exp(logBase), p.price, {...rates, intelligenceCentre:p.intelligenceCentre ?? rates.intelligenceCentre ?? 1}) * p.quantity - p.fee) / Math.max(p.fee, 1), 2), 0);
  // Search the entire permitted base range in log space, refine every basin,
  // then check neighboring integer bases. A single fee can have two solutions.
  const steps = 2200, top = Math.log(MAX_BASE), step = top / steps;
  const scores = Array.from({ length: steps + 1 }, (_, i) => score(i * step));
  const candidates = new Set<number>([1, MAX_BASE]);
  for (let i = 0; i <= steps; i++) if ((i === 0 || scores[i] <= scores[i - 1]) && (i === steps || scores[i] <= scores[i + 1])) {
    let lo = Math.max(0, (i - 1) * step), hi = Math.min(top, (i + 1) * step);
    for (let j = 0; j < 65; j++) {
      const l = lo + (hi - lo) * .38196601125, r = lo + (hi - lo) * .61803398875;
      if (score(l) <= score(r)) hi = r; else lo = l;
    }
    const center = Math.round(Math.exp((lo + hi) / 2));
    for (let b = Math.max(1, center - 20); b <= Math.min(MAX_BASE, center + 20); b++) candidates.add(b);
  }
  const ranked = [...candidates].map(base => ({ base, score: score(Math.log(base)), errors: points.map(p => formulaFee(base, p.price, p.quantity, {...rates, intelligenceCentre:p.intelligenceCentre ?? rates.intelligenceCentre ?? 1}) - p.fee) })).sort((a, b) => {
    const aExact = a.errors.every(e => e === 0), bExact = b.errors.every(e => e === 0);
    return Number(bExact) - Number(aExact) || a.score - b.score || a.base - b.base;
  });
  const best = ranked[0];
  return { basePrice: best.base, maxError: Math.max(...best.errors.map(Math.abs)), matches: best.errors.filter(e => e === 0).length, count: points.length, ambiguous: ranked.filter(c => c.errors.every(e => e === 0)).length > 1, errors: best.errors };
}
export function mergeItems(catalogue: Item[], saved: Item[]): Item[] {
  const map = new Map<string, Item>(catalogue.map(i => [i.id, { ...i, source: "api" as const }]));
  for (const s of SEEDS) map.set(s.id, { ...(map.get(s.id) ?? s), observations: s.observations });
  for (const s of saved) {
    const observations = new Map([...(map.get(s.id)?.observations ?? []), ...(s.observations ?? [])].map(p => [`${p.price}:${p.quantity}:${p.intelligenceCentre ?? 1}`, p]));
    map.set(s.id, { ...map.get(s.id), ...s, observations: [...observations.values()] });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
export function parseSavedItems(value: unknown): Item[] {
  if (!Array.isArray(value)) return [];
  const items: Item[] = [];
  for (const raw of value.slice(0, 300)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const v = raw as Record<string, unknown>;
    if (typeof v.id !== "string" || !/^(?:[a-z0-9]{1,64}|custom:[a-f0-9-]{36})$/.test(v.id) ||
        typeof v.name !== "string" || !v.name.trim() || v.name.length > 140 ||
        typeof v.short !== "string" || v.short.length > 64 ||
        typeof v.basePrice !== "number" || !validBase(v.basePrice) ||
        (v.source !== "manual" && v.source !== "inferred")) continue;
    const observations: Observation[] = [];
    if (Array.isArray(v.observations)) for (const p of v.observations.slice(0, 20)) {
      if (p && typeof p === "object" && !Array.isArray(p) && validInteger(p.price, 1, MAX_PRICE) && validInteger(p.quantity, 1, MAX_QUANTITY) && validInteger(p.fee, 0, 1e12) && validInteger(p.intelligenceCentre ?? 1, 0, 3)) observations.push({price:p.price,quantity:p.quantity,fee:p.fee,intelligenceCentre:p.intelligenceCentre ?? 1});
    }
    items.push({id:v.id,name:v.name.trim(),short:v.short,basePrice:v.basePrice,source:v.source,noFlea:v.noFlea===true,...(typeof v.isKey === "boolean" ? {isKey:v.isKey} : {}),observations});
  }
  return items;
}
