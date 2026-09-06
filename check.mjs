// node check.mjs — smallest thing that fails if the brew math breaks.
import assert from 'node:assert/strict';
import { RECIPES } from './data.js';
import { parseTime, fmt, pickPours, scale, stepAt } from './brew.js';
const by = s => RECIPES.find(r => r.slug === s);
assert.deepEqual(parseTime('00:45'), { sec: 45, end: null });
assert.deepEqual(parseTime('02:00 ~ 02:30'), { sec: 120, end: 150 });
assert.deepEqual(parseTime('--:--'), { sec: null, end: null });
assert.equal(fmt(210), '03:30');
// 4:6 method at 15 g scales water to 225 and pours to 45-step ladder; times untouched (matches baristai.net live behaviour)
const p46 = by('philocoffea-46'); const s = scale(p46, p46.pours, 15);
assert.equal(s.water, 225); assert.deepEqual(s.steps.map(x => x.w), [45, 90, 135, 180, 225, 225]); assert.equal(s.total, 210); assert.equal(s.steps[1].delta, 45); assert.equal(s.steps[5].delta, 0);
// variant pick: sweeter + lighter exists; unknown combo falls back to base
assert.equal(pickPours(p46, { 1: 0, 2: 0 }).length, 4); assert.equal(pickPours(p46, { 1: 1, 2: 2 }), p46.pours);
// iced: leading ice step becomes prep, ice scales
const ic = by('philocoffea-46-iced'); const si = scale(ic, ic.pours, 10);
assert.equal(si.pre.length, 1); assert.equal(si.ice, 40); assert.equal(si.water, 75); assert.ok(si.cup > 0);
// untimed recipe is manual
assert.equal(scale(by('hyuga-hot'), by('hyuga-hot').pours, 15).manual, true);
// stepAt
assert.equal(stepAt(s.steps, 0), 0); assert.equal(stepAt(s.steps, 44.9), 0); assert.equal(stepAt(s.steps, 45), 1); assert.equal(stepAt(s.steps, 999), 5);
// every recipe scales without NaN and every note has an English version
for (const r of RECIPES) { const x = scale(r, r.pours, r.coffee); assert.ok(x.steps.every(st => Number.isFinite(st.w)), r.slug); assert.ok(x.steps.length > 0, r.slug); for (const p of r.pours) assert.ok(!p.note.ja || p.note.en, r.slug + ' missing en note'); }
console.log('ok', RECIPES.length, 'recipes');
