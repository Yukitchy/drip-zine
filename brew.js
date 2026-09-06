// Pure brew math. No DOM. Checked by check.mjs.
export const round1 = x => Math.round(x * 10) / 10;

// "00:45" | "02:00 ~ 02:30" | "--:--" -> {sec, end}
export function parseTime(s) {
  if (!s || s.includes('--')) return { sec: null, end: null };
  const toSec = x => { const [m, ss] = x.trim().split(':').map(Number); return m * 60 + (ss || 0); };
  const [a, b] = s.split('~');
  return { sec: toSec(a), end: b ? toSec(b) : null };
}

export const fmt = sec => {
  sec = Math.max(0, Math.floor(sec || 0));
  return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
};

// Choose the pour list matching the selected adjustment inputs (taste / strength / roast).
export function pickPours(recipe, sel = {}) {
  if (!recipe.variants) return recipe.pours;
  const def = Object.fromEntries(recipe.inputs.map(i => [String(i.id), i.default]));
  const s = { ...def };
  for (const k in sel) s[k] = Number(sel[k]);
  if (Object.keys(s).every(k => def[k] === s[k])) return recipe.pours;
  const v = recipe.variants.find(v => Object.keys(s).every(k => v.sel[k] === s[k]));
  return v ? v.pours : recipe.pours;
}

// Scale a recipe to `coffee` grams. Water and every cumulative pour scale linearly; times stay fixed.
export function scale(recipe, pours, coffee) {
  const f = coffee / recipe.coffee;
  let prev = 0;
  const all = pours.map(p => {
    const { sec, end } = parseTime(p.t);
    const w = round1(p.w * f);
    const step = { ...p, sec, end, w, delta: round1(w - prev), ice: p.ice ? Math.round(p.ice * f) : undefined };
    prev = w;
    return step;
  });
  // Leading untimed zero-water steps are prep ("put ice in the server"), not pours.
  const pre = [];
  while (all.length && all[0].sec === null && all[0].w === 0) pre.push(all.shift());
  const steps = all;
  const manual = steps.some(s => s.sec === null);
  const total = manual ? null : Math.max(...steps.map(s => s.end ?? s.sec));
  const ice = Math.round(pours.reduce((a, p) => a + (p.ice || 0), 0) * f);
  const water = Math.round(recipe.water * f);
  // ponytail: cup estimate assumes grounds hold ~2.1 g water per g coffee; melted ice adds volume.
  const cup = Math.max(0, Math.round(water - coffee * 2.1 + ice));
  return { coffee, water, factor: f, pre, steps, manual, total, ice, cup };
}

// Index of the step in effect at elapsed seconds t (-1 before the first).
export function stepAt(steps, t) {
  let i = -1;
  steps.forEach((s, k) => { if (s.sec !== null && s.sec <= t) i = k; });
  return i;
}
